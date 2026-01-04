import { useEffect, useState } from 'react';
import { CommentDoc, subscribeToMyComments } from '@/lib/firestore';

export interface CommentItem {
  id: string;
  data: CommentDoc;
}

export function useMyComments(uid?: string) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(Boolean(uid));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setComments([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToMyComments(
      uid,
      (docs) => {
        setComments(docs);
        setLoading(false);
      },
      (err) => {
        setComments([]);
        setLoading(false);
        setError(err?.message ?? 'Failed to load comments.');
      }
    );

    return unsubscribe;
  }, [uid]);

  return { comments, loading, error };
}
