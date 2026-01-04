import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform, Pressable, useWindowDimensions } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { createComment, updateComment, deleteComment } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { useProfile } from '@/hooks/useProfile';
import { useMyComments } from '@/hooks/useMyComments';
import { colors } from '@/constants/colors';
import { fetchCitationPreview, sanitizeText } from '@/services/sefariaText';
import { MobileNav, useMobileNavHeight } from '@/components/MobileNav';
import { DesktopHeader } from '@/components/DesktopHeader';
import { TextBlock } from '@/components/cards/TextBlock';
import palette from '@/constants/palette';

export const options = {
  title: 'Comment',
};

function parseCitationInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { citation: '', error: null as string | null };
  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      const path = url.pathname.replace(/^\/+/, '');
      if (!path) return { citation: '', error: 'Citation URL is missing a path.' };
      const cleaned = path.replace(/^texts\//, '');
      return { citation: decodeURIComponent(cleaned.replace(/_/g, ' ')), error: null };
    } catch {
      return { citation: '', error: 'Invalid citation URL.' };
    }
  }
  return { citation: trimmed, error: null };
}

interface CommentPreviewProps {
  textBefore: string;
  textAfter: string;
  citation: string;
  citationText: string;
  citationCategory?: string | null;
  onDelete?: () => void;
  onEdit?: () => void;
}

function CommentPreview({ textBefore, textAfter, citation, citationText, citationCategory, onDelete, onEdit }: CommentPreviewProps) {
  const accentColor = citationCategory ? palette.categoryColor(citationCategory) : colors.gray[400];

  return (
    <View style={styles.commentPreview}>
      {textBefore ? <Text style={styles.commentText}>{textBefore}</Text> : null}
      <TextBlock
        reference={citation}
        text={citationText}
        accentColor={accentColor}
        maxLines={4}
      />
      {textAfter ? <Text style={styles.commentText}>{textAfter}</Text> : null}
      {(onDelete || onEdit) && (
        <View style={styles.commentActions}>
          {onEdit && (
            <Pressable style={styles.actionButton} onPress={onEdit}>
              <MaterialCommunityIcons name="pencil" size={18} color={colors.gray[600]} />
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          )}
          {onDelete && (
            <Pressable style={styles.actionButton} onPress={onDelete}>
              <MaterialCommunityIcons name="delete" size={18} color={colors.hotPink} />
              <Text style={[styles.actionText, { color: colors.hotPink }]}>Delete</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

export default function CommentScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && screenWidth < 720;
  const isMobileView = !isWeb || isCompactWeb;
  const { user, loading: authLoading, isAuthenticated, signInWithGoogle } = useAuth();
  const { profile, exists: profileExists, loading: profileLoading, error: profileLoadError } = useProfile(user?.uid);
  const { comments, loading: commentsLoading, error: commentsError } = useMyComments(profileExists ? user?.uid : undefined);

  const [authError, setAuthError] = useState<string | null>(null);
  const [textBefore, setTextBefore] = useState('');
  const [textAfter, setTextAfter] = useState('');
  const [citationInput, setCitationInput] = useState('');
  const [citationPreview, setCitationPreview] = useState<{ ref: string; text: string; category?: string | null } | null>(null);
  const [citationError, setCitationError] = useState<string | null>(null);
  const [citationLoading, setCitationLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingLoading, setEditingLoading] = useState(false);

  const inputTheme = useMemo(() => ({ roundness: 12 }), []);
  const mobileNavHeight = useMobileNavHeight();

  useEffect(() => {
    let active = true;
    const parsed = parseCitationInput(citationInput);
    if (!parsed.citation) {
      setCitationPreview(null);
      setCitationError(parsed.error);
      return;
    }

    setCitationLoading(true);
    const timeout = setTimeout(() => {
      fetchCitationPreview(parsed.citation)
        .then((preview) => {
          if (!active) return;
          if (!preview) {
            setCitationPreview(null);
            setCitationError('Citation not recognized by Sefaria.');
            return;
          }
          setCitationPreview(preview);
          setCitationError(null);
        })
        .finally(() => {
          if (active) setCitationLoading(false);
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [citationInput]);

  useEffect(() => {
    if (!editId) {
      setEditingCommentId(null);
      return;
    }
    if (!user?.uid) return;

    let active = true;
    setEditingLoading(true);
    setSubmitError(null);

    (async () => {
      try {
        const commentRef = doc(db.current, 'comments', editId);
        const commentSnap = await getDoc(commentRef);
        if (!commentSnap.exists()) {
          if (active) {
            setSubmitError('Comment not found.');
          }
          return;
        }
        const commentData = commentSnap.data() as {
          ownerUid: string;
          textBefore: string | null;
          textAfter: string | null;
          citation: string;
          citationText: string;
          citationCategory: string | null;
        };
        if (commentData.ownerUid !== user.uid) {
          if (active) {
            setSubmitError('You can only edit your own comments.');
          }
          return;
        }

        if (active) {
          setEditingCommentId(editId);
          setTextBefore(commentData.textBefore ?? '');
          setTextAfter(commentData.textAfter ?? '');
          setCitationInput(commentData.citation);
          setCitationPreview({
            ref: commentData.citation,
            text: sanitizeText(commentData.citationText),
            category: commentData.citationCategory ?? null,
          });
          setCitationError(null);
        }
      } catch {
        if (active) {
          setSubmitError('Failed to load comment.');
        }
      } finally {
        if (active) setEditingLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [editId, user?.uid]);

  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError('Unable to sign in. Please try again.');
    }
  }, [signInWithGoogle]);

  const canSubmit = citationPreview && (textBefore.trim() || textAfter.trim());

  const handleSubmit = useCallback(async () => {
    if (!user || !citationPreview) return;
    if (!textBefore.trim() && !textAfter.trim()) {
      setSubmitError('Please enter a comment before or after the citation.');
      return;
    }
    setSubmitError(null);
    setSubmitting(true);

    try {
      if (editingCommentId) {
        await updateComment(editingCommentId, {
          textBefore: textBefore.trim() || null,
          textAfter: textAfter.trim() || null,
          citation: citationPreview.ref,
          citationText: sanitizeText(citationPreview.text),
          citationCategory: citationPreview.category ?? null,
        });
        setSubmitting(false);
        router.replace(`/c/${editingCommentId}`);
      } else {
        const commentId = Crypto.randomUUID();
        await createComment(commentId, {
          ownerUid: user.uid,
          textBefore: textBefore.trim() || null,
          textAfter: textAfter.trim() || null,
          citation: citationPreview.ref,
          citationText: sanitizeText(citationPreview.text),
          citationCategory: citationPreview.category ?? null,
        });

        setSubmitting(false);
        router.replace(`/c/${commentId}`);
      }
    } catch (error) {
      setSubmitError('Unable to save comment. Please try again.');
      setSubmitting(false);
    }
  }, [user, citationPreview, textBefore, textAfter, router, editingCommentId]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    await deleteComment(commentId);
  }, []);

  const isReady = !authLoading && !profileLoading;
  const showForm = isAuthenticated && profileExists;
  const showLogin = isReady && !isAuthenticated;
  const citationPreviewText = citationPreview ? sanitizeText(citationPreview.text) : null;
  const accentColor = citationPreview?.category ? palette.categoryColor(citationPreview.category) : colors.gray[400];

  return (
    <View style={[styles.screen, isMobileView && styles.screenMobile]}>
      <DesktopHeader />
      <ScrollView contentContainerStyle={[styles.container, isMobileView && styles.containerMobile, { paddingBottom: mobileNavHeight }]}>
        <View style={styles.content}>
          <Text style={[styles.pageTitle, styles.maxWidth, showLogin && styles.pageTitleCentered]}>
            {editingCommentId ? 'Edit Comment' : 'Post a Comment'}
          </Text>
          <View style={[styles.card, styles.maxWidth, isMobileView && styles.cardMobile]}>
            {editingLoading && (
              <View style={styles.center}>
                <ActivityIndicator />
              </View>
            )}

            {!editingLoading && !isReady && (
              <View style={styles.center}>
                <ActivityIndicator />
              </View>
            )}

            {isReady && profileLoadError && (
              <Text style={styles.error}>{profileLoadError}</Text>
            )}

            {showLogin && (
              <View style={[styles.section, styles.sectionCentered]}>
                <Text style={[styles.body, styles.centerText]}>Sign in to create comments on Torah sources.</Text>
                {authError && <Text style={styles.error}>{authError}</Text>}
                <Pressable style={styles.googleButton} onPress={handleSignIn}>
                  <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </Pressable>
              </View>
            )}

            {isReady && showForm && (
              <View style={styles.section}>
                <TextInput
                  label="Comment Before (optional)"
                  value={textBefore}
                  onChangeText={setTextBefore}
                  mode="outlined"
                  style={styles.input}
                  theme={inputTheme}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholder="Your thoughts before the source..."
                />
                <TextInput
                  label="Citation (required)"
                  value={citationInput}
                  onChangeText={setCitationInput}
                  mode="outlined"
                  style={styles.input}
                  theme={inputTheme}
                  placeholder="e.g. Genesis 1:1 or https://www.sefaria.org/Genesis.1.1"
                />
                {citationLoading && (
                  <View style={styles.inline}>
                    <ActivityIndicator />
                    <Text style={styles.body}>Checking citation...</Text>
                  </View>
                )}
                {citationError && <Text style={styles.error}>{citationError}</Text>}
                {citationPreview && citationPreviewText && (
                  <TextBlock
                    reference={citationPreview.ref}
                    text={citationPreviewText}
                    accentColor={accentColor}
                    maxLines={6}
                  />
                )}
                <TextInput
                  label="Comment After (optional)"
                  value={textAfter}
                  onChangeText={setTextAfter}
                  mode="outlined"
                  style={styles.input}
                  theme={inputTheme}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholder="Your thoughts after the source..."
                />
                {!textBefore.trim() && !textAfter.trim() && citationPreview && (
                  <Text style={styles.helperText}>Please enter a comment before or after the citation.</Text>
                )}
                {submitError && <Text style={styles.error}>{submitError}</Text>}
                <View style={styles.buttonRow}>
                  {editingCommentId && (
                    <Button
                      mode="outlined"
                      onPress={() => router.back()}
                      disabled={submitting}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={submitting}
                    disabled={!canSubmit || submitting}
                    style={styles.button}
                  >
                    Save Comment
                  </Button>
                </View>
                {submittedId && (
                  <Text style={styles.success}>Comment saved.</Text>
                )}
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
  pageTitleCentered: {
    textAlign: 'center',
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
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  success: {
    color: colors['sefaria-blue'],
    marginTop: 12,
    fontWeight: '600',
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    borderRadius: 12,
  },
  cancelButton: {
    borderRadius: 12,
  },
  commentsList: {
    gap: 16,
  },
  commentPreview: {
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 12,
    backgroundColor: colors.gray[50],
  },
  commentText: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.gray[800],
    marginVertical: 8,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: colors.gray[600],
  },
});
