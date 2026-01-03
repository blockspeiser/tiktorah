import { useEffect, useState } from 'react';
import { MemeDoc, subscribeToMyMemes } from '@/lib/firestore';

export interface MemeItem {
  id: string;
  data: MemeDoc;
}

export function useMyMemes(uid?: string) {
  const [memes, setMemes] = useState<MemeItem[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setMemes([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToMyMemes(
      uid,
      (docs) => {
        setMemes(docs);
        setLoading(false);
      },
      (err) => {
        setMemes([]);
        setLoading(false);
        setError(err?.message ?? 'Failed to load memes.');
      }
    );

    return unsubscribe;
  }, [uid]);

  return { memes, loading, error };
}
