import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { updateProfile } from '@/lib/firestore';
import {
  DEFAULT_FEED_PREFERENCES,
  FeedPreferences,
  loadLocalFeedPreferences,
  normalizeFeedPreferences,
  saveLocalFeedPreferences,
} from '@/lib/preferences';

export function useFeedPreferences() {
  const { user, isAuthenticated } = useAuth();
  const { profile } = useProfile(user?.uid);
  const [preferences, setPreferences] = useState<FeedPreferences>(DEFAULT_FEED_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (isAuthenticated && profile) {
      setPreferences(normalizeFeedPreferences(profile.feedPreferences));
      setLoading(false);
      return () => {
        active = false;
      };
    }

    if (!isAuthenticated) {
      loadLocalFeedPreferences()
        .then((prefs) => {
          if (!active) return;
          setPreferences(prefs);
          setLoading(false);
        })
        .catch(() => {
          if (!active) return;
          setError('Failed to load preferences.');
          setPreferences(DEFAULT_FEED_PREFERENCES);
          setLoading(false);
        });
      return () => {
        active = false;
      };
    }

    setLoading(true);
    return () => {
      active = false;
    };
  }, [isAuthenticated, profile]);

  const updatePreferences = useCallback(async (next: FeedPreferences) => {
    setPreferences(next);
    setError(null);
    if (isAuthenticated && user && profile) {
      await updateProfile(user.uid, { feedPreferences: next });
      return;
    }
    await saveLocalFeedPreferences(next);
  }, [isAuthenticated, user, profile]);

  const setPreference = useCallback(
    async (key: keyof FeedPreferences, value: boolean) => {
      const next = { ...preferences, [key]: value };
      await updatePreferences(next);
    },
    [preferences, updatePreferences]
  );

  return { preferences, setPreference, updatePreferences, loading, error };
}
