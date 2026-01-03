import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform, useWindowDimensions } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { createProfile, updateProfile } from '@/lib/firestore';
import { DEFAULT_FEED_PREFERENCES } from '@/lib/preferences';
import { useProfile } from '@/hooks/useProfile';
import { colors } from '@/constants/colors';
import { MobileNav, useMobileNavHeight } from '@/components/MobileNav';
import { DesktopHeader } from '@/components/DesktopHeader';

export const options = {
  title: 'Edit Profile',
};

function isValidUrl(value: string) {
  if (!value) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && screenWidth < 720;
  const isMobileView = !isWeb || isCompactWeb;
  const { user, loading: authLoading, isAuthenticated, signInWithGoogle } = useAuth();
  const { profile, exists: profileExists, loading: profileLoading, error: profileLoadError } = useProfile(user?.uid);

  const [displayName, setDisplayName] = useState('');
  const [profileLink, setProfileLink] = useState('');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const userPhoto = user?.photoURL ?? null;
  const userEmail = user?.email ?? null;
  const inputTheme = useMemo(() => ({ roundness: 12 }), []);
  const mobileNavHeight = useMobileNavHeight();

  // Initialize form with existing profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || '');
      setProfileLink(profile.profileLink || '');
    } else if (user) {
      setDisplayName(user.displayName ?? '');
      setProfileLink('');
    }
  }, [profile, user]);

  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError('Unable to sign in. Please try again.');
    }
  }, [signInWithGoogle]);

  const handleSaveProfile = useCallback(async () => {
    if (!user) return;
    setProfileError(null);

    if (!displayName.trim()) {
      setProfileError('Display Name is required.');
      return;
    }

    const normalizedProfileLink = normalizeUrl(profileLink);
    if (!isValidUrl(normalizedProfileLink)) {
      setProfileError('Profile Link must be a valid URL.');
      return;
    }

    setProfileSaving(true);
    try {
      if (normalizedProfileLink !== profileLink) {
        setProfileLink(normalizedProfileLink);
      }
      if (profileExists) {
        await updateProfile(user.uid, {
          displayName: displayName.trim(),
          googleName: user.displayName || null,
          profileLink: normalizedProfileLink || null,
          photoURL: userPhoto,
          email: userEmail,
        });
      } else {
        await createProfile(user.uid, {
          uid: user.uid,
          displayName: displayName.trim(),
          googleName: user.displayName || null,
          profileLink: normalizedProfileLink || null,
          photoURL: userPhoto,
          email: userEmail,
          feedPreferences: DEFAULT_FEED_PREFERENCES,
        });
      }
      // Navigate back to upload page after saving
      router.replace('/upload');
    } catch (error) {
      setProfileError('Unable to save profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  }, [user, displayName, profileLink, userPhoto, userEmail, profileExists, router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  const isReady = !authLoading && !profileLoading;

  return (
    <View style={[styles.screen, isMobileView && styles.screenMobile]}>
      <DesktopHeader />
      <ScrollView contentContainerStyle={[styles.container, isMobileView && styles.containerMobile, { paddingBottom: mobileNavHeight }]}>
      <View style={styles.content}>
        <Text style={[styles.pageTitle, styles.maxWidth]}>
          {profileExists ? 'Edit Profile' : 'Create Profile'}
        </Text>
        <View style={[styles.card, styles.maxWidth, isMobileView && styles.cardMobile]}>
          {!isReady && (
            <View style={styles.center}>
              <ActivityIndicator />
            </View>
          )}

          {isReady && profileLoadError && (
            <Text style={styles.error}>{profileLoadError}</Text>
          )}

          {isReady && !isAuthenticated && (
            <View style={styles.section}>
              <Text style={styles.body}>Sign in to manage your profile.</Text>
              {authError && <Text style={styles.error}>{authError}</Text>}
              <Pressable style={styles.googleButton} onPress={handleSignIn}>
                <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </Pressable>
            </View>
          )}

          {isReady && isAuthenticated && (
            <View style={styles.section}>
              <Text style={styles.body}>
                {profileExists ? 'Update your profile details.' : 'Welcome! Let\'s set up your profile.'}
              </Text>
              <TextInput
                label="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
              />
              <TextInput
                label="Profile Link"
                value={profileLink}
                onChangeText={setProfileLink}
                mode="outlined"
                style={styles.input}
                theme={inputTheme}
              />
              <Text style={styles.helperText}>e.g., your instagram, twitter, or personal website.</Text>
              {profileError && <Text style={styles.error}>{profileError}</Text>}
              <View style={styles.buttonRow}>
                {profileExists && (
                  <Button
                    mode="outlined"
                    onPress={handleCancel}
                    style={styles.button}
                    textColor={colors.gray[700]}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  mode="contained"
                  onPress={handleSaveProfile}
                  loading={profileSaving}
                  disabled={profileSaving}
                  style={styles.button}
                  buttonColor={colors.hotPink}
                >
                  Save Profile
                </Button>
              </View>
            </View>
          )}
        </View>
      </View>
      </ScrollView>
      <MobileNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: colors.hotPinkLight,
    minHeight: '100%',
    alignItems: 'center',
  },
  containerMobile: {
    backgroundColor: colors.white,
  },
  screen: {
    flex: 1,
  },
  screenMobile: {
    backgroundColor: colors.white,
  },
  maxWidth: {
    width: '100%',
    maxWidth: 760,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 20,
    width: '100%',
  },
  cardMobile: {
    borderWidth: 0,
    borderRadius: 0,
    padding: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray[900],
    marginTop: 48,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    color: colors.gray[700],
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.white,
    marginBottom: 12,
    borderRadius: 12,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  error: {
    color: colors.hotPink,
    marginBottom: 12,
  },
  helperText: {
    color: colors.gray[600],
    fontSize: 13,
    marginTop: -6,
    marginBottom: 6,
  },
  section: {
    gap: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    alignSelf: 'center',
  },
  googleButtonText: {
    color: colors.gray[900],
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    borderRadius: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
});
