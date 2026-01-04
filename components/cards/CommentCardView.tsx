import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar, Text } from 'react-native-paper';
import { CommentFeedCard } from '@/types/cards';
import { CardWrapper } from './CardWrapper';
import { CardLayout } from './CardLayout';
import { colors } from '@/constants/colors';
import palette from '@/constants/palette';
import { TextBlock } from './TextBlock';

interface CommentCardViewProps {
  card: CommentFeedCard;
  onNextCard?: () => void;
  cardHeight?: number;
  actions?: React.ReactNode;
}

export function CommentCardView({ card, onNextCard, cardHeight, actions }: CommentCardViewProps) {
  const accentColor = useMemo(() => {
    return card.citationCategory
      ? palette.categoryColor(card.citationCategory)
      : palette.randomColor();
  }, [card.citationCategory, card.id]);

  const ownerName = card.ownerDisplayName ?? 'Anonymous';
  const ownerInitial = ownerName?.[0]?.toUpperCase() || 'U';

  const renderHeader = (
    <View>
      <View style={styles.authorRow}>
        {card.ownerPhotoURL ? (
          <Avatar.Image size={24} source={{ uri: card.ownerPhotoURL }} />
        ) : (
          <Avatar.Text size={24} label={ownerInitial} />
        )}
        <Text style={styles.author}>{ownerName}</Text>
      </View>
      {card.textBefore && (
        <Text style={styles.commentText}>{card.textBefore}</Text>
      )}
    </View>
  );

  const renderTextBlock = (maxHeight?: number) => (
    <View style={styles.textBlockWrap}>
      <TextBlock
        reference={card.citation}
        text={card.citationText}
        accentColor={accentColor}
        maxHeight={maxHeight}
      />
    </View>
  );

  const renderAfterText = card.textAfter ? (
    <Text style={[styles.commentText, styles.commentTextAfter]}>{card.textAfter}</Text>
  ) : undefined;

  return (
    <CardWrapper
      type="Comment"
      icon="comment-text"
      accentColor={accentColor}
      onNextCard={onNextCard}
      actions={actions}
    >
      <CardLayout
        cardHeight={cardHeight}
        header={renderHeader}
        description={renderTextBlock}
        afterDescription={renderAfterText}
        footer={undefined}
      />
    </CardWrapper>
  );
}

const styles = StyleSheet.create({
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[600],
  },
  commentText: {
    fontSize: 20,
    lineHeight: 28,
    color: colors.gray[800],
    marginVertical: 4,
  },
  commentTextAfter: {
    paddingLeft: 28,
    paddingRight: 12,
    marginTop: 6,
  },
  textBlockWrap: {
    marginTop: 8,
    marginBottom: 8,
  },
});
