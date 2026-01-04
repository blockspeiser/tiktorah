import { useEffect, useState } from 'react';
import { CommentDoc, subscribeToCommentsFeed } from '@/lib/firestore';

const log = (...args: unknown[]) => console.log('[useCommentsFeed]', ...args);

export interface CommentItem {
  id: string;
  data: CommentDoc;
}

export function useCommentsFeed() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log('subscribing to comments feed');
    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToCommentsFeed(
      (docs) => {
        log('received comments:', docs.length, docs.map(d => d.id));
        setComments(docs);
        setLoading(false);
      },
      (err) => {
        log('error loading comments:', err?.message);
        setComments([]);
        setLoading(false);
        setError(err?.message ?? 'Failed to load comments.');
      }
    );

    return () => {
      log('unsubscribing from comments feed');
      unsubscribe();
    };
  }, []);

  return { comments, loading, error };
}
