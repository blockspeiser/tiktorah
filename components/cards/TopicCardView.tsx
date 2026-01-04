import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { TopicCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { CardLayout } from './CardLayout';
import { CardLinks } from './CardLinks';
import { MarkdownText } from '@/components/MarkdownText';
import { colors } from '@/constants/colors';
import palette from '@/constants/palette';
import { buildSefariaTopicUrl } from '@/utils/links';
import { sanitizeText } from '@/services/sefariaText';
import { TextBlock } from './TextBlock';

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
  const excerptText = useMemo(() => {
    if (!card.excerpt?.text) return null;
    return sanitizeText(card.excerpt.text);
  }, [card.excerpt?.text]);
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
    if (!card.excerpt || !excerptText) return null;
    return (
      <TextBlock
        reference={card.excerpt.ref}
        text={excerptText}
        accentColor={accentColor}
        maxHeight={maxHeight}
      />
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

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginTop: 28,
    marginBottom: 0,
  },
  meta: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 0,
  },
});
