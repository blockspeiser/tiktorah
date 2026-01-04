import { FeedCard } from '@/types/cards';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function buildCardSlug(card: FeedCard): string {
  const idSlug = slugify(card.id || card.title);
  if (card.type === 'meme') {
    const caption = card.caption?.trim() || card.title || 'meme';
    return `meme-${slugify(caption)}-${idSlug}`;
  }

  if (card.type === 'text') {
    return `text-${slugify(card.title)}-${idSlug}`;
  }

  if (card.type === 'genre') {
    return `category-${slugify(card.category || card.title)}-${idSlug}`;
  }

  if (card.type === 'author') {
    return `author-${slugify(card.slug || card.title)}-${idSlug}`;
  }

  if (card.type === 'topic') {
    return `topic-${slugify(card.slug || card.title)}-${idSlug}`;
  }

  return idSlug;
}
