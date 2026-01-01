import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { TopicCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { colors } from '@/constants/colors';

interface TopicCardViewProps {
  card: TopicCard;
  onNextCard?: () => void;
}

export function TopicCardView({ card, onNextCard }: TopicCardViewProps) {
  const sourceCount = card.numSources && card.numSources > 0
    ? `${card.numSources.toLocaleString()} sources`
    : null;

  return (
    <CardWrapper type="Topic" icon="tag" onNextCard={onNextCard}>
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

      {/* Description */}
      {card.description ? (
        <Text style={styles.description}>
          {card.description}
        </Text>
      ) : (
        <Text style={styles.descriptionEmpty}>
          A topic explored throughout Jewish literature.
        </Text>
      )}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
    marginBottom: 12,
  },
  meta: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.gray[700],
  },
  descriptionEmpty: {
    fontSize: 16,
    lineHeight: 26,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
});
