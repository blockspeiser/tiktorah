/**
 * useFeed Hook - Provides feed cards to the UI
 *
 * This hook connects the FeedEngine to React, handling:
 * - Initialization when data sources are ready
 * - Pulling cards from ready queue as user scrolls
 * - Preference change handling
 * - Building meme and comment cards from raw data
 *
 * Key concepts:
 * - displayedCards: Cards currently shown in the FlatList (grows as user scrolls)
 * - readyQueue: Buffer of prepared cards in the engine (pulled from to grow displayedCards)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSefaria } from '@/contexts/SefariaContext';
import { useMemesFeed } from '@/hooks/useMemesFeed';
import { useCommentsFeed } from '@/hooks/useCommentsFeed';
import { useFeedPreferences } from '@/hooks/useFeedPreferences';
import { buildCardPool } from '@/services/cardGenerator';
import { feedEngine, hasEnabledContent } from '@/services/feedEngine';
import { FeedCard, MemeFeedCard, CommentFeedCard } from '@/types/cards';
import { getMemeDownloadUrl } from '@/lib/storage';
import { getProfile } from '@/lib/firestore';
import { subscribeFeedPreferences } from '@/lib/preferences';

// Loading card placeholder
const LOADING_CARD: FeedCard = {
  id: '__loading__',
  type: 'loading',
  title: '',
  description: '',
};

// How many cards ahead we want to keep in displayedCards
const BUFFER_AHEAD = 5;

const DEBUG = true;
const log = (...args: unknown[]) => DEBUG && console.log('[useFeed]', ...args);

interface UseFeedResult {
  /** Cards to display in FlatList */
  cards: FeedCard[];
  /** Whether initial data is still loading */
  loading: boolean;
  /** Whether there's no content enabled in preferences */
  noContent: boolean;
  /** Called when user scrolls to a new index - triggers pulling more cards */
  onScrollToIndex: (index: number) => void;
}

export function useFeed(): UseFeedResult {
  const { index, topics } = useSefaria();
  const { memes, loading: memesLoading } = useMemesFeed();
  const { comments, loading: commentsLoading } = useCommentsFeed();
  const { preferences, loading: preferencesLoading } = useFeedPreferences();

  // displayedCards = cards currently in the FlatList
  const [displayedCards, setDisplayedCards] = useState<FeedCard[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  // Increment to force effect re-run after async init completes
  const [initTrigger, setInitTrigger] = useState(0);

  // Track current scroll position
  const currentIndexRef = useRef(0);

  // Refs to avoid stale closures
  const ownerProfilesRef = useRef<Record<string, {
    displayName?: string | null;
    profileLink?: string | null;
    photoURL?: string | null;
  }>>({});
  const initializingRef = useRef(false);
  const lastDataVersionRef = useRef('');

  // Fetch owner profiles for memes/comments
  useEffect(() => {
    const ownerUids = new Set<string>();
    memes.forEach((m) => m.data.ownerUid && ownerUids.add(m.data.ownerUid));
    comments.forEach((c) => c.data.ownerUid && ownerUids.add(c.data.ownerUid));

    const missing = Array.from(ownerUids).filter((uid) => !(uid in ownerProfilesRef.current));
    if (missing.length === 0) return;

    Promise.all(
      missing.map(async (uid) => {
        try {
          const snap = await getProfile(uid);
          if (!snap.exists()) return [uid, null] as const;
          const data = snap.data();
          return [uid, {
            displayName: data.displayName,
            profileLink: data.profileLink,
            photoURL: data.photoURL,
          }] as const;
        } catch {
          return [uid, null] as const;
        }
      })
    ).then((entries) => {
      entries.forEach(([uid, data]) => {
        if (data) ownerProfilesRef.current[uid] = data;
      });
    });
  }, [memes, comments]);

  // Build meme cards from raw data
  const buildMemeCards = useCallback(async (): Promise<MemeFeedCard[]> => {
    if (memes.length === 0) return [];

    const cards = await Promise.all(
      memes.map(async (meme) => {
        const imageUrl = await getMemeDownloadUrl(meme.data.storagePath).catch(() => '');
        const owner = ownerProfilesRef.current[meme.data.ownerUid] || {};
        return {
          id: `meme-${meme.id}`,
          type: 'meme' as const,
          title: meme.data.caption?.trim() || 'Meme',
          description: meme.data.citationText || meme.data.caption || 'User meme',
          imageUrl,
          caption: meme.data.caption ?? null,
          ownerDisplayName: owner.displayName || 'User',
          ownerProfileLink: owner.profileLink || null,
          ownerPhotoURL: owner.photoURL || null,
          citation: meme.data.citation ?? null,
          citationText: meme.data.citationText ?? null,
          citationCategory: meme.data.citationCategory ?? null,
          memeLink: meme.data.memeLink ?? null,
        };
      })
    );
    return cards.filter((c) => c.imageUrl || c.citationText || c.caption);
  }, [memes]);

  // Build comment cards from raw data
  const buildCommentCards = useCallback((): CommentFeedCard[] => {
    if (comments.length === 0) return [];

    return comments.map((comment) => {
      const owner = ownerProfilesRef.current[comment.data.ownerUid] || {};
      return {
        id: `comment-${comment.id}`,
        type: 'comment' as const,
        title: 'Comment',
        description: '',
        textBefore: comment.data.textBefore ?? null,
        textAfter: comment.data.textAfter ?? null,
        citation: comment.data.citation,
        citationText: comment.data.citationText,
        citationCategory: comment.data.citationCategory ?? null,
        ownerDisplayName: owner.displayName || 'User',
        ownerProfileLink: owner.profileLink || null,
        ownerPhotoURL: owner.photoURL || null,
      };
    });
  }, [comments]);

  // Initialize feed engine when all data is ready
  useEffect(() => {
    log('init effect:', {
      preferencesLoading,
      memesLoading,
      commentsLoading,
      memesCount: memes.length,
      commentsCount: comments.length,
      hasIndex: !!index,
      hasTopics: !!topics,
      initialized,
      initTrigger,
    });

    // Wait for preferences to load
    if (preferencesLoading) {
      log('  waiting for preferences');
      return;
    }

    // Check if no content is enabled
    if (!hasEnabledContent(preferences)) {
      log('  no content enabled');
      setDataReady(true);
      return;
    }

    // Check what data we need
    const needsSefaria = preferences.texts || preferences.categories ||
                        preferences.commentaries || preferences.topics;
    const sefariaReady = !needsSefaria || (index && topics);
    const memesReady = !preferences.memes || !memesLoading;
    const commentsReady = !preferences.comments || !commentsLoading;

    log('  ready checks:', { needsSefaria, sefariaReady, memesReady, commentsReady });

    if (!sefariaReady || !memesReady || !commentsReady) {
      log('  not ready, waiting...');
      return;
    }

    // Create a version key from the data to detect changes
    const dataVersion = `${memes.length}-${comments.length}-${!!index}-${!!topics}`;

    log('  dataVersion:', dataVersion, 'last:', lastDataVersionRef.current);

    // Avoid re-initialization if data hasn't changed
    if (initializingRef.current) {
      log('  already initializing, skip');
      return;
    }
    if (initialized && dataVersion === lastDataVersionRef.current) {
      log('  same version, skip');
      return;
    }

    log('  INITIALIZING with dataVersion:', dataVersion);
    initializingRef.current = true;
    lastDataVersionRef.current = dataVersion;

    // Clear displayed cards if re-initializing with new data
    if (initialized) {
      log('  clearing displayedCards for re-init');
      setDisplayedCards([]);
      currentIndexRef.current = 0;
    }

    // Build all data and initialize engine
    (async () => {
      const pool = index && topics ? buildCardPool(index, topics) : null;
      const memeCards = await buildMemeCards();
      const commentCards = buildCommentCards();

      log('  built cards:', { memeCards: memeCards.length, commentCards: commentCards.length });

      feedEngine.initialize(pool, memeCards, commentCards, preferences);
      setInitialized(true);
      setDataReady(true);
      initializingRef.current = false;

      // Trigger effect re-run to check if data changed during initialization
      // (e.g., Firestore data arrived while we were initializing)
      log('  async init complete, triggering re-check');
      setInitTrigger(prev => prev + 1);
    })();
  }, [
    preferencesLoading,
    preferences,
    index,
    topics,
    memes,
    comments,
    memesLoading,
    commentsLoading,
    buildMemeCards,
    buildCommentCards,
    initialized,
    initTrigger,
  ]);

  // Ref to track displayed cards for calculations outside React state
  const displayedCardsRef = useRef<FeedCard[]>([]);
  // Guard against re-entrant calls
  const pullingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    displayedCardsRef.current = displayedCards;
  }, [displayedCards]);

  // Pull cards from ready queue to fill displayedCards buffer
  const pullCardsFromQueue = useCallback(() => {
    // Prevent re-entrant calls
    if (pullingRef.current) return;
    pullingRef.current = true;

    try {
      const currentIndex = currentIndexRef.current;
      const currentCards = displayedCardsRef.current;

      // Count real cards (exclude loading card)
      const realCardsCount = currentCards.filter(c => c.id !== LOADING_CARD.id).length;

      // How many cards do we need ahead of current position?
      const cardsAhead = realCardsCount - currentIndex - 1;
      const needed = BUFFER_AHEAD - cardsAhead;

      log('pullCardsFromQueue:', { currentIndex, realCardsCount, cardsAhead, needed });

      if (needed <= 0) {
        log('  no cards needed');
        return;
      }

      // Pull cards from ready queue
      const readyQueue = feedEngine.getReadyQueue();
      log('  readyQueue.length:', readyQueue.length);

      if (readyQueue.length === 0) {
        // No cards ready - add loading card if not already there
        log('  no cards ready, adding loading card');
        const hasLoadingCard = currentCards.length > 0 && currentCards[currentCards.length - 1]?.id === LOADING_CARD.id;
        if (!hasLoadingCard) {
          setDisplayedCards(prev => {
            if (prev.length > 0 && prev[prev.length - 1]?.id === LOADING_CARD.id) return prev;
            return [...prev, LOADING_CARD];
          });
        }
        return;
      }

      // Take up to 'needed' cards from the ready queue
      const toAdd: FeedCard[] = [];
      for (let i = 0; i < Math.min(needed, readyQueue.length); i++) {
        const card = feedEngine.shiftCard();
        if (card) {
          toAdd.push(card);
          log('  pulled card:', card.type, card.id.substring(0, 30));
          // Trigger preparation of replacement card
          feedEngine.onCardDisplayed();
        }
      }

      if (toAdd.length === 0) {
        log('  no cards pulled');
        return;
      }

      log('  adding', toAdd.length, 'cards to displayedCards');

      // Add new cards to displayed list
      setDisplayedCards(prev => {
        // Remove loading card if present, then add new cards
        const withoutLoading = prev.filter(c => c.id !== LOADING_CARD.id);
        // Avoid duplicates
        const existingIds = new Set(withoutLoading.map(c => c.id));
        const newCards = toAdd.filter(c => !existingIds.has(c.id));
        log('  new displayedCards length:', withoutLoading.length + newCards.length);
        return [...withoutLoading, ...newCards];
      });
    } finally {
      pullingRef.current = false;
    }
  }, []);

  // Subscribe to feed engine ready queue changes
  useEffect(() => {
    if (!initialized) return;

    // When ready queue changes, try to pull more cards
    const onQueueChange = () => {
      pullCardsFromQueue();
    };

    // Initial pull
    pullCardsFromQueue();

    // Subscribe to changes
    const unsubscribe = feedEngine.subscribe(onQueueChange);
    return unsubscribe;
  }, [initialized, pullCardsFromQueue]);

  // Subscribe to preference changes
  useEffect(() => {
    if (!initialized) return;

    const unsubscribe = subscribeFeedPreferences((prefs) => {
      feedEngine.onPreferencesChange(prefs);
      // Reset displayed cards when preferences change significantly
      setDisplayedCards([]);
      currentIndexRef.current = 0;
      // Pull fresh cards
      setTimeout(() => pullCardsFromQueue(), 100);
    });

    return unsubscribe;
  }, [initialized, pullCardsFromQueue]);

  // Called when user scrolls to a new index
  const onScrollToIndex = useCallback((index: number) => {
    currentIndexRef.current = index;
    pullCardsFromQueue();
  }, [pullCardsFromQueue]);

  // Determine loading/no-content state
  const loading = !dataReady;
  const noContent = dataReady && !hasEnabledContent(preferences);

  return {
    cards: displayedCards,
    loading,
    noContent,
    onScrollToIndex,
  };
}
