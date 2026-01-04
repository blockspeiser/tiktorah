import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { GenreCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { CardLayout } from './CardLayout';
import { CardLinks } from './CardLinks';
import { MarkdownText } from '@/components/MarkdownText';
import { colors } from '@/constants/colors';
import palette from '@/constants/palette';
import { buildSefariaCategoryUrl } from '@/utils/links';
import { TextBlock } from './TextBlock';
import { sanitizeText } from '@/services/sefariaText';

interface GenreCardViewProps {
  card: GenreCard;
  onNextCard?: () => void;
  cardHeight?: number;
}

export function GenreCardView({ card, onNextCard, cardHeight }: GenreCardViewProps) {
  const breadcrumb = card.parentCategories.length > 0
    ? card.parentCategories.join(' › ')
    : null;
  const accentColor = palette.categoryColor(card.category);
  const categoryPath = [...card.parentCategories, card.category].filter(Boolean);
  const sefariaUrl = buildSefariaCategoryUrl(categoryPath);
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
      type="Text Category"
      icon="bookshelf"
      accentColor={accentColor}
      iconColor={accentColor}
      onNextCard={onNextCard}
    >
      <CardLayout
        cardHeight={cardHeight}
        header={renderHeader}
        description={renderDescription}
        afterDescription={<CardLinks links={[{ label: 'Sefaria', url: sefariaUrl }]} />}
        extra={card.excerpt ? renderExcerpt : undefined}
        footer={undefined}
      />
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
    marginTop: 12,
    marginBottom: 0,
  },
});
