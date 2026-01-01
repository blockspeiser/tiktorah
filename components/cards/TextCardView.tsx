import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { TextCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { colors } from '@/constants/colors';

interface TextCardViewProps {
  card: TextCard;
  onNextCard?: () => void;
}

export function TextCardView({ card, onNextCard }: TextCardViewProps) {
  const breadcrumb = card.categories.length > 0
    ? card.categories.join(' › ')
    : null;

  return (
    <CardWrapper type="Text" icon="book-open-page-variant" onNextCard={onNextCard}>
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

      {/* Description */}
      {card.description ? (
        <Text style={styles.description}>
          {card.description}
        </Text>
      ) : (
        <Text style={styles.descriptionEmpty}>
          A text from the Jewish literary tradition.
        </Text>
      )}
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  breadcrumb: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray[900],
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
