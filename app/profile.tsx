import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform, Pressable, useWindowDimensions, Linking } from 'react-native';
import { ActivityIndicator, Avatar, Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useMyMemes } from '@/hooks/useMyMemes';
import { useMyComments } from '@/hooks/useMyComments';
import { getMemeDownloadUrl } from '@/lib/storage';
import { CommentCardView, MemeCardView } from '@/components/cards';
import { colors } from '@/constants/colors';
import { MobileNav, useMobileNavHeight } from '@/components/MobileNav';
import { DesktopHeader } from '@/components/DesktopHeader';

export const options = {
  title: 'Profile',
};

function getTimestampMs(value: unknown) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  const record = value as { toMillis?: () => number; seconds?: number };
  if (record?.toMillis) return record.toMillis();
  if (typeof record?.seconds === 'number') return record.seconds * 1000;
  return 0;
}

function formatTimestamp(value: unknown) {
  const ms = getTimestampMs(value);
  if (!ms) return '';
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ProfileScreen() {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && screenWidth < 720;
  const isMobileView = !isWeb || isCompactWeb;
  const { user, loading: authLoading, isAuthenticated, signInWithGoogle } = useAuth();
  const { profile, exists: profileExists, loading: profileLoading, error: profileLoadError } = useProfile(user?.uid);
  const { memes, loading: memesLoading, error: memesError } = useMyMemes(profileExists ? user?.uid : undefined);
  const { comments, loading: commentsLoading, error: commentsError } = useMyComments(profileExists ? user?.uid : undefined);

  const [authError, setAuthError] = useState<string | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});

  const mobileNavHeight = useMobileNavHeight();

  const loadDownloadUrls = useCallback(async () => {
    const entries = await Promise.all(
      memes.map(async (meme) => {
        const url = await getMemeDownloadUrl(meme.data.storagePath);
        return [meme.id, url] as const;
      })
    );
    setDownloadUrls(Object.fromEntries(entries));
  }, [memes]);

  useEffect(() => {
    if (memes.length === 0) {
      setDownloadUrls({});
      return;
    }
    loadDownloadUrls();
  }, [memes, loadDownloadUrls]);

  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch {
      setAuthError('Unable to sign in. Please try again.');
    }
  }, [signInWithGoogle]);

  const handleOpenProfileLink = useCallback(() => {
    const link = profile?.profileLink;
    if (!link) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(link);
    }
  }, [profile?.profileLink]);

  const isReady = !authLoading && !profileLoading;
  const showLogin = isReady && !isAuthenticated;
  const showProfile = isAuthenticated && profileExists;
  const displayName = profile?.displayName || user?.displayName || 'User';
  const userPhoto = profile?.photoURL || user?.photoURL || null;
  const userEmail = profile?.email || user?.email || null;
  const profileLink = profile?.profileLink || null;
  const activityCardHeight = isMobileView
    ? screenHeight - mobileNavHeight
    : Math.min(screenHeight - 180, 700);
  const activityItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      type: 'meme' | 'comment';
      sortTime: number;
      memeId?: string;
      commentId?: string;
      data: any;
    }> = [];

    memes.forEach((meme) => {
      items.push({
        id: `meme-${meme.id}`,
        type: 'meme',
        sortTime: getTimestampMs(meme.data.createdAt) || getTimestampMs(meme.data.modifiedAt),
        memeId: meme.id,
        data: meme,
      });
    });

    comments.forEach((comment) => {
      items.push({
        id: `comment-${comment.id}`,
        type: 'comment',
        sortTime: getTimestampMs(comment.data.createdAt) || getTimestampMs(comment.data.modifiedAt),
        commentId: comment.id,
        data: comment,
      });
    });

    return items.sort((a, b) => b.sortTime - a.sortTime);
  }, [memes, comments]);

  return (
    <View style={[styles.screen, isMobileView && styles.screenMobile]}>
      <DesktopHeader />
      <ScrollView contentContainerStyle={[styles.container, isMobileView && styles.containerMobile, { paddingBottom: mobileNavHeight }]}>
        <View style={styles.content}>
          <Text style={[styles.pageTitle, styles.maxWidth, showLogin && styles.pageTitleCentered]}>
            {showLogin ? 'Sign In' : 'My Profile'}
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

            {showLogin && (
              <View style={[styles.section, styles.sectionCentered]}>
                <Text style={[styles.body, styles.centerText]}>Sign in to view your profile.</Text>
                {authError && <Text style={styles.error}>{authError}</Text>}
                <Pressable style={styles.googleButton} onPress={handleSignIn}>
                  <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </Pressable>
              </View>
            )}

            {isReady && isAuthenticated && !profileExists && (
              <View style={[styles.section, styles.sectionCentered]}>
                <Text style={[styles.body, styles.centerText]}>You haven&apos;t set up your profile yet.</Text>
                <Button
                  mode="contained"
                  onPress={() => router.push('/edit-profile')}
                  buttonColor={colors.hotPink}
                >
                  Create Profile
                </Button>
              </View>
            )}

            {showProfile && (
              <View style={styles.profileSection}>
                <View style={styles.profileHeader}>
                  <View style={styles.profileHeaderLeft}>
                    {userPhoto ? (
                      <Avatar.Image size={80} source={{ uri: userPhoto }} />
                    ) : (
                      <Avatar.Text size={80} label={(displayName[0] || 'U').toUpperCase()} />
                    )}
                    <View style={styles.profileInfo}>
                      <Text style={styles.profileName}>{displayName}</Text>
                      {userEmail && <Text style={styles.profileEmail}>{userEmail}</Text>}
                      {profileLink && (
                        <Pressable onPress={handleOpenProfileLink}>
                          <Text style={styles.profileLinkText}>{profileLink}</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                  <Button
                    mode="outlined"
                    onPress={() => router.push('/edit-profile')}
                    style={styles.editButton}
                    textColor={colors.gray[700]}
                    icon="account-edit"
                  >
                    Edit Profile
                  </Button>
                </View>
              </View>
            )}
          </View>

          {showProfile && (
            <>
              <Text style={[styles.pageTitle, styles.maxWidth]}>My Activity</Text>
              <View style={[styles.maxWidth, isMobileView && styles.cardMobile]}>
                {memesError && <Text style={styles.error}>{memesError}</Text>}
                {commentsError && <Text style={styles.error}>{commentsError}</Text>}
                {(memesLoading || commentsLoading) && (
                  <View style={styles.center}>
                    <ActivityIndicator />
                  </View>
                )}
                {!memesLoading && !commentsLoading && activityItems.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.body}>No activity yet.</Text>
                    <Button
                      mode="contained"
                      onPress={() => router.push('/upload')}
                      buttonColor={colors.hotPink}
                      icon="upload"
                    >
                      Upload Your First Meme
                    </Button>
                  </View>
                )}
                <View style={styles.activityList}>
                  {activityItems.map((item) => {
                    if (item.type === 'meme' && item.memeId) {
                      const meme = item.data;
                      const createdLabel = formatTimestamp(meme.data.createdAt || meme.data.modifiedAt);
                      const ownerDisplayName = profile?.displayName || user?.displayName || user?.email || 'You';
                      const ownerProfileLink = profile?.profileLink || null;
                      const ownerPhotoURL = profile?.photoURL || user?.photoURL || null;
                      const memeCard = {
                        id: item.memeId,
                        type: 'meme' as const,
                        title: meme.data.caption || 'Meme',
                        description: '',
                        imageUrl: downloadUrls[item.memeId] ?? '',
                        caption: meme.data.caption,
                        citation: meme.data.citation,
                        citationText: meme.data.citationText ?? null,
                        citationCategory: meme.data.citationCategory ?? null,
                        memeLink: meme.data.memeLink ?? null,
                        ownerDisplayName,
                        ownerProfileLink,
                        ownerPhotoURL,
                      };
                      return (
                        <Pressable
                          key={item.id}
                          style={styles.activityItem}
                          onPress={() => router.push(`/meme/${item.memeId}`)}
                        >
                          <View style={[styles.cardSurface, { height: activityCardHeight }]}>
                            <MemeCardView card={memeCard} cardHeight={activityCardHeight} />
                          </View>
                          {createdLabel ? <Text style={styles.activityDate}>{createdLabel}</Text> : null}
                        </Pressable>
                      );
                    }

                    if (item.type === 'comment') {
                      const comment = item.data;
                      const createdLabel = formatTimestamp(comment.data.createdAt || comment.data.modifiedAt);
                      const ownerDisplayName = profile?.displayName || user?.displayName || user?.email || 'You';
                      const ownerProfileLink = profile?.profileLink || null;
                      const ownerPhotoURL = profile?.photoURL || user?.photoURL || null;
                      const commentCard = {
                        id: item.commentId ?? item.id,
                        type: 'comment' as const,
                        title: 'Comment',
                        description: '',
                        textBefore: comment.data.textBefore,
                        textAfter: comment.data.textAfter,
                        citation: comment.data.citation,
                        citationText: comment.data.citationText,
                        citationCategory: comment.data.citationCategory ?? null,
                        ownerDisplayName,
                        ownerProfileLink,
                        ownerPhotoURL,
                      };
                      return (
                        <Pressable
                          key={item.id}
                          style={styles.activityItem}
                          onPress={() => router.push(`/c/${item.commentId}`)}
                        >
                          <View style={[styles.cardSurface, { height: activityCardHeight }]}>
                            <CommentCardView card={commentCard} cardHeight={activityCardHeight} />
                          </View>
                          {createdLabel ? <Text style={styles.activityDate}>{createdLabel}</Text> : null}
                        </Pressable>
                      );
                    }

                    return null;
                  })}
                </View>
              </View>
            </>
          )}
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
  pageTitleCentered: {
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: colors.gray[700],
    marginBottom: 16,
  },
  center: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  error: {
    color: colors.hotPink,
    marginBottom: 12,
  },
  section: {
    gap: 12,
  },
  sectionCentered: {
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
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
  profileSection: {
    gap: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  profileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    flex: 1,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray[900],
  },
  profileEmail: {
    fontSize: 14,
    color: colors.gray[600],
  },
  profileLinkText: {
    fontSize: 14,
    color: colors['sefaria-blue'],
  },
  editButton: {
    borderRadius: 12,
    borderColor: colors.gray[300],
  },
  emptyState: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  activityList: {
    width: '100%',
    gap: 20,
  },
  activityItem: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  cardSurface: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: 'hidden',
  },
  activityDate: {
    marginTop: 10,
    fontSize: 13,
    color: colors.gray[500],
  },
});
