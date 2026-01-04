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

// Minimum character count for a text block (roughly 3 lines at ~50 chars per line)
const MIN_EXCERPT_CHARS = 120;
// Maximum segments to combine
const MAX_SEGMENTS = 5;
// Segment separator marker (will be styled differently in TextBlock)
export const SEGMENT_MARKER_PREFIX = '\u200B\u2022'; // Zero-width space + bullet as marker

export function sanitizeText(value: string): string {
  return value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function stripHtml(value: string): string {
  return sanitizeText(value);
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

/**
 * Collect text segments from a Sefaria text response.
 * Returns an array of { index, text } where index is the 1-based segment number.
 */
function collectTextSegments(
  value: unknown,
  startIndex = 1
): Array<{ index: number; text: string }> {
  const segments: Array<{ index: number; text: string }> = [];

  if (typeof value === 'string') {
    const cleaned = stripHtml(value);
    if (cleaned.length > 0) {
      segments.push({ index: startIndex, text: cleaned });
    }
    return segments;
  }

  if (Array.isArray(value)) {
    let currentIndex = startIndex;
    for (const entry of value) {
      if (typeof entry === 'string') {
        const cleaned = stripHtml(entry);
        if (cleaned.length > 0) {
          segments.push({ index: currentIndex, text: cleaned });
        }
        currentIndex++;
      } else if (Array.isArray(entry)) {
        // Nested array - recurse but keep collecting at top level
        const nested = collectTextSegments(entry, currentIndex);
        segments.push(...nested);
        if (nested.length > 0) {
          currentIndex = nested[nested.length - 1].index + 1;
        }
      }
    }
  }

  return segments;
}

/**
 * Build a combined text from multiple segments with markers.
 * Returns { text, firstIndex, lastIndex } where text has markers between segments.
 */
function buildCombinedExcerpt(
  segments: Array<{ index: number; text: string }>,
  minChars: number,
  maxSegments: number
): { text: string; firstIndex: number; lastIndex: number } | null {
  if (segments.length === 0) return null;

  const usedSegments: Array<{ index: number; text: string }> = [];
  let totalChars = 0;

  for (const segment of segments) {
    if (usedSegments.length >= maxSegments) break;
    usedSegments.push(segment);
    totalChars += segment.text.length;
    if (totalChars >= minChars) break;
  }

  if (usedSegments.length === 0) return null;

  const firstIndex = usedSegments[0].index;
  const lastIndex = usedSegments[usedSegments.length - 1].index;

  // If only one segment, return without markers
  if (usedSegments.length === 1) {
    return { text: usedSegments[0].text, firstIndex, lastIndex };
  }

  // Combine with segment markers
  const parts = usedSegments.map((seg, i) => {
    if (i === 0) return seg.text;
    // Add marker before subsequent segments: " (2) text..."
    return `${SEGMENT_MARKER_PREFIX}(${seg.index})${SEGMENT_MARKER_PREFIX} ${seg.text}`;
  });

  return { text: parts.join(' '), firstIndex, lastIndex };
}

/**
 * Create a ranged reference from a base ref and segment indices.
 * e.g., "Genesis 1:1" + indices 1,3 -> "Genesis 1:1-3"
 */
function createRangedRef(baseRef: string, firstIndex: number, lastIndex: number): string {
  if (firstIndex === lastIndex) return baseRef;

  // Parse the base ref to understand its structure
  // Common patterns: "Book Chapter:Verse" or "Book Verse" or "Book, Section Chapter:Verse"
  const colonMatch = baseRef.match(/^(.+):(\d+)$/);
  if (colonMatch) {
    // Format: "Something Chapter:Verse" -> "Something Chapter:FirstVerse-LastVerse"
    const [, prefix, verse] = colonMatch;
    const firstVerse = parseInt(verse, 10);
    // Adjust last index relative to the first verse
    const lastVerse = firstVerse + (lastIndex - firstIndex);
    return `${prefix}:${firstVerse}-${lastVerse}`;
  }

  // Format: "Something Number" -> "Something FirstNumber-LastNumber"
  const numberMatch = baseRef.match(/^(.+\s)(\d+)$/);
  if (numberMatch) {
    const [, prefix, num] = numberMatch;
    const firstNum = parseInt(num, 10);
    const lastNum = firstNum + (lastIndex - firstIndex);
    return `${prefix}${firstNum}-${lastNum}`;
  }

  // Can't parse, just append the range
  return `${baseRef}-${lastIndex}`;
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
    const url = Platform.OS === 'web'
      ? `/api/sefaria-index?title=${encodeURIComponent(title)}`
      : `${SEFARIA_INDEX_API_URL}/${encodeURIComponent(title)}`;
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
    console.warn('[SefariaText] Index fetch failed', {
      title,
      platform: Platform.OS,
    });
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

  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.warn('[SefariaText] Fetch failed:', { ref: queryRef, status: response.status, url });
      return { payload: {}, ok: false };
    }

    const payload = await response.json();

    // Check if we got an error about complex book structure
    if (payload.error && typeof payload.error === 'string' && payload.error.includes('complex')) {
      console.log('[SefariaText] Complex book structure:', queryRef);
      return { payload, ok: false };
    }

    return { payload, ok: true };
  } catch (error) {
    console.warn('[SefariaText] Fetch error:', { ref: queryRef, error: error instanceof Error ? error.message : error });
    return { payload: {}, ok: false };
  }
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

    const baseRef = extractRef(payload) ?? title;
    const categories = Array.isArray(payload.categories)
      ? payload.categories.filter((entry: unknown) => typeof entry === 'string')
      : [];
    const category = categories.length > 0 ? categories[0] : null;

    // Try to collect multiple segments to reach minimum length
    const segments = collectTextSegments(payload.text);
    let combined = buildCombinedExcerpt(segments, MIN_EXCERPT_CHARS, MAX_SEGMENTS);

    // If English text didn't work, try Hebrew
    if (!combined) {
      const heSegments = collectTextSegments(payload.he);
      combined = buildCombinedExcerpt(heSegments, MIN_EXCERPT_CHARS, MAX_SEGMENTS);
    }

    // Fallback to single text if segment collection failed
    if (!combined) {
      const text = findFirstText(payload.text) ?? findFirstText(payload.he);
      if (!text) return null;
      return { ref: baseRef, text, categories, category };
    }

    // Create ranged ref if multiple segments were used
    const ref = createRangedRef(baseRef, combined.firstIndex, combined.lastIndex);

    return { ref, text: combined.text, categories, category };
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
    console.warn('[SefariaText] Topic fetch failed', {
      slug,
      platform: Platform.OS,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }
}

// Fetch an excerpt for a topic by getting its first ref and then the text
export async function fetchTopicExcerpt(slug: string): Promise<TextExcerpt | null> {
  const ref = await fetchTopicFirstRef(slug);
  if (!ref) return null;

  return fetchTextExcerpt(ref);
}
