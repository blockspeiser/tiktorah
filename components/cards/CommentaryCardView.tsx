import React, { useMemo } from 'react';
import { Platform, StyleSheet, View, Linking } from 'react-native';
import { Text } from 'react-native-paper';
import { CommentaryCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { CardLayout } from './CardLayout';
import { CardLinks } from './CardLinks';
import { MarkdownText } from '@/components/MarkdownText';
import { colors } from '@/constants/colors';
import palette from '@/constants/palette';
import { buildSefariaRefUrl, buildSefariaTextUrl } from '@/utils/links';
import { sanitizeText } from '@/services/sefariaText';
import { TextBlock } from './TextBlock';

interface CommentaryCardViewProps {
  card: CommentaryCard;
  onNextCard?: () => void;
  cardHeight?: number;
}

export function CommentaryCardView({ card, onNextCard, cardHeight }: CommentaryCardViewProps) {
  const breadcrumb = card.categories.length > 0
    ? card.categories.join(' > ')
    : null;
  const accentColor = palette.categoryColor(card.categories[0] || card.title);
  const sefariaUrl = buildSefariaTextUrl(card.title);

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
    const url = buildSefariaRefUrl(card.excerpt.ref);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    Linking.openURL(url);
  };

  const renderExcerpt = (maxHeight?: number) => {
    if (!card.excerpt || !excerptText) return null;
    return (
      <TextBlock
        reference={card.excerpt.ref}
        text={excerptText}
        accentColor={accentColor}
        maxHeight={maxHeight}
        onPress={handleExcerptPress}
      />
    );
  };

  return (
    <CardWrapper
      type="Commentary"
      icon="comment-text-outline"
      accentColor={accentColor}
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
