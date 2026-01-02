import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { GenreCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { CardLinks } from './CardLinks';
import { MarkdownText } from '@/components/MarkdownText';
import { colors } from '@/constants/colors';
import palette from '@/constants/palette';
import { buildSefariaCategoryUrl } from '@/utils/links';

interface GenreCardViewProps {
  card: GenreCard;
  onNextCard?: () => void;
}

export function GenreCardView({ card, onNextCard }: GenreCardViewProps) {
  const breadcrumb = card.parentCategories.length > 0
    ? card.parentCategories.join(' › ')
    : null;
  const accentColor = palette.categoryColor(card.category);
  const categoryPath = [...card.parentCategories, card.category].filter(Boolean);
  const sefariaUrl = buildSefariaCategoryUrl(categoryPath);

  return (
    <CardWrapper
      type="Text Category"
      icon="bookshelf"
      accentColor={accentColor}
      iconColor={accentColor}
      onNextCard={onNextCard}
    >
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

      {/* Description with truncation */}
      <MarkdownText maxHeight={400}>{card.description}</MarkdownText>

      <CardLinks links={[{ label: 'Sefaria', url: sefariaUrl }]} />
    </CardWrapper>
  );
}

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
});
