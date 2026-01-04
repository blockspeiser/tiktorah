import { useEffect, useState } from 'react';
import { MemeDoc, subscribeToMemesFeed } from '@/lib/firestore';

const log = (...args: unknown[]) => console.log('[useMemesFeed]', ...args);

export interface MemeItem {
  id: string;
  data: MemeDoc;
}

export function useMemesFeed() {
  const [memes, setMemes] = useState<MemeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log('subscribing to memes feed');
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToMemesFeed(
      (docs) => {
        log('received memes:', docs.length, docs.map(d => d.id));
        setMemes(docs);
        setLoading(false);
      },
      (err) => {
        log('error loading memes:', err?.message);
        setMemes([]);
        setLoading(false);
        setError(err?.message ?? 'Failed to load memes.');
      }
    );

    return () => {
      log('unsubscribing from memes feed');
      unsubscribe();
    };
  }, []);

  return { memes, loading, error };
}
