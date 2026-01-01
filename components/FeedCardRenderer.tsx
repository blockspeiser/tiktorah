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
}

export function FeedCardRenderer({ card, onNextCard }: FeedCardRendererProps) {
  switch (card.type) {
    case 'genre':
      return <GenreCardView card={card} onNextCard={onNextCard} />;
    case 'text':
      return <TextCardView card={card} onNextCard={onNextCard} />;
    case 'author':
      return <AuthorCardView card={card} onNextCard={onNextCard} />;
    case 'topic':
      return <TopicCardView card={card} onNextCard={onNextCard} />;
    default:
      return null;
  }
}
