const SEFARIA_BASE_URL = 'https://www.sefaria.org';

function toSefariaSlug(value: string): string {
  return value.trim().replace(/\s+/g, '_');
}

export function buildSefariaTextUrl(title: string): string {
  return `${SEFARIA_BASE_URL}/${toSefariaSlug(title)}`;
}

export function buildSefariaCategoryUrl(categories: string[]): string {
  const path = categories.map(toSefariaSlug).join('/');
  return `${SEFARIA_BASE_URL}/texts/${path}`;
}

export function buildSefariaTopicUrl(slug: string): string {
  return `${SEFARIA_BASE_URL}/topics/${slug}`;
}
