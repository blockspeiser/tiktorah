/**
 * Feed Engine - Manages the card feed according to FEED.md spec
 *
 * Key behaviors:
 * 1. Equal frequency of card types via round-robin selection
 * 2. Random card within each type
 * 3. Track seen cards per type, reset when type exhausted
 * 4. Two queues: preparing (async) and ready
 * 5. Always maintain 5 cards in ready queue
 * 6. Skip and move on when errors occur (no retries)
 */

import { FeedCard, GenreCard, TextCard, CommentaryCard, AuthorCard, TopicCard, MemeFeedCard, CommentFeedCard } from '@/types/cards';
import { fetchTextExcerpt, fetchTopicExcerpt } from '@/services/sefariaText';
import { FeedPreferences } from '@/lib/preferences';
import { CardPool } from '@/services/cardGenerator';

// Preference key to card type(s) mapping
type PreferenceKey = keyof FeedPreferences;
type PoolCardType = 'genre' | 'text' | 'commentary' | 'author' | 'topic' | 'meme' | 'comment';

const PREF_TO_TYPES: Record<PreferenceKey, PoolCardType[]> = {
  categories: ['genre'],
  texts: ['text'],
  commentaries: ['commentary'],
  topics: ['topic', 'author'],
  memes: ['meme'],
  comments: ['comment'],
};

const TARGET_READY_QUEUE_SIZE = 5;

const DEBUG = true;
const log = (...args: unknown[]) => DEBUG && console.log('[FeedEngine]', ...args);

type FeedListener = (readyQueue: FeedCard[]) => void;

interface CardPools {
  genre: GenreCard[];
  text: TextCard[];
  commentary: CommentaryCard[];
  author: AuthorCard[];
  topic: TopicCard[];
  meme: MemeFeedCard[];
  comment: CommentFeedCard[];
}

class FeedEngine {
  // Card pools by type
  private pools: CardPools = {
    genre: [],
    text: [],
    commentary: [],
    author: [],
    topic: [],
    meme: [],
    comment: [],
  };

  // Seen card IDs by type - reset when all cards of type have been seen
  private seenByType: Record<PoolCardType, Set<string>> = {
    genre: new Set(),
    text: new Set(),
    commentary: new Set(),
    author: new Set(),
    topic: new Set(),
    meme: new Set(),
    comment: new Set(),
  };

  // Currently preparing card IDs (to avoid duplicates)
  private preparingIds = new Set<string>();

  // Ready queue - hydrated cards ready to show
  private readyQueue: FeedCard[] = [];

  // Enabled card types based on preferences
  private enabledTypes: PoolCardType[] = [];

  // Round-robin index for type selection
  private typeIndex = 0;

  // Listeners for ready queue changes
  private listeners = new Set<FeedListener>();

  // Initialization state
  private initialized = false;

  /**
   * Initialize the feed engine with card pools and preferences
   */
  initialize(
    sefariaPool: CardPool | null,
    memeCards: MemeFeedCard[],
    commentCards: CommentFeedCard[],
    preferences: FeedPreferences
  ): void {
    log('initialize called');

    // Set up pools
    if (sefariaPool) {
      this.pools.genre = [...sefariaPool.genres];
      this.pools.text = [...sefariaPool.texts];
      this.pools.commentary = [...sefariaPool.commentaries];
      this.pools.author = [...sefariaPool.authors];
      this.pools.topic = [...sefariaPool.topics];
    } else {
      this.pools.genre = [];
      this.pools.text = [];
      this.pools.commentary = [];
      this.pools.author = [];
      this.pools.topic = [];
    }
    this.pools.meme = [...memeCards];
    this.pools.comment = [...commentCards];

    log('  pools:', {
      genre: this.pools.genre.length,
      text: this.pools.text.length,
      commentary: this.pools.commentary.length,
      author: this.pools.author.length,
      topic: this.pools.topic.length,
      meme: this.pools.meme.length,
      comment: this.pools.comment.length,
    });

    // Reset all state
    this.resetState();

    // Update enabled types from preferences
    this.updateEnabledTypes(preferences);

    log('  enabledTypes:', this.enabledTypes);

    this.initialized = true;

    // Start filling the ready queue
    this.fillReadyQueue();
  }

  /**
   * Reset all tracking state
   */
  private resetState(): void {
    this.seenByType = {
      genre: new Set(),
      text: new Set(),
      commentary: new Set(),
      author: new Set(),
      topic: new Set(),
      meme: new Set(),
      comment: new Set(),
    };
    this.preparingIds.clear();
    this.readyQueue = [];
    this.typeIndex = 0;
  }

  /**
   * Update enabled types from preferences
   */
  private updateEnabledTypes(preferences: FeedPreferences): void {
    const types: PoolCardType[] = [];

    for (const [prefKey, cardTypes] of Object.entries(PREF_TO_TYPES)) {
      if (preferences[prefKey as PreferenceKey]) {
        for (const cardType of cardTypes) {
          // Only add if pool has cards
          if (this.pools[cardType].length > 0) {
            types.push(cardType);
          }
        }
      }
    }

    this.enabledTypes = types;
  }

  /**
   * Handle preference changes
   * Per spec: If cards in queue have disabled type, remove them
   * If a type was re-enabled, throw away queue and restart
   */
  onPreferencesChange(preferences: FeedPreferences): void {
    if (!this.initialized) return;

    const oldTypes = new Set(this.enabledTypes);
    this.updateEnabledTypes(preferences);
    const newTypes = new Set(this.enabledTypes);

    // Check if any type was re-enabled (wasn't in old, is in new)
    let typeReEnabled = false;
    for (const type of newTypes) {
      if (!oldTypes.has(type)) {
        typeReEnabled = true;
        break;
      }
    }

    if (typeReEnabled) {
      // Per spec: "throw the whole queue away and start over"
      this.resetState();
      this.updateEnabledTypes(preferences);
      this.fillReadyQueue();
      this.notifyListeners();
      return;
    }

    // Check if any type was disabled - remove those cards from queue
    let removedAny = false;
    for (const type of oldTypes) {
      if (!newTypes.has(type)) {
        // Remove cards of this type from ready queue
        const before = this.readyQueue.length;
        this.readyQueue = this.readyQueue.filter(card => card.type !== type);
        if (this.readyQueue.length < before) {
          removedAny = true;
        }
      }
    }

    if (removedAny) {
      // Fill queue to replace removed cards
      this.fillReadyQueue();
      this.notifyListeners();
    }
  }

  /**
   * Called when a card is displayed - triggers preparation of next card
   */
  onCardDisplayed(): void {
    if (!this.initialized) return;
    this.fillReadyQueue();
  }

  /**
   * Get the current ready queue
   */
  getReadyQueue(): FeedCard[] {
    return [...this.readyQueue];
  }

  /**
   * Remove and return the first card from ready queue
   * Note: Does NOT notify listeners - caller is responsible for knowing cards were taken
   */
  shiftCard(): FeedCard | null {
    if (this.readyQueue.length === 0) return null;
    const card = this.readyQueue.shift()!;
    return card;
  }

  /**
   * Check if engine has any enabled content
   */
  hasEnabledContent(): boolean {
    return this.enabledTypes.length > 0;
  }

  /**
   * Check if engine is ready (initialized with cards)
   */
  isReady(): boolean {
    return this.initialized && this.readyQueue.length > 0;
  }

  /**
   * Subscribe to ready queue changes
   */
  subscribe(listener: FeedListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of queue change
   */
  private notifyListeners(): void {
    const queue = this.getReadyQueue();
    this.listeners.forEach(listener => listener(queue));
  }

  /**
   * Fill the ready queue up to target size
   */
  private fillReadyQueue(): void {
    if (this.enabledTypes.length === 0) {
      log('fillReadyQueue: no enabled types');
      return;
    }

    const needed = TARGET_READY_QUEUE_SIZE - this.readyQueue.length - this.preparingIds.size;
    log('fillReadyQueue:', { readyQueueLen: this.readyQueue.length, preparingCount: this.preparingIds.size, needed });

    for (let i = 0; i < needed; i++) {
      this.prepareNextCard();
    }
  }

  /**
   * Start preparing the next card
   */
  private prepareNextCard(): void {
    if (this.enabledTypes.length === 0) return;

    // Pick a card using round-robin type selection
    const card = this.pickNextCard();
    if (!card) {
      log('prepareNextCard: no card picked');
      return;
    }

    log('prepareNextCard: picked', card.type, card.id.substring(0, 30));

    // Mark as preparing
    this.preparingIds.add(card.id);

    // Hydrate asynchronously
    this.hydrateCard(card)
      .then(hydrated => {
        this.preparingIds.delete(card.id);

        if (hydrated) {
          // Add to ready queue
          log('prepareNextCard: hydrated successfully, adding to readyQueue');
          this.readyQueue.push(hydrated);
          log('  readyQueue.length now:', this.readyQueue.length);
          this.notifyListeners();
        } else {
          // Per spec: "If an error occurs, skip it, put it in seen list, move on"
          log('prepareNextCard: hydration returned null, skipping');
          this.markCardSeen(card);
          // Try to prepare another card to replace this one
          this.prepareNextCard();
        }
      })
      .catch((err) => {
        // Per spec: "Never retry API calls on error, just skip"
        log('prepareNextCard: hydration error, skipping', err);
        this.preparingIds.delete(card.id);
        this.markCardSeen(card);
        this.prepareNextCard();
      });
  }

  /**
   * Pick the next card using round-robin type selection
   */
  private pickNextCard(): FeedCard | null {
    if (this.enabledTypes.length === 0) return null;

    const startIndex = this.typeIndex;

    // Try each type starting from current index
    for (let attempt = 0; attempt < this.enabledTypes.length; attempt++) {
      const type = this.enabledTypes[this.typeIndex];

      // Advance round-robin index for next call
      this.typeIndex = (this.typeIndex + 1) % this.enabledTypes.length;

      const card = this.pickCardFromType(type);
      if (card) {
        log('pickNextCard: selected', type, 'from index', startIndex);
        return card;
      } else {
        log('pickNextCard: no card for', type, ', trying next type');
      }
    }

    log('pickNextCard: no card found after trying all types from index', startIndex);
    return null;
  }

  /**
   * Pick a random unseen card from a specific type
   */
  private pickCardFromType(type: PoolCardType): FeedCard | null {
    const pool = this.pools[type];
    if (pool.length === 0) return null;

    const seen = this.seenByType[type];

    // Filter to unseen cards that aren't being prepared or in ready queue
    let candidates = pool.filter(card =>
      !seen.has(card.id) &&
      !this.preparingIds.has(card.id) &&
      !this.readyQueue.some(c => c.id === card.id)
    );

    // Per spec: If all cards shown, reset and use all
    if (candidates.length === 0) {
      log('pickCardFromType:', type, 'no candidates, resetting seen. Pool:', pool.length,
          'Seen:', seen.size, 'Preparing:', this.preparingIds.size,
          'InQueue:', this.readyQueue.filter(c => c.type === type).length);
      seen.clear();
      candidates = pool.filter(card =>
        !this.preparingIds.has(card.id) &&
        !this.readyQueue.some(c => c.id === card.id)
      );
      log('  after reset, candidates:', candidates.length);
    }

    if (candidates.length === 0) {
      log('pickCardFromType:', type, 'still no candidates after reset');
      return null;
    }

    // Random selection
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }

  /**
   * Mark a card as seen in its type's seen set
   */
  private markCardSeen(card: FeedCard): void {
    const type = card.type as PoolCardType;
    if (this.seenByType[type]) {
      this.seenByType[type].add(card.id);
    }
  }

  /**
   * Hydrate a card with API data if needed
   * Returns null on any error (per spec: skip and move on)
   */
  private async hydrateCard(card: FeedCard): Promise<FeedCard | null> {
    try {
      // Memes are pre-hydrated - just validate
      if (card.type === 'meme') {
        const memeCard = card as MemeFeedCard;
        const valid = !!(memeCard.imageUrl || memeCard.citationText || memeCard.caption);
        return valid ? card : null;
      }

      // Comments are pre-hydrated - just validate
      if (card.type === 'comment') {
        const commentCard = card as CommentFeedCard;
        const valid = !!(commentCard.citation && commentCard.citationText);
        return valid ? card : null;
      }

      // Authors don't need hydration
      if (card.type === 'author') {
        return card;
      }

      // Text and commentary cards need excerpt hydration
      if (card.type === 'text' || card.type === 'commentary') {
        const excerpt = await fetchTextExcerpt(card.title);
        if (!excerpt) return null;
        return { ...card, excerpt } as TextCard | CommentaryCard;
      }

      // Topic cards need excerpt hydration
      if (card.type === 'topic') {
        const topicCard = card as TopicCard;
        const excerpt = await fetchTopicExcerpt(topicCard.slug);
        // Topics can still be valid without excerpt if they have good description
        if (excerpt) {
          return { ...card, excerpt } as TopicCard;
        }
        return card;
      }

      // Genre cards need excerpt hydration from first book
      if (card.type === 'genre') {
        const genreCard = card as GenreCard;
        if (genreCard.firstBookTitle) {
          const excerpt = await fetchTextExcerpt(genreCard.firstBookTitle);
          if (excerpt) {
            return { ...card, excerpt } as GenreCard;
          }
        }
        // Genres can still be valid without excerpt
        return card;
      }

      return card;
    } catch {
      // Per spec: skip on error
      return null;
    }
  }
}

// Singleton instance
export const feedEngine = new FeedEngine();

/**
 * Helper to check if any content type is enabled in preferences
 */
export function hasEnabledContent(prefs: FeedPreferences): boolean {
  return prefs.texts || prefs.categories || prefs.commentaries ||
         prefs.topics || prefs.memes || prefs.comments;
}
