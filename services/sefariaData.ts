import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Bundled data - imported at build time
import bundledIndex from '@/data/sefaria-index.json';
import bundledTopics from '@/data/sefaria-topics.json';

// API endpoints
const SEFARIA_INDEX_API_URL = 'https://www.sefaria.org/api/index';
const SEFARIA_TOPICS_API_URL = 'https://www.sefaria.org/api/topics';

// Storage keys
const INDEX_HASH_KEY = 'sefaria_index_hash';
const TOPICS_HASH_KEY = 'sefaria_topics_hash';
const INDEX_DATA_KEY = 'sefaria_index_data';
const TOPICS_DATA_KEY = 'sefaria_topics_data';

// File names for native storage
const INDEX_FILE_NAME = 'sefaria-index.json';
const TOPICS_FILE_NAME = 'sefaria-topics.json';

// Types for Index data
export type SefariaCategory = {
  contents?: SefariaCategory[];
  categories?: string[];
  order?: number;
  primary_category?: string;
  enShortDesc?: string;
  heShortDesc?: string;
  corpus?: string;
  heTitle?: string;
  title?: string;
  category?: string;
  heCategory?: string;
  enDesc?: string;
  heDesc?: string;
  dependence?: string;
  base_text_titles?: string[];
};

export type SefariaIndex = SefariaCategory[];

// Types for Topics data
export type SefariaTopicTitle = {
  text: string;
  lang: 'en' | 'he';
  primary?: boolean;
  transliteration?: boolean;
};

export type SefariaTopicProperty = {
  value: string;
  dataSource?: string;
  data_source?: string;
};

export type SefariaTopicImage = {
  image_uri?: string;
  image_caption?: {
    en?: string;
    he?: string;
  };
};

export type SefariaTopic = {
  slug: string;
  titles: SefariaTopicTitle[];
  description?: {
    en?: string;
    he?: string;
  };
  categoryDescription?: {
    en?: string;
    he?: string;
  };
  isTopLevelDisplay?: boolean;
  displayOrder?: number;
  numSources?: number;
  subTopics?: SefariaTopic[];
  refs?: string[];
  subclass?: string;
  alt_ids?: {
    wikidata?: string;
    _temp_id?: string;
    _temp_toc_id?: string;
    _old_slug?: string;
    'old-person-key'?: string;
  };
  properties?: {
    generation?: SefariaTopicProperty;
    sex?: SefariaTopicProperty;
    enWikiLink?: SefariaTopicProperty;
    heWikiLink?: SefariaTopicProperty;
    jeLink?: SefariaTopicProperty;
    era?: SefariaTopicProperty;
  };
  parasha?: string;
  ref?: string;
  image?: SefariaTopicImage;
};

export type SefariaTopics = SefariaTopic[];

// Generic data configuration
type DataConfig<T> = {
  apiUrl: string;
  hashKey: string;
  dataKey: string;
  fileName: string;
  bundledData: T;
};

const indexConfig: DataConfig<SefariaIndex> = {
  apiUrl: SEFARIA_INDEX_API_URL,
  hashKey: INDEX_HASH_KEY,
  dataKey: INDEX_DATA_KEY,
  fileName: INDEX_FILE_NAME,
  bundledData: bundledIndex as SefariaIndex,
};

const topicsConfig: DataConfig<SefariaTopics> = {
  apiUrl: SEFARIA_TOPICS_API_URL,
  hashKey: TOPICS_HASH_KEY,
  dataKey: TOPICS_DATA_KEY,
  fileName: TOPICS_FILE_NAME,
  bundledData: bundledTopics as SefariaTopics,
};

let webStorageDisabled = false;

function isMobileSafari(): boolean {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua);
}

function isWebSecureContext(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return Boolean(window.isSecureContext);
}

function simpleHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return `simple-${(hash >>> 0).toString(16)}`;
}

/**
 * Get the local file path for storing data
 */
function getLocalFilePath(fileName: string): string {
  if (Platform.OS === 'web') {
    return '';
  }
  return `${FileSystem.documentDirectory}${fileName}`;
}

/**
 * Generate a SHA256 hash of the data for comparison
 */
async function generateHash<T>(data: T): Promise<string> {
  try {
    const jsonString = JSON.stringify(data);
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      jsonString
    );
    return hash;
  } catch (error) {
    // Fallback for browsers where crypto fails (e.g., some Safari versions)
    console.warn('Crypto hash failed, using simple fallback:', error);
    const jsonString = JSON.stringify(data);
    return simpleHash(jsonString);
  }
}

/**
 * Get the stored hash for a data type
 */
async function getStoredHash(hashKey: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(hashKey);
  } catch {
    return null;
  }
}

/**
 * Store the hash for a data type
 */
async function storeHash(hashKey: string, hash: string): Promise<void> {
  try {
    await AsyncStorage.setItem(hashKey, hash);
  } catch (error) {
    console.warn('Failed to store hash:', error);
  }
}

/**
 * Load data from local storage
 */
async function loadFromLocalStorage<T>(config: DataConfig<T>): Promise<T | null> {
  try {
    if (Platform.OS === 'web') {
      if (webStorageDisabled) return null;
      console.log(`Loading ${config.fileName} from web storage...`);
      // Check if localStorage is available (Safari private mode blocks it)
      try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
      } catch {
        console.warn('localStorage not available (possibly private browsing mode)');
        return null;
      }

      const data = await AsyncStorage.getItem(config.dataKey);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    }

    const filePath = getLocalFilePath(config.fileName);
    const fileInfo = await FileSystem.getInfoAsync(filePath);

    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(filePath);
      return JSON.parse(content);
    }
    return null;
  } catch (error) {
    console.warn(`Failed to load ${config.fileName} from local storage:`, error);
    return null;
  }
}

/**
 * Save data to local storage
 */
async function saveToLocalStorage<T>(config: DataConfig<T>, data: T): Promise<void> {
  try {
    const jsonString = JSON.stringify(data);

    if (Platform.OS === 'web') {
      if (webStorageDisabled) return;
      console.log(`Saving ${config.fileName} to web storage...`);
      // Check if localStorage is available before trying to save
      try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
      } catch {
        console.warn('localStorage not available, skipping save');
        return;
      }
      await AsyncStorage.setItem(config.dataKey, jsonString);
    } else {
      const filePath = getLocalFilePath(config.fileName);
      await FileSystem.writeAsStringAsync(filePath, jsonString);
    }
  } catch (error) {
    if (Platform.OS === 'web' && String(error).toLowerCase().includes('quota')) {
      webStorageDisabled = true;
      console.warn(`Web storage disabled after quota error saving ${config.fileName}`);
      return;
    }
    console.warn(`Failed to save ${config.fileName} to local storage:`, error);
  }
}

/**
 * Fetch fresh data from the API
 */
async function fetchFromApi<T>(apiUrl: string): Promise<T | null> {
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.warn(`Failed to fetch from ${apiUrl}:`, error);
    return null;
  }
}

/**
 * Load data (from local storage or bundled)
 */
async function loadData<T>(config: DataConfig<T>): Promise<T> {
  const localData = await loadFromLocalStorage(config);

  if (localData) {
    console.log(`Loaded ${config.fileName} from local storage`);
    return localData;
  }

  console.log(`Using bundled ${config.fileName}`);
  return config.bundledData;
}

/**
 * Check for updates and save if changed
 */
async function checkForDataUpdates<T>(
  config: DataConfig<T>,
  currentData: T,
  onUpdateFound?: (newData: T) => void
): Promise<boolean> {
  try {
    console.log(`Checking for ${config.fileName} updates...`);

    if (Platform.OS === 'web') {
      if (!isWebSecureContext()) {
        console.log(`Skipping ${config.fileName} updates on insecure context`);
        return false;
      }
      if (isMobileSafari()) {
        console.log(`Skipping ${config.fileName} updates on Mobile Safari`);
        return false;
      }
      if (webStorageDisabled) {
        console.log(`Skipping ${config.fileName} updates (web storage disabled)`);
        return false;
      }
    }

    const freshData = await fetchFromApi<T>(config.apiUrl);

    if (!freshData) {
      console.log(`Could not fetch ${config.fileName}, skipping update check`);
      return false;
    }

    const currentHash = await generateHash(currentData);
    const freshHash = await generateHash(freshData);

    if (currentHash === freshHash) {
      console.log(`${config.fileName} is up to date`);
      await storeHash(config.hashKey, currentHash);
      return false;
    }

    console.log(`New ${config.fileName} data found, saving...`);
    await saveToLocalStorage(config, freshData);
    await storeHash(config.hashKey, freshHash);

    if (onUpdateFound) {
      onUpdateFound(freshData);
    }

    console.log(`${config.fileName} updated successfully`);
    return true;
  } catch (error) {
    console.warn(`Error checking for ${config.fileName} updates:`, error);
    return false;
  }
}

/**
 * Clear cached data for a specific type
 */
async function clearDataCache<T>(config: DataConfig<T>): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(config.dataKey);
    } else {
      const filePath = getLocalFilePath(config.fileName);
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    }
    await AsyncStorage.removeItem(config.hashKey);
  } catch (error) {
    console.warn(`Failed to clear ${config.fileName} cache:`, error);
  }
}

// ============================================
// Public API for Index data
// ============================================

export async function loadSefariaIndex(): Promise<SefariaIndex> {
  return loadData(indexConfig);
}

export async function checkForIndexUpdates(
  currentData: SefariaIndex,
  onUpdateFound?: (newData: SefariaIndex) => void
): Promise<boolean> {
  return checkForDataUpdates(indexConfig, currentData, onUpdateFound);
}

export async function clearIndexCache(): Promise<void> {
  return clearDataCache(indexConfig);
}

// ============================================
// Public API for Topics data
// ============================================

export async function loadSefariaTopics(): Promise<SefariaTopics> {
  return loadData(topicsConfig);
}

export async function checkForTopicsUpdates(
  currentData: SefariaTopics,
  onUpdateFound?: (newData: SefariaTopics) => void
): Promise<boolean> {
  return checkForDataUpdates(topicsConfig, currentData, onUpdateFound);
}

export async function clearTopicsCache(): Promise<void> {
  return clearDataCache(topicsConfig);
}

// ============================================
// Combined operations
// ============================================

export type SefariaData = {
  index: SefariaIndex;
  topics: SefariaTopics;
};

/**
 * Load both index and topics data
 */
export async function loadAllSefariaData(): Promise<SefariaData> {
  const [index, topics] = await Promise.all([
    loadSefariaIndex(),
    loadSefariaTopics(),
  ]);
  return { index, topics };
}

/**
 * Check for updates on both index and topics (in parallel)
 */
export async function checkForAllUpdates(
  currentData: SefariaData,
  onIndexUpdate?: (newData: SefariaIndex) => void,
  onTopicsUpdate?: (newData: SefariaTopics) => void
): Promise<{ indexUpdated: boolean; topicsUpdated: boolean }> {
  const [indexUpdated, topicsUpdated] = await Promise.all([
    checkForIndexUpdates(currentData.index, onIndexUpdate),
    checkForTopicsUpdates(currentData.topics, onTopicsUpdate),
  ]);
  return { indexUpdated, topicsUpdated };
}

/**
 * Clear all cached Sefaria data
 */
export async function clearAllCache(): Promise<void> {
  await Promise.all([clearIndexCache(), clearTopicsCache()]);
  console.log('All Sefaria cache cleared');
}

/**
 * Get info about current data state
 */
export async function getDataInfo(): Promise<{
  index: { source: 'local' | 'bundled'; hash: string | null };
  topics: { source: 'local' | 'bundled'; hash: string | null };
}> {
  const [localIndex, localTopics, indexHash, topicsHash] = await Promise.all([
    loadFromLocalStorage(indexConfig),
    loadFromLocalStorage(topicsConfig),
    getStoredHash(INDEX_HASH_KEY),
    getStoredHash(TOPICS_HASH_KEY),
  ]);

  return {
    index: {
      source: localIndex ? 'local' : 'bundled',
      hash: indexHash,
    },
    topics: {
      source: localTopics ? 'local' : 'bundled',
      hash: topicsHash,
    },
  };
}
