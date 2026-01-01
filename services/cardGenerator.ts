import { SefariaIndex, SefariaTopics, SefariaCategory, SefariaTopic } from '@/services/sefariaData';
import {
  FeedCard,
  GenreCard,
  TextCard,
  AuthorCard,
  TopicCard,
  getPrimaryEnglishTitle,
  getPrimaryHebrewTitle,
} from '@/types/cards';

// Flatten the index to get all texts and genres
interface FlattenedItem {
  type: 'text' | 'genre';
  item: SefariaCategory;
  path: string[];
}

function flattenIndex(items: SefariaIndex, path: string[] = []): FlattenedItem[] {
  const result: FlattenedItem[] = [];

  for (const item of items) {
    if (item.title) {
      // This is a text
      result.push({
        type: 'text',
        item,
        path,
      });
    } else if (item.category) {
      // This is a genre/category
      result.push({
        type: 'genre',
        item,
        path,
      });
      // Recurse into contents
      if (item.contents) {
        result.push(...flattenIndex(item.contents, [...path, item.category]));
      }
    }
  }

  return result;
}

// Convert index item to GenreCard
function indexToGenreCard(item: SefariaCategory, path: string[]): GenreCard {
  return {
    id: `genre-${item.category}-${path.join('-')}`,
    type: 'genre',
    title: item.category ?? 'Unknown Category',
    description: item.enDesc ?? item.enShortDesc ?? '',
    category: item.category ?? '',
    parentCategories: path,
  };
}

// Convert index item to TextCard
function indexToTextCard(item: SefariaCategory): TextCard {
  return {
    id: `text-${item.title}`,
    type: 'text',
    title: item.title ?? 'Unknown Text',
    description: item.enShortDesc ?? '',
    categories: item.categories ?? [],
    heTitle: item.heTitle ?? '',
  };
}

// Convert topic to AuthorCard
function topicToAuthorCard(topic: SefariaTopic): AuthorCard {
  const generation = topic.properties?.generation?.value;

  return {
    id: `author-${topic.slug}`,
    type: 'author',
    title: getPrimaryEnglishTitle(topic.titles),
    description: topic.description?.en ?? '',
    heTitle: getPrimaryHebrewTitle(topic.titles),
    generation: generation,
    numSources: topic.numSources,
    wikiLink: topic.properties?.enWikiLink?.value,
  };
}

// Convert topic to TopicCard
function topicToTopicCard(topic: SefariaTopic): TopicCard {
  return {
    id: `topic-${topic.slug}`,
    type: 'topic',
    title: getPrimaryEnglishTitle(topic.titles),
    description: topic.description?.en ?? topic.categoryDescription?.en ?? '',
    heTitle: getPrimaryHebrewTitle(topic.titles),
    numSources: topic.numSources,
  };
}

export interface CardPool {
  genres: GenreCard[];
  texts: TextCard[];
  authors: AuthorCard[];
  topics: TopicCard[];
}

// Build the card pool from index and topics data
export function buildCardPool(index: SefariaIndex, topics: SefariaTopics): CardPool {
  const flattened = flattenIndex(index);

  const genres: GenreCard[] = [];
  const texts: TextCard[] = [];

  for (const { type, item, path } of flattened) {
    if (type === 'genre') {
      genres.push(indexToGenreCard(item, path));
    } else {
      texts.push(indexToTextCard(item));
    }
  }

  const authors: AuthorCard[] = [];
  const topicCards: TopicCard[] = [];

  for (const topic of topics) {
    if (topic.subclass === 'person') {
      authors.push(topicToAuthorCard(topic));
    } else {
      topicCards.push(topicToTopicCard(topic));
    }
  }

  return {
    genres,
    texts,
    authors,
    topics: topicCards,
  };
}

// Get a random card from the pool
export function getRandomCard(pool: CardPool): FeedCard {
  const allCards: FeedCard[] = [
    ...pool.genres,
    ...pool.texts,
    ...pool.authors,
    ...pool.topics,
  ];

  const randomIndex = Math.floor(Math.random() * allCards.length);
  return allCards[randomIndex];
}

// Get multiple random cards (without repeats)
export function getRandomCards(pool: CardPool, count: number): FeedCard[] {
  const allCards: FeedCard[] = [
    ...pool.genres,
    ...pool.texts,
    ...pool.authors,
    ...pool.topics,
  ];

  // Shuffle and take first N
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Get stats about the card pool
export function getPoolStats(pool: CardPool) {
  return {
    genres: pool.genres.length,
    texts: pool.texts.length,
    authors: pool.authors.length,
    topics: pool.topics.length,
    total: pool.genres.length + pool.texts.length + pool.authors.length + pool.topics.length,
  };
}
