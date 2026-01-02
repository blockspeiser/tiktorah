import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions, Pressable, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { TextCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { CardLinks } from './CardLinks';
import { MarkdownText } from '@/components/MarkdownText';
import { colors } from '@/constants/colors';
import palette from '@/constants/palette';
import { buildSefariaTextUrl } from '@/utils/links';

interface TextCardViewProps {
  card: TextCard;
  onNextCard?: () => void;
  cardHeight?: number;
}

export function TextCardView({ card, onNextCard, cardHeight }: TextCardViewProps) {
  const { height: screenHeight } = useWindowDimensions();
  const effectiveHeight = cardHeight ?? screenHeight;
  const breadcrumb = card.categories.length > 0
    ? card.categories.join(' › ')
    : null;
  const accentColor = palette.categoryColor(card.categories[0] || card.title);
  const sefariaUrl = buildSefariaTextUrl(card.title);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [descriptionHeight, setDescriptionHeight] = useState(0);
  const [linksHeight, setLinksHeight] = useState(0);

  const contentHeight = Math.max(0, effectiveHeight - 24 - 28 - 60);
  const availableBodyHeight = Math.max(0, contentHeight - headerHeight - linksHeight - 12);
  const maxDescriptionHeight = availableBodyHeight > 0
    ? Math.min(availableBodyHeight, Math.max(140, availableBodyHeight - 120))
    : undefined;
  const maxExcerptHeight = useMemo(() => {
    if (!availableBodyHeight) return undefined;
    const reservedForDescription = Math.min(descriptionHeight || maxDescriptionHeight || 0, availableBodyHeight);
    return Math.max(0, availableBodyHeight - reservedForDescription);
  }, [availableBodyHeight, descriptionHeight, maxDescriptionHeight]);

  const excerptLines = useMemo(() => {
    if (!maxExcerptHeight || maxExcerptHeight <= 0) return undefined;
    const usableHeight = maxExcerptHeight - 28 - 8 - 26;
    if (usableHeight <= 0) return 1;
    return Math.max(1, Math.floor(usableHeight / 26));
  }, [maxExcerptHeight]);

  const handleExcerptPress = () => {
    if (!card.excerpt?.ref) return;
    const url = `https://www.sefaria.org/${encodeURIComponent(card.excerpt.ref)}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    Linking.openURL(url);
  };

  return (
    <CardWrapper
      type="Text"
      icon="book-open-page-variant"
      accentColor={accentColor}
      onNextCard={onNextCard}
    >
      <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
        {/* Breadcrumb path */}
        {breadcrumb && (
          <Text style={styles.breadcrumb}>
            {breadcrumb}
          </Text>
        )}

        {/* Title */}
        <Text style={styles.title}>
          {card.title}
        </Text>
      </View>

      <View onLayout={(event) => setDescriptionHeight(event.nativeEvent.layout.height)}>
        <MarkdownText maxHeight={maxDescriptionHeight}>{card.description}</MarkdownText>
      </View>

      {card.excerpt && (maxExcerptHeight === undefined || maxExcerptHeight > 0) && (
        <Pressable
          onPress={handleExcerptPress}
          style={({ pressed }) => ([
            styles.excerptBox,
            { borderLeftColor: accentColor, maxHeight: maxExcerptHeight },
            pressed && styles.excerptBoxPressed,
          ])}
        >
          <Text style={styles.excerptRef}>{card.excerpt.ref}</Text>
          <Text style={styles.excerptText} numberOfLines={excerptLines} ellipsizeMode="tail">
            {card.excerpt.text}
          </Text>
        </Pressable>
      )}

      <View onLayout={(event) => setLinksHeight(event.nativeEvent.layout.height)}>
        <CardLinks links={[{ label: 'Sefaria', url: sefariaUrl }]} />
      </View>
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
    marginBottom: 6,
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
