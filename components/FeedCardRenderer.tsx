import React from 'react';
import { FeedCard } from '@/types/cards';
import {
  GenreCardView,
  TextCardView,
  AuthorCardView,
  TopicCardView,
} from './cards';

interface FeedCardRendererProps {
  card: FeedCard;
  onNextCard?: () => void;
  cardHeight?: number;
}

export function FeedCardRenderer({ card, onNextCard, cardHeight }: FeedCardRendererProps) {
  switch (card.type) {
    case 'genre':
      return <GenreCardView card={card} onNextCard={onNextCard} cardHeight={cardHeight} />;
    case 'text':
      return <TextCardView card={card} onNextCard={onNextCard} cardHeight={cardHeight} />;
    case 'author':
      return <AuthorCardView card={card} onNextCard={onNextCard} cardHeight={cardHeight} />;
    case 'topic':
      return <TopicCardView card={card} onNextCard={onNextCard} cardHeight={cardHeight} />;
    default:
      return null;
  }
}
