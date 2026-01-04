import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFeed } from '@/hooks/useFeed';
import { FeedCard } from '@/types/cards';
import { FeedCardRenderer } from '@/components/FeedCardRenderer';
import { DataModal } from '@/components/DataModal';
import { SplashScreen } from '@/components/SplashScreen';
import { colors } from '@/constants/colors';
import { buildCardSlug } from '@/utils/cardSlug';
import { PhoneViewport, usePhoneViewport } from '@/components/PhoneViewport';

const SPLASH_MIN_DURATION = 1000;

// Loading card ID
const LOADING_CARD_ID = '__loading__';

const log = (...args: unknown[]) => console.log('[FeedScreen]', ...args);

export default function FeedScreen() {
  const { cards, noContent, onScrollToIndex } = useFeed();
  const {
    isWeb,
    isMobileView,
    showHeader,
    phoneHeight,
    phoneWidth,
    mobileNavHeight,
  } = usePhoneViewport();

  // UI state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDataModal, setShowDataModal] = useState(false);
  const [splashMinTimeElapsed, setSplashMinTimeElapsed] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const lastReportedIndex = useRef(0);

  // Splash timer
  useEffect(() => {
    const timer = setTimeout(() => setSplashMinTimeElapsed(true), SPLASH_MIN_DURATION);
    return () => clearTimeout(timer);
  }, []);

  // Notify feed when user scrolls to a new position
  useEffect(() => {
    onScrollToIndex(currentIndex);
  }, [currentIndex, onScrollToIndex]);

  // Update URL on desktop
  useEffect(() => {
    if (!isWeb || isMobileView) return;
    const card = cards[currentIndex];
    if (!card || card.id === LOADING_CARD_ID || typeof window === 'undefined') return;
    window.history.replaceState({}, '', `/card/${buildCardSlug(card)}`);
  }, [cards, currentIndex, isWeb, isMobileView]);

  const handleNextCard = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }, [currentIndex, cards.length]);

  // Handle scroll position changes - used for both onScroll and onMomentumScrollEnd
  const handleScrollPositionChange = useCallback((offsetY: number) => {
    const nextIndex = Math.round(offsetY / phoneHeight);
    if (nextIndex !== lastReportedIndex.current && nextIndex >= 0) {
      log('scroll index changed:', lastReportedIndex.current, '->', nextIndex);
      lastReportedIndex.current = nextIndex;
      setCurrentIndex(nextIndex);
    }
  }, [phoneHeight]);

  // Render loading card
  const renderLoadingCard = useCallback((height: number) => (
    <View style={[styles.loadingCard, { height }]}>
      <ActivityIndicator size="large" color={colors.hotPink} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  ), []);

  const renderCard = useCallback(
    ({ item }: { item: FeedCard }) => {
      if (item.id === LOADING_CARD_ID) {
        return (
          <View style={[styles.cardContainer, { height: phoneHeight, width: phoneWidth }]}>
            {renderLoadingCard(phoneHeight)}
          </View>
        );
      }

      return (
        <View style={[styles.cardContainer, { height: phoneHeight, width: phoneWidth }]}>
          <FeedCardRenderer
            card={item}
            onNextCard={showHeader ? handleNextCard : undefined}
            cardHeight={phoneHeight}
          />
        </View>
      );
    },
    [handleNextCard, phoneHeight, phoneWidth, showHeader, renderLoadingCard]
  );

  // Determine ready state
  const hasRealCards = cards.length > 0 && cards[0].id !== LOADING_CARD_ID;
  const isReady = splashMinTimeElapsed && hasRealCards;

  // Error state - no content selected
  if (noContent && splashMinTimeElapsed) {
    const errorContent = (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.gray[400]} />
        <Text style={styles.errorText}>Select at least one content type in Settings.</Text>
      </View>
    );

    return (
      <PhoneViewport
        phoneWidth={phoneWidth}
        phoneHeight={phoneHeight}
        showHeader={showHeader}
        mobileNavHeight={mobileNavHeight}
      >
        {errorContent}
      </PhoneViewport>
    );
  }

  // Loading state
  if (!isReady) {
    return (
      <PhoneViewport
        phoneWidth={phoneWidth}
        phoneHeight={phoneHeight}
        showHeader={showHeader}
        mobileNavHeight={mobileNavHeight}
      >
        <SplashScreen />
      </PhoneViewport>
    );
  }

  // Feed content
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
      scrollEventThrottle={100}
      onScroll={(event) => {
        handleScrollPositionChange(event.nativeEvent.contentOffset.y);
      }}
      onMomentumScrollEnd={(event) => {
        handleScrollPositionChange(event.nativeEvent.contentOffset.y);
      }}
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

  return (
    <PhoneViewport
      phoneWidth={phoneWidth}
      phoneHeight={phoneHeight}
      showHeader={showHeader}
      mobileNavHeight={mobileNavHeight}
      overlay={showHeader ? (
        <>
          <Pressable style={styles.seeDataButton} onPress={() => setShowDataModal(true)}>
            <MaterialCommunityIcons name="code-json" size={20} color={colors.hotPink} />
          </Pressable>
          <DataModal
            visible={showDataModal}
            onClose={() => setShowDataModal(false)}
            card={cards[currentIndex]?.id === LOADING_CARD_ID ? null : cards[currentIndex] ?? null}
          />
        </>
      ) : undefined}
    >
      {feedContent}
    </PhoneViewport>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.white,
  },
  loadingCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: colors.gray[500],
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
