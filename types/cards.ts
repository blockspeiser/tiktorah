import { SefariaCategory, SefariaTopic } from '@/services/sefariaData';

export type CardType = 'genre' | 'text' | 'author' | 'topic' | 'meme' | 'commentary' | 'comment' | 'loading';

export interface BaseCard {
  id: string;
  type: CardType;
  title: string;
  description: string;
}

export interface GenreCard extends BaseCard {
  type: 'genre';
  category: string;
  parentCategories: string[];
  firstBookTitle?: string;
  excerpt?: {
    ref: string;
    text: string;
  };
}

export interface TextCard extends BaseCard {
  type: 'text';
  categories: string[];
  heTitle: string;
  excerpt?: {
    ref: string;
    text: string;
  };
}

export interface CommentaryCard extends BaseCard {
  type: 'commentary';
  categories: string[];
  heTitle: string;
  dependence: string;
  baseTextTitles?: string[];
  excerpt?: {
    ref: string;
    text: string;
  };
}

export interface AuthorImage {
  uri: string;
  caption?: string;
}

export interface AuthorCard extends BaseCard {
  type: 'author';
  slug: string;
  heTitle: string;
  displayType?: string;
  generation?: string;
  numSources?: number;
  image?: AuthorImage;
  wikiLink?: string;
  jewishEncyclopediaLink?: string;
}

export interface TopicCard extends BaseCard {
  type: 'topic';
  slug: string;
  heTitle: string;
  displayType?: string;
  numSources?: number;
  wikiLink?: string;
  excerpt?: {
    ref: string;
    text: string;
  };
}

export interface MemeFeedCard extends BaseCard {
  type: 'meme';
  imageUrl?: string;
  caption?: string | null;
  ownerDisplayName?: string | null;
  ownerProfileLink?: string | null;
  ownerPhotoURL?: string | null;
  citation?: string | null;
  citationText?: string | null;
  citationCategory?: string | null;
  memeLink?: string | null;
}

export interface CommentFeedCard extends BaseCard {
  type: 'comment';
  textBefore?: string | null;
  textAfter?: string | null;
  citation: string;
  citationText: string;
  citationCategory?: string | null;
  ownerDisplayName?: string | null;
  ownerProfileLink?: string | null;
  ownerPhotoURL?: string | null;
}

export interface LoadingCard extends BaseCard {
  type: 'loading';
}

export type FeedCard = GenreCard | TextCard | CommentaryCard | AuthorCard | TopicCard | MemeFeedCard | CommentFeedCard | LoadingCard;

// Helper to get primary English title from topic titles array
export function getPrimaryEnglishTitle(titles: SefariaTopic['titles']): string {
  const primary = titles.find(t => t.lang === 'en' && t.primary);
  if (primary) return primary.text;
  const anyEnglish = titles.find(t => t.lang === 'en');
  return anyEnglish?.text ?? 'Unknown';
}

// Helper to get primary Hebrew title from topic titles array
export function getPrimaryHebrewTitle(titles: SefariaTopic['titles']): string {
  const primary = titles.find(t => t.lang === 'he' && t.primary);
  if (primary) return primary.text;
  const anyHebrew = titles.find(t => t.lang === 'he');
  return anyHebrew?.text ?? '';
}
