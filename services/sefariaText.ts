import { Platform } from 'react-native';

const SEFARIA_TEXT_API_URL = 'https://www.sefaria.org/api/texts';
const SEFARIA_TOPIC_API_URL = 'https://www.sefaria.org/api/v2/topics';

export interface TextExcerpt {
  ref: string;
  text: string;
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

export async function fetchTextExcerpt(title: string): Promise<TextExcerpt | null> {
  try {
    const queryRef = title.trim();
    const url = Platform.OS === 'web'
      ? `/api/sefaria-text?ref=${encodeURIComponent(queryRef)}`
      : `${SEFARIA_TEXT_API_URL}/${encodeURIComponent(queryRef)}?context=0`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const payload = await response.json();
    const ref = extractRef(payload) ?? title;
    const text = findFirstText(payload.text) ?? findFirstText(payload.he);

    if (!text) return null;

    return { ref, text };
  } catch (error) {
    return null;
  }
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
