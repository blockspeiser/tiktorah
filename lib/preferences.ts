import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type FeedPreferences = {
  texts: boolean;
  categories: boolean;
  commentaries: boolean;
  topics: boolean;
  memes: boolean;
  comments: boolean;
};

export const DEFAULT_FEED_PREFERENCES: FeedPreferences = {
  texts: true,
  categories: true,
  commentaries: true,
  topics: true,
  memes: true,
  comments: true,
};

const STORAGE_KEY = 'tiktorah.feedPreferences';

export function normalizeFeedPreferences(value?: Partial<FeedPreferences> | null): FeedPreferences {
  return {
    texts: value?.texts ?? DEFAULT_FEED_PREFERENCES.texts,
    categories: value?.categories ?? DEFAULT_FEED_PREFERENCES.categories,
    commentaries: value?.commentaries ?? DEFAULT_FEED_PREFERENCES.commentaries,
    topics: value?.topics ?? DEFAULT_FEED_PREFERENCES.topics,
    memes: value?.memes ?? DEFAULT_FEED_PREFERENCES.memes,
    comments: value?.comments ?? DEFAULT_FEED_PREFERENCES.comments,
  };
}

export async function loadLocalFeedPreferences(): Promise<FeedPreferences> {
  try {
    if (Platform.OS === 'web') {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_FEED_PREFERENCES;
      return normalizeFeedPreferences(JSON.parse(raw));
    }
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FEED_PREFERENCES;
    return normalizeFeedPreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_FEED_PREFERENCES;
  }
}

export async function saveLocalFeedPreferences(prefs: FeedPreferences): Promise<void> {
  const payload = JSON.stringify(prefs);
  if (Platform.OS === 'web') {
    window.localStorage.setItem(STORAGE_KEY, payload);
    return;
  }
  await AsyncStorage.setItem(STORAGE_KEY, payload);
}
