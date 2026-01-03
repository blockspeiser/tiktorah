import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { TopicCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { CardLayout } from './CardLayout';
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
  const renderHeader = (
    <View>
      <Text style={styles.title}>
        {card.title}
      </Text>
      {sourceCount && (
        <Text style={styles.meta}>
          {sourceCount}
        </Text>
      )}
    </View>
  );

  const renderDescription = (maxHeight?: number) => (
    <MarkdownText maxHeight={maxHeight}>{card.description}</MarkdownText>
  );

  const renderExcerpt = (maxHeight?: number) => {
    if (!card.excerpt) return null;
    const lineHeight = 30;
    const usableHeight = maxHeight ? Math.max(0, maxHeight - 30 - 8 - 28) : 0;
    const lines = maxHeight ? Math.max(1, Math.floor(usableHeight / lineHeight)) : undefined;
    return (
      <View style={[styles.excerptBox, { borderLeftColor: accentColor, maxHeight }]}>
        <Text style={styles.excerptRef}>{card.excerpt.ref}</Text>
        <Text style={styles.excerptText} numberOfLines={lines} ellipsizeMode="tail">
          {card.excerpt.text}
        </Text>
      </View>
    );
  };

  return (
    <CardWrapper
      type={typeLabel}
      icon="tag"
      accentColor={accentColor}
      onNextCard={onNextCard}
    >
      <CardLayout
        cardHeight={cardHeight}
        header={renderHeader}
        description={renderDescription}
        extra={card.excerpt ? renderExcerpt : undefined}
        footer={<CardLinks links={links} />}
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
