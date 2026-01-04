import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, Platform, Pressable, useWindowDimensions } from 'react-native';
import { ActivityIndicator, Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { createMeme, updateMeme, deleteMemeDoc } from '@/lib/firestore';
import { deleteMemeStorage, getMemeDownloadUrl, uploadUserMeme } from '@/lib/storage';
import { useProfile } from '@/hooks/useProfile';
import { useMyMemes } from '@/hooks/useMyMemes';
import { MemeCard } from '@/components/cards/MemeCard';
import { colors } from '@/constants/colors';
import { fetchCitationPreview, sanitizeText } from '@/services/sefariaText';
import { MobileNav, useMobileNavHeight } from '@/components/MobileNav';
import { DesktopHeader } from '@/components/DesktopHeader';

export const options = {
  title: 'Upload',
};

interface PickedImage {
  uri: string;
  file?: File;
  name?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
}

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

export default function UploadScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isCompactWeb = isWeb && screenWidth < 720;
  const isMobileView = !isWeb || isCompactWeb;
  const { user, loading: authLoading, isAuthenticated, signInWithGoogle } = useAuth();
  const { profile, exists: profileExists, loading: profileLoading, error: profileLoadError } = useProfile(user?.uid);
  const { memes, loading: memesLoading, error: memesError } = useMyMemes(profileExists ? user?.uid : undefined);

  const [authError, setAuthError] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<PickedImage | null>(null);
  const [caption, setCaption] = useState('');
  const [memeLink, setMemeLink] = useState('');
  const [citationInput, setCitationInput] = useState('');
  const [citationPreview, setCitationPreview] = useState<{ ref: string; text: string; category?: string | null } | null>(null);
  const [citationError, setCitationError] = useState<string | null>(null);
  const [citationLoading, setCitationLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedMemeId, setUploadedMemeId] = useState<string | null>(null);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});

  const inputTheme = useMemo(() => ({ roundness: 12 }), []);
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

  React.useEffect(() => {
    if (memes.length === 0) {
      setDownloadUrls({});
      return;
    }
    loadDownloadUrls();
  }, [memes, loadDownloadUrls]);


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

  const handlePickImage = useCallback(async () => {
    setUploadError(null);
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        setUploadError('Photo library access is required to upload a meme.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    const assetFile = 'file' in asset ? (asset as { file?: File }).file : undefined;
    setPickedImage({
      uri: asset.uri,
      file: assetFile,
      name: asset.fileName ?? undefined,
      mimeType: asset.mimeType ?? undefined,
      fileSize: asset.fileSize ?? undefined,
      width: asset.width ?? undefined,
      height: asset.height ?? undefined,
    });
  }, []);

  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError('Unable to sign in. Please try again.');
    }
  }, [signInWithGoogle]);

  const handleUploadMeme = useCallback(async () => {
    if (!user || !pickedImage) return;
    setUploadError(null);

    const normalizedMemeLink = normalizeUrl(memeLink);
    if (!isValidUrl(normalizedMemeLink)) {
      setUploadError('Meme Link must be a valid URL.');
      return;
    }
    if (!citationPreview) {
      setUploadError('Citation is required and must be valid.');
      return;
    }

    setUploading(true);
    const memeId = Crypto.randomUUID();
    const uploadResult = await uploadUserMeme(user.uid, memeId, {
      file: pickedImage.file,
      uri: pickedImage.uri,
      name: pickedImage.name,
      mimeType: pickedImage.mimeType,
    });

    try {
      if (normalizedMemeLink !== memeLink) {
        setMemeLink(normalizedMemeLink);
      }
    await createMeme(memeId, {
      ownerUid: user.uid,
      storagePath: uploadResult.storagePath,
      contentType: uploadResult.contentType,
      citation: citationPreview.ref,
      citationText: sanitizeText(citationPreview.text),
      citationCategory: citationPreview.category ?? null,
      caption: caption.trim() || null,
      memeLink: normalizedMemeLink || null,
      originalFileName: pickedImage.name ?? null,
        fileSize: pickedImage.fileSize ?? uploadResult.fileSize ?? null,
        width: pickedImage.width ?? null,
        height: pickedImage.height ?? null,
      });
    } catch (error) {
      setUploadError('Unable to upload meme. Please try again.');
      setUploading(false);
      return;
    }

    setUploading(false);
    router.replace(`/meme/${memeId}`);
  }, [user, pickedImage, caption, memeLink, citationPreview, router]);

  const handleUpdateMeme = useCallback(async (
    memeId: string,
    nextCaption: string,
    nextLink: string,
    nextCitation?: string,
    nextCitationText?: string,
    nextCitationCategory?: string | null
  ) => {
    const normalizedLink = normalizeUrl(nextLink);
    if (!isValidUrl(normalizedLink)) {
      setUploadError('Meme Link must be a valid URL.');
      return;
    }
    await updateMeme(memeId, {
      caption: nextCaption || null,
      memeLink: normalizedLink || null,
      ...(nextCitation ? { citation: nextCitation } : {}),
      ...(nextCitationText ? { citationText: nextCitationText } : {}),
      ...(nextCitation !== undefined ? { citationCategory: nextCitationCategory ?? null } : {}),
    });
  }, []);

  const handleDeleteMeme = useCallback(async (memeId: string, storagePath: string) => {
    await deleteMemeStorage(storagePath);
    await deleteMemeDoc(memeId);
  }, []);

  const isReady = !authLoading && !profileLoading;
  const showUpload = isAuthenticated && profileExists;
  const isWide = screenWidth >= 900;
  const showLogin = isReady && !isAuthenticated;
  const citationPreviewText = citationPreview ? sanitizeText(citationPreview.text) : null;

  return (
    <View style={[styles.screen, isMobileView && styles.screenMobile]}>
      <DesktopHeader />
      <ScrollView contentContainerStyle={[styles.container, isMobileView && styles.containerMobile, { paddingBottom: mobileNavHeight }]}>
      <View style={styles.content}>
        <Text style={[styles.pageTitle, styles.maxWidth, showLogin && styles.pageTitleCentered]}>Upload a Torah Meme</Text>
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
            <Text style={[styles.body, styles.centerText]}>Sign in to upload your memes and manage your profile.</Text>
            {authError && <Text style={styles.error}>{authError}</Text>}
            <Pressable style={styles.googleButton} onPress={handleSignIn}>
              <MaterialCommunityIcons name="google" size={20} color="#4285F4" />
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </Pressable>
          </View>
        )}

        {isReady && showUpload && (
          <View style={styles.section}>
            <Button
              mode="contained"
              onPress={handlePickImage}
              style={[styles.button, styles.primaryActionButton]}
              labelStyle={styles.primaryActionLabel}
              buttonColor={colors.hotPink}
              textColor={colors.white}
              icon="upload"
            >
              {pickedImage ? 'Change Image' : 'Choose Image'}
            </Button>
            {pickedImage && (
              <Image
                source={{ uri: pickedImage.uri }}
                style={[
                  styles.preview,
                  pickedImage.width && pickedImage.height
                    ? { aspectRatio: pickedImage.width / pickedImage.height, height: undefined }
                    : null,
                ]}
                resizeMode="contain"
              />
            )}
            <TextInput
              label="Caption (optional)"
              value={caption}
              onChangeText={setCaption}
              mode="outlined"
              style={styles.input}
              theme={inputTheme}
            />
            <TextInput
              label="Meme Link (optional)"
              value={memeLink}
              onChangeText={setMemeLink}
              mode="outlined"
              style={styles.input}
              theme={inputTheme}
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
            {citationPreview && (
              <View style={[styles.citationBox, { borderLeftColor: colors['sefaria-blue'] }]}>
                <Text style={styles.citationRef}>{citationPreview.ref}</Text>
                <Text style={styles.citationText} numberOfLines={6} ellipsizeMode="tail">
                  {citationPreviewText}
                </Text>
              </View>
            )}
            {uploadError && <Text style={styles.error}>{uploadError}</Text>}
            <Button
              mode="contained"
              onPress={handleUploadMeme}
              loading={uploading}
              disabled={!pickedImage || uploading || !citationPreview}
              style={styles.button}
            >
              Upload Meme
            </Button>
            {uploadedMemeId && (
              <Text style={styles.success}>Upload complete.</Text>
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
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.gray[900],
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
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: colors.gray[100],
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  citationBox: {
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderLeftWidth: 6,
    borderColor: colors.gray[300],
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  citationRef: {
    fontSize: 20,
    lineHeight: 30,
    color: colors.gray[500],
    marginBottom: 8,
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
  },
  citationText: {
    fontSize: 20,
    lineHeight: 30,
    color: colors.gray[700],
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'serif',
    }),
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
  button: {
    alignSelf: 'center',
    borderRadius: 12,
  },
  primaryActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  primaryActionLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  memeGrid: {
    width: '100%',
  },
  memeGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  memeCell: {
    width: '100%',
  },
  memeCellWide: {
    width: '48%',
  },
});
