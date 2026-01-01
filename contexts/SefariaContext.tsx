import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  SefariaIndex,
  SefariaTopics,
  SefariaData,
  loadAllSefariaData,
  checkForAllUpdates,
  clearAllCache,
  getDataInfo,
} from '@/services/sefariaData';

type DataSource = 'local' | 'bundled';

interface DataSourceInfo {
  index: DataSource | null;
  topics: DataSource | null;
}

interface SefariaContextType {
  /** The Sefaria library index data */
  index: SefariaIndex | null;
  /** The Sefaria topics data */
  topics: SefariaTopics | null;
  /** Whether initial data is still loading */
  isLoading: boolean;
  /** Whether a background update check is in progress */
  isCheckingForUpdates: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Source of the current data (per data type) */
  dataSources: DataSourceInfo;
  /** Manually trigger an update check */
  refreshData: () => Promise<void>;
  /** Clear cached data and reload bundled version */
  resetToBundle: () => Promise<void>;
}

const SefariaContext = createContext<SefariaContextType | undefined>(undefined);

interface SefariaProviderProps {
  children: ReactNode;
}

export function SefariaProvider({ children }: SefariaProviderProps) {
  const [index, setIndex] = useState<SefariaIndex | null>(null);
  const [topics, setTopics] = useState<SefariaTopics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceInfo>({
    index: null,
    topics: null,
  });

  // Initial data load
  useEffect(() => {
    let isMounted = true;

    async function initializeData() {
      try {
        // Load all data immediately (from local storage or bundled)
        const loadedData = await loadAllSefariaData();

        if (!isMounted) return;

        setIndex(loadedData.index);
        setTopics(loadedData.topics);
        setIsLoading(false);

        // Determine data sources
        const info = await getDataInfo();
        if (isMounted) {
          setDataSources({
            index: info.index.source,
            topics: info.topics.source,
          });
        }

        // Check for updates in the background (non-blocking)
        setIsCheckingForUpdates(true);
        checkForAllUpdates(
          loadedData,
          (newIndex) => {
            if (isMounted) {
              setIndex(newIndex);
              setDataSources((prev) => ({ ...prev, index: 'local' }));
              console.log('Index data updated from background check');
            }
          },
          (newTopics) => {
            if (isMounted) {
              setTopics(newTopics);
              setDataSources((prev) => ({ ...prev, topics: 'local' }));
              console.log('Topics data updated from background check');
            }
          }
        ).finally(() => {
          if (isMounted) {
            setIsCheckingForUpdates(false);
          }
        });
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
          setIsLoading(false);
        }
      }
    }

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh function
  const refreshData = useCallback(async () => {
    if (!index || !topics || isCheckingForUpdates) return;

    setIsCheckingForUpdates(true);
    try {
      await checkForAllUpdates(
        { index, topics },
        (newIndex) => {
          setIndex(newIndex);
          setDataSources((prev) => ({ ...prev, index: 'local' }));
        },
        (newTopics) => {
          setTopics(newTopics);
          setDataSources((prev) => ({ ...prev, topics: 'local' }));
        }
      );
    } finally {
      setIsCheckingForUpdates(false);
    }
  }, [index, topics, isCheckingForUpdates]);

  // Reset to bundled data
  const resetToBundle = useCallback(async () => {
    setIsLoading(true);
    try {
      await clearAllCache();
      const bundledData = await loadAllSefariaData();
      setIndex(bundledData.index);
      setTopics(bundledData.topics);
      setDataSources({ index: 'bundled', topics: 'bundled' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: SefariaContextType = {
    index,
    topics,
    isLoading,
    isCheckingForUpdates,
    error,
    dataSources,
    refreshData,
    resetToBundle,
  };

  return (
    <SefariaContext.Provider value={value}>
      {children}
    </SefariaContext.Provider>
  );
}

/**
 * Hook to access Sefaria data and loading state
 */
export function useSefaria(): SefariaContextType {
  const context = useContext(SefariaContext);
  if (context === undefined) {
    throw new Error('useSefaria must be used within a SefariaProvider');
  }
  return context;
}

/**
 * Hook to access just the Sefaria index (throws if not loaded)
 */
export function useSefariaIndex(): SefariaIndex {
  const { index, isLoading, error } = useSefaria();

  if (isLoading) {
    throw new Error('Sefaria data is still loading');
  }

  if (error) {
    throw new Error(`Failed to load Sefaria data: ${error}`);
  }

  if (!index) {
    throw new Error('Sefaria index is not available');
  }

  return index;
}

/**
 * Hook to access just the Sefaria topics (throws if not loaded)
 */
export function useSefariaTopics(): SefariaTopics {
  const { topics, isLoading, error } = useSefaria();

  if (isLoading) {
    throw new Error('Sefaria data is still loading');
  }

  if (error) {
    throw new Error(`Failed to load Sefaria data: ${error}`);
  }

  if (!topics) {
    throw new Error('Sefaria topics are not available');
  }

  return topics;
}
