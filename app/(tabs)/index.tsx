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
import { buildCardPool, getRandomCard, CardPool } from '@/services/cardGenerator';
import { FeedCard, TextCard, TopicCard } from '@/types/cards';
import { FeedCardRenderer } from '@/components/FeedCardRenderer';
import { SwipeHint } from '@/components/SwipeHint';
import { DataModal } from '@/components/DataModal';
import { SplashScreen } from '@/components/SplashScreen';
import { colors } from '@/constants/colors';
import { fetchTextExcerpt, fetchTopicExcerpt, TextExcerpt } from '@/services/sefariaText';

const SPLASH_MIN_DURATION = 1000; // 1 second minimum

// Phone dimensions for web mock (9:16 aspect ratio - standard mobile)
const PHONE_ASPECT_RATIO = 9 / 16;
const INITIAL_CARD_COUNT = 5;
const PRELOAD_QUEUE_COUNT = 5;
const MIN_DESCRIPTION_WORDS = 15;

export default function FeedScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { index, topics, isLoading } = useSefaria();
  const [cardPool, setCardPool] = useState<CardPool | null>(null);
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDataModal, setShowDataModal] = useState(false);
  const [splashMinTimeElapsed, setSplashMinTimeElapsed] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const preloadedRef = useRef<FeedCard[]>([]);
  const cardPoolRef = useRef<CardPool | null>(null);
  const textExcerptCacheRef = useRef<Map<string, TextExcerpt>>(new Map());
  const topicExcerptCacheRef = useRef<Map<string, TextExcerpt>>(new Map());
  const isLoadingMoreRef = useRef(false);
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && (screenWidth < 720 || screenHeight < 720);
  const phoneHeight = isWeb && !isCompactWeb ? Math.min(screenHeight - 40, 850) : screenHeight;
  const phoneWidth = isWeb && !isCompactWeb ? phoneHeight * PHONE_ASPECT_RATIO : screenWidth;

  const countWords = useCallback((value: string) => {
    return value.trim().split(/\s+/).filter(Boolean).length;
  }, []);

  const shouldSkipCard = useCallback((card: FeedCard) => {
    const isShortDescription = countWords(card.description) < MIN_DESCRIPTION_WORDS;
    if (!isShortDescription) return false;

    if (card.type === 'text') {
      return !card.excerpt;
    }
    if (card.type === 'author') {
      return !card.image;
    }

    return true;
  }, [countWords]);

  const hydrateCard = useCallback(async (card: FeedCard): Promise<FeedCard | null> => {
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

    // Other card types (author, genre)
    return shouldSkipCard(card) ? null : card;
  }, [shouldSkipCard]);

  const buildCardBatch = useCallback(async (count: number): Promise<FeedCard[]> => {
    const pool = cardPoolRef.current;
    if (!pool) return [];

    const batch: FeedCard[] = [];
    const maxAttempts = count * 8;
    let attempts = 0;

    while (batch.length < count && attempts < maxAttempts) {
      attempts += 1;
      const card = getRandomCard(pool);
      if (!card) continue;

      const hydrated = await hydrateCard(card);
      if (hydrated) {
        batch.push(hydrated);
      }
    }
    return batch;
  }, [hydrateCard]);

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
        const initialCards = await buildCardBatch(INITIAL_CARD_COUNT);
        const preloadQueue = await buildCardBatch(PRELOAD_QUEUE_COUNT);

        if (isCancelled) return;

        setCards(initialCards);
        preloadedRef.current = preloadQueue;
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

  // Check if we should show mobile swipe hint (mobile native or compact web, first card only)
  const isMobileView = !isWeb || isCompactWeb;

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
  const isReady = !isLoading && cardPool && cards.length > 0 && splashMinTimeElapsed;

  if (!isReady) {
    // On desktop, show splash within the mock phone container
    if (isWeb && !isCompactWeb) {
      return (
        <View style={styles.webWrapper}>
          <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}>
            <SplashScreen />
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
  if (isWeb && !isCompactWeb) {
    return (
      <View style={styles.webWrapper}>
        <View style={[styles.phoneContainer, { width: phoneWidth, height: phoneHeight }]}>
          {feedContent}
        </View>

        {/* See Data button - positioned outside mock phone */}
        <Pressable
          style={styles.seeDataButton}
          onPress={() => setShowDataModal(true)}
        >
          <MaterialCommunityIcons name="code-json" size={20} color={colors.hotPink} />
          <Text style={styles.seeDataText}>See Data</Text>
        </Pressable>

        {/* Data Modal */}
        <DataModal
          visible={showDataModal}
          onClose={() => setShowDataModal(false)}
          card={currentCard}
        />
      </View>
    );
  }

  // On mobile, full screen
  return (
    <View style={styles.mobileContainer}>
      {feedContent}
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: colors.hotPinkLight,
    justifyContent: 'center',
    alignItems: 'center',
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
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  seeDataText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.hotPink,
  },
});
