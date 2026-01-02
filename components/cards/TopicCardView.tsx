import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { TopicCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { CardLinks } from './CardLinks';
import { MarkdownText } from '@/components/MarkdownText';
import { colors } from '@/constants/colors';
import palette from '@/constants/palette';
import { buildSefariaTopicUrl } from '@/utils/links';

interface TopicCardViewProps {
  card: TopicCard;
  onNextCard?: () => void;
  cardHeight?: number;
}

export function TopicCardView({ card, onNextCard, cardHeight }: TopicCardViewProps) {
  const { height: screenHeight } = useWindowDimensions();
  const effectiveHeight = cardHeight ?? screenHeight;
  const sourceCount = card.numSources && card.numSources > 0
    ? `${card.numSources.toLocaleString()} sources on Sefaria`
    : null;
  const accentColor = useMemo(() => palette.randomColor(), [card.id]);
  const sefariaUrl = buildSefariaTopicUrl(card.slug);
  const links = [
    { label: 'Sefaria', url: sefariaUrl },
    ...(card.wikiLink ? [{ label: 'Wikipedia', url: card.wikiLink }] : []),
  ];
  const typeLabel = card.displayType ?? 'Topic';

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

  return (
    <CardWrapper
      type={typeLabel}
      icon="tag"
      accentColor={accentColor}
      onNextCard={onNextCard}
    >
      <View onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
        {/* Title */}
        <Text style={styles.title}>
          {card.title}
        </Text>

        {/* Source count */}
        {sourceCount && (
          <Text style={styles.meta}>
            {sourceCount}
          </Text>
        )}
      </View>

      <View onLayout={(event) => setDescriptionHeight(event.nativeEvent.layout.height)}>
        <MarkdownText maxHeight={maxDescriptionHeight}>{card.description}</MarkdownText>
      </View>

      {card.excerpt && (maxExcerptHeight === undefined || maxExcerptHeight > 0) && (
        <View
          style={[styles.excerptBox, { borderLeftColor: accentColor, maxHeight: maxExcerptHeight }]}
        >
          <Text style={styles.excerptRef}>{card.excerpt.ref}</Text>
          <Text style={styles.excerptText} numberOfLines={excerptLines} ellipsizeMode="tail">
            {card.excerpt.text}
          </Text>
        </View>
      )}

      <View onLayout={(event) => setLinksHeight(event.nativeEvent.layout.height)}>
        <CardLinks links={links} />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 28,
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 12,
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
