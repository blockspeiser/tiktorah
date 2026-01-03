import { SefariaIndex, SefariaTopics, SefariaCategory, SefariaTopic } from '@/services/sefariaData';
import {
  FeedCard,
  GenreCard,
  TextCard,
  AuthorCard,
  AuthorImage,
  TopicCard,
  getPrimaryEnglishTitle,
  getPrimaryHebrewTitle,
} from '@/types/cards';
import topicCategoriesData from '@/data/topic-categories.json';

// Topic category mapping
const topicCategories = topicCategoriesData as {
  categories: Record<string, string>;
  topicToCategory: Record<string, string>;
};

// Flatten the index to get all texts and genres
interface FlattenedItem {
  type: 'text' | 'genre';
  item: SefariaCategory;
  path: string[];
}

// Find the first book (text) in a category's contents
function findFirstBook(contents: SefariaCategory[] | undefined): string | null {
  if (!contents) return null;

  for (const item of contents) {
    // If this is a text (has title), return it
    if (item.title) {
      return item.title;
    }
    // If this is a category, recurse into its contents
    if (item.contents) {
      const found = findFirstBook(item.contents);
      if (found) return found;
    }
  }

  return null;
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

// Convert index item to GenreCard - only call if description is validated
function indexToGenreCard(item: SefariaCategory, path: string[], description: string): GenreCard {
  const firstBookTitle = findFirstBook(item.contents) ?? undefined;

  return {
    id: `genre-${item.category}-${path.join('-')}`,
    type: 'genre',
    title: item.category ?? 'Unknown Category',
    description, // Already validated
    category: item.category ?? '',
    parentCategories: path,
    firstBookTitle,
  };
}

// Convert index item to TextCard - only call if description is validated
function indexToTextCard(item: SefariaCategory, path: string[], description: string): TextCard {
  const categories = item.categories && item.categories.length > 0
    ? item.categories
    : path;

  return {
    id: `text-${item.title}`,
    type: 'text',
    title: item.title ?? 'Unknown Text',
    description, // Already validated
    categories,
    heTitle: item.heTitle ?? '',
  };
}

// Convert topic to AuthorCard - only call if description is validated
function topicToAuthorCard(topic: SefariaTopic, description: string): AuthorCard {
  const generation = topic.properties?.generation?.value;
  const hasWikidata = Boolean(topic.alt_ids?.wikidata);

  // Determine display type:
  // - Talmudic figures have generation codes (T1, T2, A1, A2, etc.)
  // - Biblical figures have wikidata IDs but no generation (they're historical figures from Tanakh)
  // - Others are general authors
  const displayType = generation
    ? 'Talmudic Figures'
    : hasWikidata
      ? 'Biblical Figures'
      : 'Author';

  // Extract image if available
  let image: AuthorImage | undefined;
  if (topic.image?.image_uri) {
    image = {
      uri: topic.image.image_uri,
      caption: topic.image.image_caption?.en,
    };
  }

  return {
    id: `author-${topic.slug}`,
    type: 'author',
    slug: topic.slug,
    displayType,
    title: getPrimaryEnglishTitle(topic.titles),
    description, // Already validated
    heTitle: getPrimaryHebrewTitle(topic.titles),
    generation: generation,
    numSources: topic.numSources,
    image,
    wikiLink: topic.properties?.enWikiLink?.value,
    jewishEncyclopediaLink: topic.properties?.jeLink?.value,
  };
}

// Get the display category for a topic
function getTopicCategory(topic: SefariaTopic, title: string): string {
  if (topic.parasha) {
    return topicCategories.categories['torah-portions'] ?? 'Torah Portions';
  }

  const tocCategory = topic.alt_ids?._temp_toc_id;
  if (tocCategory) {
    return tocCategory;
  }

  const slug = topic.slug;

  // Check explicit mapping first
  if (topicCategories.topicToCategory[slug]) {
    return topicCategories.topicToCategory[slug];
  }

  // Check if it's a known category itself
  if (topicCategories.categories[slug]) {
    return topicCategories.categories[slug];
  }

  // If it's a top-level display topic, use its title
  if (topic.isTopLevelDisplay) {
    return title;
  }

  // Default to "Topic"
  return 'Topic';
}

// Convert topic to TopicCard - only call if description is validated
function topicToTopicCard(topic: SefariaTopic, description: string): TopicCard {
  const title = getPrimaryEnglishTitle(topic.titles);
  const displayType = getTopicCategory(topic, title);

  return {
    id: `topic-${topic.slug}`,
    type: 'topic',
    slug: topic.slug,
    title,
    description, // Already validated
    displayType,
    heTitle: getPrimaryHebrewTitle(topic.titles),
    numSources: topic.numSources,
    wikiLink: topic.properties?.enWikiLink?.value,
  };
}

export interface CardPool {
  genres: GenreCard[];
  texts: TextCard[];
  authors: AuthorCard[];
  topics: TopicCard[];
}

/**
 * STRICT check if a string has meaningful content.
 * Returns true ONLY if the string exists, is not empty, and has non-whitespace content.
 */
function hasValidDescription(desc: string | undefined | null): desc is string {
  if (desc === undefined || desc === null) return false;
  if (typeof desc !== 'string') return false;
  if (desc.trim().length === 0) return false;
  // Also reject very short descriptions (likely placeholders)
  if (desc.trim().length < 10) return false;
  return true;
}

/**
 * Get a valid description from multiple possible sources.
 * Returns the first valid description or null if none found.
 */
function getValidDescription(...sources: (string | undefined | null)[]): string | null {
  for (const source of sources) {
    if (hasValidDescription(source)) {
      return source;
    }
  }
  return null;
}

// Build the card pool from index and topics data
// STRICT: Only includes items that have valid, non-empty descriptions
export function buildCardPool(index: SefariaIndex, topics: SefariaTopics): CardPool {
  const flattened = flattenIndex(index);

  const genres: GenreCard[] = [];
  const texts: TextCard[] = [];

  for (const { type, item, path } of flattened) {
    if (type === 'genre') {
      // Genres: get first valid description from enDesc or enShortDesc
      const description = getValidDescription(item.enDesc, item.enShortDesc);
      if (description) {
        genres.push(indexToGenreCard(item, path, description));
      }
    } else {
      // Texts: get first valid description from enDesc or enShortDesc
      const description = getValidDescription(item.enDesc, item.enShortDesc);
      if (description) {
        texts.push(indexToTextCard(item, path, description));
      }
    }
  }

  const authors: AuthorCard[] = [];
  const topicCards: TopicCard[] = [];

  for (const topic of topics) {
    if (topic.subclass === 'person') {
      // Authors: must have valid description
      const description = getValidDescription(topic.description?.en);
      if (description) {
        authors.push(topicToAuthorCard(topic, description));
      }
    } else {
      // Topics: get first valid description from description or categoryDescription
      const description = getValidDescription(topic.description?.en, topic.categoryDescription?.en);
      if (description) {
        topicCards.push(topicToTopicCard(topic, description));
      }
    }
  }

  return {
    genres,
    texts,
    authors,
    topics: topicCards,
  };
}

/**
 * FINAL GUARDRAIL: Verify a card has a valid description.
 * This is a defense-in-depth check - cards should already be filtered,
 * but this ensures nothing slips through.
 */
function isValidCard(card: FeedCard): boolean {
  return hasValidDescription(card.description);
}

// Get a random card from the pool (with validation)
export function getRandomCard(pool: CardPool): FeedCard | null {
  const allCards: FeedCard[] = [
    ...pool.genres,
    ...pool.texts,
    ...pool.authors,
    ...pool.topics,
  ].filter(isValidCard); // Final safety filter

  if (allCards.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * allCards.length);
  return allCards[randomIndex];
}

// Get multiple random cards (without repeats, with validation)
export function getRandomCards(pool: CardPool, count: number): FeedCard[] {
  const allCards: FeedCard[] = [
    ...pool.genres,
    ...pool.texts,
    ...pool.authors,
    ...pool.topics,
  ].filter(isValidCard); // Final safety filter

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
