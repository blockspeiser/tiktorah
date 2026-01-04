import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Platform,
  ViewToken,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSefaria } from '@/contexts/SefariaContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMyMemes } from '@/hooks/useMyMemes';
import { useMyComments } from '@/hooks/useMyComments';
import { useProfile } from '@/hooks/useProfile';
import { useFeedPreferences } from '@/hooks/useFeedPreferences';
import { buildCardPool } from '@/services/cardGenerator';
import { FeedCard, MemeFeedCard, CommentFeedCard } from '@/types/cards';
import { FeedCardRenderer } from '@/components/FeedCardRenderer';
import { DataModal } from '@/components/DataModal';
import { SplashScreen } from '@/components/SplashScreen';
import { DesktopHeader } from '@/components/DesktopHeader';
import { colors } from '@/constants/colors';
import { MobileNav, useMobileNavHeight } from '@/components/MobileNav';
import { getMemeDownloadUrl } from '@/lib/storage';
import { buildCardSlug } from '@/utils/cardSlug';
import { FeedEngine } from '@/services/feedEngine';

const SPLASH_MIN_DURATION = 1000; // 1 second minimum

// Phone dimensions for web mock (9:16 aspect ratio - standard mobile)
const PHONE_ASPECT_RATIO = 9 / 16;
const DESKTOP_HEADER_HEIGHT = 72;
const DESKTOP_GAP = 40;
const QUEUE_SIZE = 5;

export default function FeedScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { index, topics, isLoading } = useSefaria();
  const { user } = useAuth();
  const { profile } = useProfile(user?.uid);
  const { memes, loading: memesLoading } = useMyMemes(user?.uid);
  const { comments, loading: commentsLoading } = useMyComments(user?.uid);
  const { preferences } = useFeedPreferences();
  const mobileNavHeight = useMobileNavHeight();

  const [cards, setCards] = useState<FeedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDataModal, setShowDataModal] = useState(false);
  const [splashMinTimeElapsed, setSplashMinTimeElapsed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [memeCards, setMemeCards] = useState<MemeFeedCard[]>([]);
  const [commentCards, setCommentCards] = useState<CommentFeedCard[]>([]);
  const [isBuildingQueue, setIsBuildingQueue] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const engineRef = useRef<FeedEngine | null>(null);
  const buildIdRef = useRef(0);
  const cardsRef = useRef<FeedCard[]>([]);
  const currentIndexRef = useRef(0);
  const prefsKeyRef = useRef<string | null>(null);
  const isUserScrollingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const lastUserScrollAtRef = useRef(0);

  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && (screenWidth < 720 || screenHeight < 720);
  const showHeader = isWeb && !isCompactWeb;
  const isMobileView = !isWeb || isCompactWeb;
  const phoneHeight = isWeb && !isCompactWeb
    ? Math.max(520, screenHeight - DESKTOP_HEADER_HEIGHT - (DESKTOP_GAP * 2))
    : Math.max(320, screenHeight - mobileNavHeight);
  const phoneWidth = isWeb && !isCompactWeb ? phoneHeight * PHONE_ASPECT_RATIO : screenWidth;
  const onlyMemes = preferences.memes && !preferences.texts && !preferences.categories && !preferences.topics && !preferences.comments;
  const noContentSelected = !preferences.memes && !preferences.texts && !preferences.categories && !preferences.topics && !preferences.comments;

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashMinTimeElapsed(true);
    }, SPLASH_MIN_DURATION);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    if (!preferences.memes) {
      setMemeCards([]);
      return () => {
        active = false;
      };
    }
    if (memes.length === 0) {
      setMemeCards([]);
      return () => {
        active = false;
      };
    }

    Promise.all(
      memes.map(async (meme) => {
        const imageUrl = await getMemeDownloadUrl(meme.data.storagePath).catch(() => '');
        return {
          id: `meme-${meme.id}`,
          type: 'meme' as const,
          title: meme.data.caption?.trim() || 'Meme',
          description: meme.data.citationText || meme.data.caption || 'User meme',
          imageUrl,
          caption: meme.data.caption ?? null,
          ownerDisplayName: profile?.displayName || user?.displayName || user?.email || null,
          ownerProfileLink: profile?.profileLink || null,
          ownerPhotoURL: profile?.photoURL || user?.photoURL || null,
          citation: meme.data.citation ?? null,
          citationText: meme.data.citationText ?? null,
          citationCategory: meme.data.citationCategory ?? null,
          memeLink: meme.data.memeLink ?? null,
        };
      })
    ).then((nextCards) => {
      if (!active) return;
      setMemeCards(nextCards.filter((card) => card.imageUrl || card.citationText || card.caption));
    });

    return () => {
      active = false;
    };
  }, [memes, preferences.memes, profile, user]);

  useEffect(() => {
    let active = true;
    if (!preferences.comments) {
      setCommentCards([]);
      return () => {
        active = false;
      };
    }
    if (comments.length === 0) {
      setCommentCards([]);
      return () => {
        active = false;
      };
    }

    const nextCards = comments.map((comment) => ({
      id: `comment-${comment.id}`,
      type: 'comment' as const,
      title: 'Comment',
      description: '',
      textBefore: comment.data.textBefore ?? null,
      textAfter: comment.data.textAfter ?? null,
      citation: comment.data.citation,
      citationText: comment.data.citationText,
      citationCategory: comment.data.citationCategory ?? null,
      ownerDisplayName: profile?.displayName || user?.displayName || user?.email || null,
      ownerProfileLink: profile?.profileLink || null,
      ownerPhotoURL: profile?.photoURL || user?.photoURL || null,
    }));

    if (active) {
      setCommentCards(nextCards);
    }

    return () => {
      active = false;
    };
  }, [comments, preferences.comments, profile, user]);

  const buildQueue = useCallback(async (
    targetSize: number,
    options?: { allowReset?: boolean; reason?: string }
  ) => {
    const engine = engineRef.current;
    if (!engine) return [];
    setIsBuildingQueue(true);
    try {
      const queue = await engine.ensureQueue(targetSize);
      setCards((prev) => {
        if (options?.allowReset) {
          return [...queue];
        }
        if (queue.length <= prev.length) {
          return prev;
        }
        for (let i = 0; i < prev.length; i += 1) {
          if (prev[i].id !== queue[i].id) {
            console.warn('[Feed] Queue prefix mismatch, ignoring update', {
              reason: options?.reason,
              prevId: prev[i]?.id,
              nextId: queue[i]?.id,
            });
            return prev;
          }
        }
        return [...queue];
      });
      // keep splash until cards are ready
      return queue;
    } finally {
      setIsBuildingQueue(false);
    }
  }, []);

  useEffect(() => {
    if (!isWeb || isMobileView) return;
    const card = cards[currentIndex];
    if (!card) return;
    const slug = buildCardSlug(card);
    if (typeof window === 'undefined') return;
    window.history.replaceState({}, '', `/card/${slug}`);
  }, [cards, currentIndex, isWeb, isMobileView]);

  useEffect(() => {
    if (noContentSelected) {
      setLoadError('Select at least one content type in Settings.');
      setCards([]);
      return;
    }

    if (!index || !topics) return;

    if (onlyMemes && memeCards.length === 0 && !memesLoading) {
      setLoadError('No memes available yet.');
      setCards([]);
      return;
    }

    const pool = buildCardPool(index, topics);
    console.log('[Feed] Card pool size', {
      texts: pool.texts.length,
      categories: pool.genres.length,
      topics: pool.topics.length,
      authors: pool.authors.length,
    });

    const prefsKey = JSON.stringify(preferences);
    const prefsChanged = prefsKeyRef.current !== prefsKey;
    if (prefsChanged) {
      prefsKeyRef.current = prefsKey;
    }

    const buildId = buildIdRef.current + 1;
    buildIdRef.current = buildId;

    if (!engineRef.current || prefsChanged) {
      console.log('[Feed] Resetting engine', {
        reason: prefsChanged ? 'prefs-change' : 'init',
      });
      const engine = new FeedEngine(preferences);
      engine.setPool(pool);
      engine.setMemes(memeCards);
      engine.setComments(commentCards);
      engine.resetCaches();
      engine.clearQueue();
      engineRef.current = engine;

      setLoadError(null);
      setCards([]);
      setCurrentIndex(0);

      buildQueue(QUEUE_SIZE, { allowReset: true, reason: prefsChanged ? 'prefs-change' : 'init' })
        .then((queue) => {
          if (buildIdRef.current !== buildId) return;
          if (queue.length === 0) {
            setLoadError('Unable to load content. Please try again.');
          }
        });
      return;
    }

    engineRef.current.setPool(pool);
    engineRef.current.setMemes(memeCards);
    engineRef.current.setComments(commentCards);
    setLoadError(null);
    buildQueue(QUEUE_SIZE, { reason: 'pool-update' });
  }, [index, topics, preferences, memeCards, commentCards, memesLoading, noContentSelected, onlyMemes, buildQueue]);

  const ensureAhead = useCallback(async (indexValue: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    const target = indexValue + QUEUE_SIZE;
    if (cards.length >= target || engine.isBuilding()) return;
    await buildQueue(target, { reason: 'ensure-ahead' });
  }, [cards.length, buildQueue]);

  const ensureAheadRef = useRef(ensureAhead);
  useEffect(() => {
    ensureAheadRef.current = ensureAhead;
  }, [ensureAhead]);

  const onViewableItemsChangedRef = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      const nextIndex = viewableItems[0].index;
      const now = Date.now();
      const recentUserScroll = now - lastUserScrollAtRef.current < 800;
      const allowUpdate = isUserScrollingRef.current || isProgrammaticScrollRef.current || recentUserScroll;
      if (!allowUpdate && nextIndex !== currentIndexRef.current) {
        console.warn('[Feed] Ignoring viewable change without user scroll', {
          nextIndex,
          currentIndex: currentIndexRef.current,
          userScrolling: isUserScrollingRef.current,
          programmatic: isProgrammaticScrollRef.current,
          recentUserScroll,
          cards: cardsRef.current.length,
        });
        return;
      }
      if (allowUpdate && nextIndex !== currentIndexRef.current) {
        setCurrentIndex(nextIndex);
        ensureAheadRef.current(nextIndex);
      }
    }
  });

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleNextCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      isProgrammaticScrollRef.current = true;
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex, cards.length]);

  const renderCard = useCallback(
    ({ item }: { item: FeedCard; index: number }) => (
      <View style={[styles.cardContainer, { height: phoneHeight, width: phoneWidth }]}> 
        <FeedCardRenderer
          card={item}
          onNextCard={showHeader ? handleNextCard : undefined}
          cardHeight={phoneHeight}
        />
      </View>
    ),
    [handleNextCard, phoneHeight, phoneWidth, showHeader]
  );

  const hasCards = cards.length > 0;
  const hasMemeCards = memeCards.length > 0;
  const isReady = splashMinTimeElapsed && (hasCards || (onlyMemes && hasMemeCards));
  const hasContent = cards.length > 0 || memeCards.length > 0;
  const showError = loadError && splashMinTimeElapsed && !hasContent;

  useEffect(() => {
    console.log('[Feed] State', {
      isLoading,
      splashMinTimeElapsed,
      cards: cards.length,
      memes: memeCards.length,
      comments: commentCards.length,
      commentsLoading,
      loadError,
      onlyMemes,
      isReady,
      isBuildingQueue,
    });
  }, [isLoading, splashMinTimeElapsed, cards.length, memeCards.length, commentCards.length, commentsLoading, loadError, onlyMemes, isReady, isBuildingQueue]);

  if (showError) {
    const errorContent = (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.gray[400]} />
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );

    if (showHeader) {
      return (
        <View style={styles.webWrapper}>
          <DesktopHeader />
          <View style={styles.webContent}>
            <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}> 
              {errorContent}
            </View>
          </View>
        </View>
      );
    }
    return errorContent;
  }

  if (!isReady) {
    if (showHeader) {
      return (
        <View style={styles.webWrapper}>
          <DesktopHeader />
          <View style={styles.webContent}>
            <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}> 
              <SplashScreen />
            </View>
          </View>
        </View>
      );
    }

    return <SplashScreen />;
  }

  const feedContent = (
    <FlatList
      ref={flatListRef}
      data={cards}
      renderItem={renderCard}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={phoneHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      onScrollBeginDrag={() => {
        isUserScrollingRef.current = true;
        lastUserScrollAtRef.current = Date.now();
      }}
      onScroll={() => {
        lastUserScrollAtRef.current = Date.now();
      }}
      scrollEventThrottle={16}
      onScrollEndDrag={() => {
        isUserScrollingRef.current = false;
      }}
      onMomentumScrollBegin={() => {
        isUserScrollingRef.current = true;
        lastUserScrollAtRef.current = Date.now();
      }}
      onMomentumScrollEnd={(event) => {
        isUserScrollingRef.current = false;
        isProgrammaticScrollRef.current = false;
        lastUserScrollAtRef.current = Date.now();
        const offsetY = event.nativeEvent.contentOffset.y;
        const nextIndex = Math.round(offsetY / phoneHeight);
        if (nextIndex !== currentIndexRef.current) {
          setCurrentIndex(nextIndex);
          ensureAheadRef.current(nextIndex);
        }
      }}
      onViewableItemsChanged={onViewableItemsChangedRef.current}
      viewabilityConfig={viewabilityConfig}
      getItemLayout={(_, idx) => ({
        length: phoneHeight,
        offset: phoneHeight * idx,
        index: idx,
      })}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={5}
      style={{ width: phoneWidth }}
    />
  );

  const currentCard = cards[currentIndex] ?? null;

  if (showHeader) {
    return (
      <View style={styles.webWrapper}>
        <DesktopHeader />
        <View style={styles.webContent}>
          <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}> 
            {feedContent}
          </View>

          <Pressable
            style={styles.seeDataButton}
            onPress={() => setShowDataModal(true)}
          >
            <MaterialCommunityIcons name="code-json" size={20} color={colors.hotPink} />
          </Pressable>

          <DataModal
            visible={showDataModal}
            onClose={() => setShowDataModal(false)}
            card={currentCard}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mobileContainer, { paddingBottom: mobileNavHeight }]}> 
      {feedContent}
      <MobileNav />
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: colors.hotPinkLight,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  webContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: DESKTOP_GAP,
    paddingBottom: DESKTOP_GAP,
  },
  phoneContainer: {
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  cardContainer: {
    backgroundColor: colors.white,
  },
  seeDataButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray[600],
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[600],
  },
});
