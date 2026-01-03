import { Platform } from 'react-native';

const SEFARIA_TEXT_API_URL = 'https://www.sefaria.org/api/texts';
const SEFARIA_INDEX_API_URL = 'https://www.sefaria.org/api/v2/index';
const SEFARIA_TOPIC_API_URL = 'https://www.sefaria.org/api/v2/topics';

export interface TextExcerpt {
  ref: string;
  text: string;
  categories?: string[];
  category?: string | null;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function findFirstText(value: unknown): string | null {
  if (typeof value === 'string') {
    const cleaned = stripHtml(value);
    return cleaned.length > 0 ? cleaned : null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const found = findFirstText(entry);
      if (found) return found;
    }
  }

  return null;
}

function extractRef(payload: Record<string, unknown>): string | null {
  const refCandidates = [
    payload.firstAvailableSectionRef,
    payload.firstAvailableRef,
    payload.sectionRef,
    payload.ref,
    payload.heRef,
  ];

  for (const ref of refCandidates) {
    if (typeof ref === 'string' && ref.trim().length > 0) {
      return ref;
    }
  }

  return null;
}

/**
 * Fetch the first section ref for a book from its index
 * This is needed for "complex" books that don't support book-level refs
 */
async function fetchFirstSectionRef(title: string): Promise<string | null> {
  try {
    const url = `${SEFARIA_INDEX_API_URL}/${encodeURIComponent(title)}`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const payload = await response.json();

    // Try various fields that might contain the first section ref
    const candidates = [
      payload.firstSectionRef,
      payload.first_section_ref,
    ];

    for (const ref of candidates) {
      if (typeof ref === 'string' && ref.trim().length > 0) {
        return ref;
      }
    }

    // For complex texts, try to build a ref from the schema
    // Look for the first leaf node in the schema
    if (payload.schema) {
      const firstRef = findFirstRefInSchema(payload.schema, title);
      if (firstRef) return firstRef;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Recursively find the first valid ref in a complex schema
 */
function findFirstRefInSchema(schema: Record<string, unknown>, baseTitle: string): string | null {
  // If this node has a firstSection, use it
  if (typeof schema.firstSection === 'string') {
    return schema.firstSection;
  }

  // If this is a leaf node (has no sub-nodes), try to construct a ref
  if (schema.nodeType === 'JaggedArrayNode' || schema.depth) {
    const titles = schema.titles as Array<{ text: string; lang: string; primary?: boolean }> | undefined;
    const enTitle = titles?.find(t => t.lang === 'en' && t.primary)?.text;
    if (enTitle && enTitle !== baseTitle) {
      // This is a named section, return the first segment
      return `${baseTitle}, ${enTitle} 1:1`;
    }
    // For simple structure, return first segment
    return `${baseTitle} 1:1`;
  }

  // Check nodes array for complex texts
  const nodes = schema.nodes as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(nodes) && nodes.length > 0) {
    for (const node of nodes) {
      const result = findFirstRefInSchema(node, baseTitle);
      if (result) return result;
    }
  }

  return null;
}

async function fetchTextWithRef(queryRef: string): Promise<{ payload: Record<string, unknown>; ok: boolean }> {
  const url = Platform.OS === 'web'
    ? `/api/sefaria-text?ref=${encodeURIComponent(queryRef)}`
    : `${SEFARIA_TEXT_API_URL}/${encodeURIComponent(queryRef)}?context=0`;
  const response = await fetch(url);

  if (!response.ok) {
    return { payload: {}, ok: false };
  }

  const payload = await response.json();

  // Check if we got an error about complex book structure
  if (payload.error && typeof payload.error === 'string' && payload.error.includes('complex')) {
    return { payload, ok: false };
  }

  return { payload, ok: true };
}

export async function fetchTextExcerpt(title: string): Promise<TextExcerpt | null> {
  try {
    const queryRef = title.trim();

    // First try direct fetch
    let { payload, ok } = await fetchTextWithRef(queryRef);

    // If it failed due to complex structure, try to get first section ref
    if (!ok) {
      const firstSectionRef = await fetchFirstSectionRef(queryRef);
      if (firstSectionRef) {
        const retryResult = await fetchTextWithRef(firstSectionRef);
        payload = retryResult.payload;
        ok = retryResult.ok;
      }

      if (!ok) return null;
    }

    const ref = extractRef(payload) ?? title;
    const text = findFirstText(payload.text) ?? findFirstText(payload.he);
    const categories = Array.isArray(payload.categories)
      ? payload.categories.filter((entry: unknown) => typeof entry === 'string')
      : [];
    const category = categories.length > 0 ? categories[0] : null;

    if (!text) return null;

    return { ref, text, categories, category };
  } catch {
    return null;
  }
}

export async function fetchCitationPreview(ref: string): Promise<TextExcerpt | null> {
  const queryRef = ref.trim();
  if (!queryRef) return null;
  return fetchTextExcerpt(queryRef);
}

// Fetch the first "about" ref for a topic
async function fetchTopicFirstRef(slug: string): Promise<string | null> {
  try {
    const url = Platform.OS === 'web'
      ? `/api/sefaria-topic?slug=${encodeURIComponent(slug)}`
      : `${SEFARIA_TOPIC_API_URL}/${encodeURIComponent(slug)}?with_refs=1`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const payload = await response.json();
    const firstRef = payload?.refs?.about?.refs?.[0]?.ref;
    return typeof firstRef === 'string' ? firstRef : null;
  } catch (error) {
    return null;
  }
}

// Fetch an excerpt for a topic by getting its first ref and then the text
export async function fetchTopicExcerpt(slug: string): Promise<TextExcerpt | null> {
  const ref = await fetchTopicFirstRef(slug);
  if (!ref) return null;

  return fetchTextExcerpt(ref);
}
