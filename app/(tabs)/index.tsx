import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Platform,
  ViewToken,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useSefaria } from '@/contexts/SefariaContext';
import { buildCardPool, getRandomCard, CardPool } from '@/services/cardGenerator';
import { FeedCard } from '@/types/cards';
import { FeedCardRenderer } from '@/components/FeedCardRenderer';
import { colors } from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Phone dimensions for web mock (9:16 aspect ratio - standard mobile)
const PHONE_ASPECT_RATIO = 9 / 16;
const PHONE_HEIGHT = Platform.OS === 'web' ? Math.min(SCREEN_HEIGHT - 40, 850) : SCREEN_HEIGHT;
const PHONE_WIDTH = Platform.OS === 'web' ? PHONE_HEIGHT * PHONE_ASPECT_RATIO : SCREEN_WIDTH;

export default function FeedScreen() {
  const { index, topics, isLoading } = useSefaria();
  const [cardPool, setCardPool] = useState<CardPool | null>(null);
  const [cards, setCards] = useState<FeedCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Build card pool when data is available
  useEffect(() => {
    if (index && topics) {
      const pool = buildCardPool(index, topics);
      setCardPool(pool);

      // Initialize with first batch of cards
      const initialCards: FeedCard[] = [];
      for (let i = 0; i < 10; i++) {
        initialCards.push(getRandomCard(pool));
      }
      setCards(initialCards);
    }
  }, [index, topics]);

  // Load more cards when nearing the end
  const loadMoreCards = useCallback(() => {
    if (!cardPool) return;

    const newCards: FeedCard[] = [];
    for (let i = 0; i < 5; i++) {
      newCards.push(getRandomCard(cardPool));
    }
    setCards(prev => [...prev, ...newCards]);
  }, [cardPool]);

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
      loadMoreCards();
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: currentIndex + 1,
          animated: true,
        });
      }, 100);
    }
  }, [currentIndex, cards.length, loadMoreCards]);

  // Render each card
  const renderCard = useCallback(
    ({ item }: { item: FeedCard }) => (
      <View style={[styles.cardContainer, { height: PHONE_HEIGHT, width: PHONE_WIDTH }]}>
        <FeedCardRenderer
          card={item}
          onNextCard={Platform.OS === 'web' ? handleNextCard : undefined}
        />
      </View>
    ),
    [handleNextCard]
  );

  // Loading state
  if (isLoading || !cardPool) {
    const loadingContent = (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.hotPink} />
        <Text style={styles.loadingText}>
          Loading...
        </Text>
      </View>
    );

    if (Platform.OS === 'web') {
      return (
        <View style={styles.webWrapper}>
          <View style={[styles.phoneContainer, { width: PHONE_WIDTH, height: PHONE_HEIGHT }]}>
            {loadingContent}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.mobileContainer}>
        {loadingContent}
      </View>
    );
  }

  const feedContent = (
    <FlatList
      ref={flatListRef}
      data={cards}
      renderItem={renderCard}
      keyExtractor={(item, idx) => `${item.id}-${idx}`}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={PHONE_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      onEndReached={loadMoreCards}
      onEndReachedThreshold={0.5}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      getItemLayout={(_, idx) => ({
        length: PHONE_HEIGHT,
        offset: PHONE_HEIGHT * idx,
        index: idx,
      })}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={5}
      style={{ width: PHONE_WIDTH }}
    />
  );

  // On web, wrap in mock phone view
  if (Platform.OS === 'web') {
    return (
      <View style={styles.webWrapper}>
        <View style={[styles.phoneContainer, { width: PHONE_WIDTH, height: PHONE_HEIGHT }]}>
          {feedContent}
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 16,
    color: colors.gray[500],
  },
});
