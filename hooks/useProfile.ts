import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProfileDoc } from '@/lib/firestore';

export function useProfile(uid?: string) {
  const [profile, setProfile] = useState<ProfileDoc | null>(null);
  const [loading, setLoading] = useState(Boolean(uid));
  const [exists, setExists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!uid) {
      setProfile(null);
      setExists(false);
      setLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    const ref = doc(db, 'profiles', uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!active) return;
        if (snap.exists()) {
          setProfile(snap.data() as ProfileDoc);
          setExists(true);
        } else {
          setProfile(null);
          setExists(false);
        }
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setProfile(null);
        setExists(false);
        setLoading(false);
        setError(err?.message ?? 'Failed to load profile.');
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [uid]);

  return { profile, exists, loading, error };
}
