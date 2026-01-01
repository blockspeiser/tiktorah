import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { GenreCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { colors } from '@/constants/colors';

interface GenreCardViewProps {
  card: GenreCard;
  onNextCard?: () => void;
}

export function GenreCardView({ card, onNextCard }: GenreCardViewProps) {
  const breadcrumb = card.parentCategories.length > 0
    ? card.parentCategories.join(' › ')
    : null;

  return (
    <CardWrapper type="Genre" icon="bookshelf" onNextCard={onNextCard}>
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
          A collection of texts in the {card.title} category.
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
