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
import { useProfile } from '@/hooks/useProfile';
import { useFeedPreferences } from '@/hooks/useFeedPreferences';
import { buildCardPool, getRandomCard, CardPool } from '@/services/cardGenerator';
import { FeedCard, TextCard, TopicCard, GenreCard, MemeFeedCard } from '@/types/cards';
import { FeedCardRenderer } from '@/components/FeedCardRenderer';
import { SwipeHint } from '@/components/SwipeHint';
import { DataModal } from '@/components/DataModal';
import { SplashScreen } from '@/components/SplashScreen';
import { DesktopHeader } from '@/components/DesktopHeader';
import { colors } from '@/constants/colors';
import { fetchTextExcerpt, fetchTopicExcerpt, TextExcerpt } from '@/services/sefariaText';
import { MobileNav, useMobileNavHeight } from '@/components/MobileNav';
import { getMemeDownloadUrl } from '@/lib/storage';

const SPLASH_MIN_DURATION = 1000; // 1 second minimum

// Phone dimensions for web mock (9:16 aspect ratio - standard mobile)
const PHONE_ASPECT_RATIO = 9 / 16;
const DESKTOP_HEADER_HEIGHT = 72;
const DESKTOP_GAP = 40;
const INITIAL_CARD_COUNT = 5;
const PRELOAD_QUEUE_COUNT = 5;
const MIN_DESCRIPTION_WORDS = 15;

export default function FeedScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { index, topics, isLoading } = useSefaria();
  const { user } = useAuth();
  const { profile } = useProfile(user?.uid);
  const { memes, loading: memesLoading } = useMyMemes(user?.uid);
  const { preferences } = useFeedPreferences();
  const mobileNavHeight = useMobileNavHeight();
  const [cardPool, setCardPool] = useState<CardPool | null>(null);
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDataModal, setShowDataModal] = useState(false);
  const [splashMinTimeElapsed, setSplashMinTimeElapsed] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [memeCards, setMemeCards] = useState<MemeFeedCard[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const preloadedRef = useRef<FeedCard[]>([]);
  const cardPoolRef = useRef<CardPool | null>(null);
  const textExcerptCacheRef = useRef<Map<string, TextExcerpt>>(new Map());
  const topicExcerptCacheRef = useRef<Map<string, TextExcerpt>>(new Map());
  const genreExcerptCacheRef = useRef<Map<string, TextExcerpt>>(new Map());
  const isLoadingMoreRef = useRef(false);
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && (screenWidth < 720 || screenHeight < 720);
  const showHeader = isWeb && !isCompactWeb;
  const isMobileView = !isWeb || isCompactWeb;
  const phoneHeight = isWeb && !isCompactWeb
    ? Math.max(520, screenHeight - DESKTOP_HEADER_HEIGHT - (DESKTOP_GAP * 2))
    : Math.max(320, screenHeight - mobileNavHeight);
  const phoneWidth = isWeb && !isCompactWeb ? phoneHeight * PHONE_ASPECT_RATIO : screenWidth;
  const onlyMemes = preferences.memes && !preferences.texts && !preferences.categories && !preferences.topics;
  const noContentSelected = !preferences.memes && !preferences.texts && !preferences.categories && !preferences.topics;

  const countWords = useCallback((value: string) => {
    return value.trim().split(/\s+/).filter(Boolean).length;
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
          citation: meme.data.citation ?? null,
          citationText: meme.data.citationText ?? null,
          citationCategory: meme.data.citationCategory ?? null,
          memeLink: meme.data.memeLink ?? null,
        };
      })
    ).then((cards) => {
      if (!active) return;
      setMemeCards(cards.filter((card) => card.imageUrl || card.citationText || card.caption));
    });

    return () => {
      active = false;
    };
  }, [memes, preferences.memes, profile, user]);

  const isCardTypeEnabled = useCallback((card: FeedCard) => {
    if (card.type === 'text') return preferences.texts;
    if (card.type === 'genre') return preferences.categories;
    if (card.type === 'topic') return preferences.topics;
    if (card.type === 'author') return preferences.topics;
    if (card.type === 'meme') return preferences.memes;
    return true;
  }, [preferences]);

  const shouldSkipCard = useCallback((card: FeedCard) => {
    if (card.type === 'meme') {
      const memeCard = card as MemeFeedCard;
      return !memeCard.imageUrl && !memeCard.citationText && !memeCard.caption;
    }
    if (!isCardTypeEnabled(card)) return true;
    const isShortDescription = countWords(card.description) < MIN_DESCRIPTION_WORDS;
    if (!isShortDescription) return false;

    if (card.type === 'text') {
      return !card.excerpt;
    }
    if (card.type === 'author') {
      return !card.image;
    }
    if (card.type === 'genre') {
      return !card.excerpt;
    }
    if (card.type === 'topic') {
      return !card.excerpt;
    }

    return true;
  }, [countWords, isCardTypeEnabled]);

  const hydrateCard = useCallback(async (card: FeedCard): Promise<FeedCard | null> => {
    try {
      if (card.type === 'meme') {
        return shouldSkipCard(card) ? null : card;
      }
      // Handle text cards - fetch text excerpt
      if (card.type === 'text') {
        const cached = textExcerptCacheRef.current.get(card.title);
        if (cached) {
          const hydrated = { ...card, excerpt: cached } as TextCard;
          return shouldSkipCard(hydrated) ? null : hydrated;
        }

        const excerpt = await fetchTextExcerpt(card.title);
        if (excerpt) {
          textExcerptCacheRef.current.set(card.title, excerpt);
          const hydrated = { ...card, excerpt } as TextCard;
          return shouldSkipCard(hydrated) ? null : hydrated;
        }

        return null;
      }

      // Handle topic cards - fetch topic excerpt
      if (card.type === 'topic') {
        const cached = topicExcerptCacheRef.current.get(card.slug);
        if (cached) {
          const hydrated = { ...card, excerpt: cached } as TopicCard;
          return shouldSkipCard(hydrated) ? null : hydrated;
        }

        const excerpt = await fetchTopicExcerpt(card.slug);
        if (excerpt) {
          topicExcerptCacheRef.current.set(card.slug, excerpt);
          const hydrated = { ...card, excerpt } as TopicCard;
          return shouldSkipCard(hydrated) ? null : hydrated;
        }

        // Topics without excerpts are still valid if they pass other checks
        return shouldSkipCard(card) ? null : card;
      }

      // Handle genre cards - fetch excerpt from first book in category
      if (card.type === 'genre' && card.firstBookTitle) {
        const cacheKey = card.firstBookTitle;
        const cached = genreExcerptCacheRef.current.get(cacheKey);
        if (cached) {
          const hydrated = { ...card, excerpt: cached } as GenreCard;
          return shouldSkipCard(hydrated) ? null : hydrated;
        }

        const excerpt = await fetchTextExcerpt(card.firstBookTitle);
        if (excerpt) {
          genreExcerptCacheRef.current.set(cacheKey, excerpt);
          const hydrated = { ...card, excerpt } as GenreCard;
          return shouldSkipCard(hydrated) ? null : hydrated;
        }

        // Genres without excerpts are still valid if they pass other checks
        return shouldSkipCard(card) ? null : card;
      }

      // Other card types (author, genre without firstBookTitle)
      return shouldSkipCard(card) ? null : card;
    } catch (error) {
      console.warn(`[Feed] Error hydrating ${card.type} card:`, error);
      // On error, skip this card but don't crash the feed
      return null;
    }
  }, [shouldSkipCard]);

  const buildCardBatch = useCallback(async (count: number): Promise<FeedCard[]> => {
    const pool = cardPoolRef.current;
    if (!pool && !memeCards.length) return [];

    if (onlyMemes) {
      if (memeCards.length === 0) return [];
      const shuffled = [...memeCards].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }
    if (!pool) {
      const shuffled = [...memeCards].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    const batch: FeedCard[] = [];
    const maxAttempts = count * 8;
    let attempts = 0;

    while (batch.length < count && attempts < maxAttempts) {
      attempts += 1;
      const shouldUseMeme = preferences.memes && memeCards.length > 0 && Math.random() < 0.2;
      const card = shouldUseMeme
        ? memeCards[Math.floor(Math.random() * memeCards.length)]
        : getRandomCard(pool);
      if (!card) continue;

      const hydrated = await hydrateCard(card);
      if (hydrated) {
        batch.push(hydrated);
      }
    }
    return batch;
  }, [hydrateCard, memeCards, preferences]);

  // Minimum splash screen duration timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashMinTimeElapsed(true);
    }, SPLASH_MIN_DURATION);

    return () => clearTimeout(timer);
  }, []);

  // Build card pool when data is available and preload text excerpts
  useEffect(() => {
    let isCancelled = false;

    if (index && topics) {
      const pool = buildCardPool(index, topics);
      cardPoolRef.current = pool;
      setCardPool(pool);

      (async () => {
        try {
          console.log('[Feed] Building initial cards...');
          setLoadError(null);
          const initialCards = await buildCardBatch(INITIAL_CARD_COUNT);
          console.log(`[Feed] Built ${initialCards.length} initial cards`);

          if (isCancelled) return;

          // Set cards even if we got fewer than requested
          if (initialCards.length > 0) {
            setCards(initialCards);
          } else {
            console.warn('[Feed] No initial cards built, retrying with more attempts...');
            // Retry with more attempts
            const fallbackCards = await buildCardBatch(INITIAL_CARD_COUNT);
            if (!isCancelled) {
              if (fallbackCards.length > 0) {
                setCards(fallbackCards);
              } else {
                console.error('[Feed] All card building attempts failed');
                setLoadError('Unable to load content. Please refresh the page.');
              }
            }
          }

          const preloadQueue = await buildCardBatch(PRELOAD_QUEUE_COUNT);
          if (!isCancelled) {
            preloadedRef.current = preloadQueue;
          }
        } catch (error) {
          console.error('[Feed] Error building cards:', error);
          if (!isCancelled) {
            setLoadError('Something went wrong. Please refresh the page.');
          }
        }
      })();
    }

    return () => {
      isCancelled = true;
    };
  }, [index, topics, buildCardBatch]);

  // Load more cards when nearing the end
  const loadMoreCards = useCallback(async () => {
    if (isLoadingMoreRef.current) return;
    if (!cardPoolRef.current) return;

    const queued = preloadedRef.current;
    if (queued.length === 0) return;

    isLoadingMoreRef.current = true;
    setCards(prev => [...prev, ...queued]);

    const newQueue = await buildCardBatch(PRELOAD_QUEUE_COUNT);
    preloadedRef.current = newQueue;
    isLoadingMoreRef.current = false;
  }, [buildCardBatch]);

  // Handle viewable items change
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  // Handle next card (for web button)
  const handleNextCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      loadMoreCards().then(() => {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: currentIndex + 1,
            animated: true,
          });
        }, 100);
      });
    }
  }, [currentIndex, cards.length, loadMoreCards]);

  // Render each card
  const renderCard = useCallback(
    ({ item, index: itemIndex }: { item: FeedCard; index: number }) => (
      <View style={[styles.cardContainer, { height: phoneHeight, width: phoneWidth }]}>
        <FeedCardRenderer
          card={item}
          onNextCard={isWeb && !isCompactWeb ? handleNextCard : undefined}
          cardHeight={phoneHeight}
        />
        {/* Show swipe hint only on first card and only on mobile */}
        {itemIndex === 0 && isMobileView && <SwipeHint />}
      </View>
    ),
    [handleNextCard, isCompactWeb, isMobileView, isWeb, phoneHeight, phoneWidth]
  );

  // Show splash screen until both: data is loaded AND minimum time has elapsed
  const isReady = splashMinTimeElapsed && (onlyMemes ? true : !isLoading) && (
    (onlyMemes && memeCards.length > 0) || (cardPool && cards.length > 0)
  );
  const showError = loadError && splashMinTimeElapsed;

  useEffect(() => {
    if (!cardPool) return;
    setCards((prev) => prev.filter(isCardTypeEnabled));
    preloadedRef.current = preloadedRef.current.filter(isCardTypeEnabled);
    if (currentIndex >= preloadedRef.current.length && currentIndex >= cards.length - 1) {
      setCurrentIndex(0);
      flatListRef.current?.scrollToIndex({ index: 0, animated: false });
    }
  }, [preferences, isCardTypeEnabled, cardPool, currentIndex, cards.length]);

  useEffect(() => {
    if (noContentSelected) {
      setLoadError('Select at least one content type in Settings.');
      setCards([]);
      return;
    }
    if (loadError === 'Select at least one content type in Settings.') {
      setLoadError(null);
    }
  }, [noContentSelected, loadError]);

  useEffect(() => {
    if (!onlyMemes) return;
    if (memesLoading) return;
    if (memeCards.length === 0) {
      setLoadError('No memes available yet.');
      setCards([]);
      return;
    }
    setLoadError(null);
    setCards(memeCards);
    preloadedRef.current = [];
  }, [onlyMemes, memeCards, memesLoading]);

  // Show error state if loading failed
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
    // On desktop, show splash within the mock phone container with header
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
      keyExtractor={(item, idx) => `${item.id}-${idx}`}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={phoneHeight}
      snapToAlignment="start"
      decelerationRate="fast"
      onEndReached={loadMoreCards}
      onEndReachedThreshold={0.5}
      onViewableItemsChanged={onViewableItemsChanged}
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

  // Get current card for the data modal
  const currentCard = cards[currentIndex] ?? null;

  // On web, wrap in mock phone view
  if (showHeader) {
    return (
      <View style={styles.webWrapper}>
        <DesktopHeader />
        <View style={styles.webContent}>
          <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}>
            {feedContent}
          </View>

          {/* See Data button - positioned outside mock phone */}
          <Pressable
            style={styles.seeDataButton}
            onPress={() => setShowDataModal(true)}
          >
            <MaterialCommunityIcons name="code-json" size={20} color={colors.hotPink} />
          </Pressable>

          {/* Data Modal */}
          <DataModal
            visible={showDataModal}
            onClose={() => setShowDataModal(false)}
            card={currentCard}
          />
        </View>
      </View>
    );
  }

  // On mobile, full screen
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
});
