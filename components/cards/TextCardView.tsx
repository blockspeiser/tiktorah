import React, { useMemo } from 'react';
import { Platform, StyleSheet, View, Pressable, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { TextCard } from '@/types/cards';
import { CardWrapper, CARD_ACCENT_HEIGHT } from './CardWrapper';
import { CardLayout } from './CardLayout';
import { CardLinks } from './CardLinks';
import { MarkdownText } from '@/components/MarkdownText';
import { colors } from '@/constants/colors';
import palette from '@/constants/palette';
import { buildSefariaTextUrl } from '@/utils/links';
import { sanitizeText } from '@/services/sefariaText';

interface TextCardViewProps {
  card: TextCard;
  onNextCard?: () => void;
  cardHeight?: number;
}

export function TextCardView({ card, onNextCard, cardHeight }: TextCardViewProps) {
  const breadcrumb = card.categories.length > 0
    ? card.categories.join(' › ')
    : null;
  const accentColor = palette.categoryColor(card.categories[0] || card.title);
  const sefariaUrl = buildSefariaTextUrl(card.title);

  const excerptLines = useMemo(() => {
    if (!cardHeight || cardHeight <= 0) return undefined;
    const lineHeight = 30;
    const headerSpace = 30 + 8;
    const padding = 28;
    const usableHeight = Math.max(0, cardHeight - CARD_ACCENT_HEIGHT - headerSpace - padding);
    if (usableHeight <= 0) return undefined;
    return Math.max(1, Math.floor(usableHeight / lineHeight));
  }, [cardHeight]);

  const excerptText = useMemo(() => {
    if (!card.excerpt?.text) return null;
    return sanitizeText(card.excerpt.text);
  }, [card.excerpt?.text]);

  const renderHeader = (
    <View>
      {breadcrumb && (
        <Text style={styles.breadcrumb}>
          {breadcrumb}
        </Text>
      )}
      <Text style={styles.title}>
        {card.title}
      </Text>
    </View>
  );

  const renderDescription = (maxHeight?: number) => (
    <MarkdownText maxHeight={maxHeight}>{card.description}</MarkdownText>
  );

  const handleExcerptPress = () => {
    if (!card.excerpt?.ref) return;
    const url = `https://www.sefaria.org/${encodeURIComponent(card.excerpt.ref)}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    Linking.openURL(url);
  };

  const renderExcerpt = (maxHeight?: number) => {
    if (!card.excerpt || !excerptText) return null;
    const lines = maxHeight
      ? Math.max(1, Math.floor((maxHeight - 30 - 8 - 28) / 30))
      : excerptLines;
    return (
      <Pressable
        onPress={handleExcerptPress}
        style={({ pressed }) => ([
          styles.excerptBox,
          { borderLeftColor: accentColor, maxHeight },
          pressed && styles.excerptBoxPressed,
        ])}
      >
        <Text style={styles.excerptRef}>{card.excerpt.ref}</Text>
        <Text style={styles.excerptText} numberOfLines={lines} ellipsizeMode="tail">
          {excerptText}
        </Text>
      </Pressable>
    );
  };

  return (
    <CardWrapper
      type="Text"
      icon="book-open-page-variant"
      accentColor={accentColor}
      onNextCard={onNextCard}
    >
      <CardLayout
        cardHeight={cardHeight}
        header={renderHeader}
        description={renderDescription}
        extra={card.excerpt ? renderExcerpt : undefined}
        footer={<CardLinks links={[{ label: 'Sefaria', url: sefariaUrl }]} />}
      />
    </CardWrapper>
  );
}

const serifFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const styles = StyleSheet.create({
  breadcrumb: {
    fontSize: 18,
    color: colors.gray[500],
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 28,
    marginBottom: 0,
  },
  excerptBox: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 6,
    borderColor: colors.gray[300],
    borderRadius: 6,
    backgroundColor: colors.white,
    overflow: 'hidden',
  },
  excerptBoxPressed: {
    opacity: 0.8,
  },
  excerptRef: {
    fontSize: 20,
    lineHeight: 30,
    color: colors.gray[500],
    marginBottom: 8,
    fontFamily: serifFont,
  },
  excerptText: {
    fontSize: 20,
    lineHeight: 30,
    color: colors.gray[700],
    fontFamily: serifFont,
  },
});
