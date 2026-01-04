import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MemeDoc, updateMeme, deleteMemeDoc } from '@/lib/firestore';
import { getProfile } from '@/lib/firestore';
import { deleteMemeStorage, getMemeDownloadUrl } from '@/lib/storage';
import { MemeFeedCard } from '@/types/cards';
import { MemeCard } from '@/components/cards/MemeCard';
import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneViewport, usePhoneViewport } from '@/components/PhoneViewport';

export default function MemeViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { phoneHeight, phoneWidth, showHeader, mobileNavHeight } = usePhoneViewport();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<MemeFeedCard | null>(null);
  const [memeDoc, setMemeDoc] = useState<MemeDoc | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Meme not found.');
      setLoading(false);
      return;
    }

    let active = true;

    async function loadMeme() {
      try {
        const memeRef = doc(db.current, 'memes', id);
        const memeSnap = await getDoc(memeRef);

        if (!memeSnap.exists()) {
          if (active) {
            setError('Meme not found.');
            setLoading(false);
          }
          return;
        }

        const memeData = memeSnap.data() as MemeDoc;
        const imageUrl = await getMemeDownloadUrl(memeData.storagePath);

        let ownerDisplayName: string | null = null;
        let ownerProfileLink: string | null = null;
        let ownerPhotoURL: string | null = null;

        try {
          const profileSnap = await getProfile(memeData.ownerUid);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            ownerDisplayName = profileData.displayName || null;
            ownerProfileLink = profileData.profileLink || null;
            ownerPhotoURL = profileData.photoURL || null;
          }
        } catch {
          // Profile fetch failed, continue without it
        }

        if (active) {
          setCard({
            id: memeSnap.id,
            type: 'meme',
            title: memeData.caption || 'Meme',
            description: '',
            imageUrl,
            caption: memeData.caption,
            citation: memeData.citation,
            citationText: memeData.citationText,
            citationCategory: memeData.citationCategory,
            memeLink: memeData.memeLink,
            ownerDisplayName,
            ownerProfileLink,
            ownerPhotoURL,
          });
          setMemeDoc(memeData);
          setIsOwner(Boolean(user?.uid && user.uid === memeData.ownerUid));
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError('Failed to load meme.');
          setLoading(false);
        }
      }
    }

    loadMeme();

    return () => {
      active = false;
    };
  }, [id, user?.uid]);

  const handleUpdateMeme = useCallback(async (
    nextCaption: string,
    nextLink: string,
    nextCitation?: string,
    nextCitationText?: string,
    nextCitationCategory?: string | null
  ) => {
    if (!id) return;
    await updateMeme(id, {
      caption: nextCaption || null,
      memeLink: nextLink || null,
      ...(nextCitation ? { citation: nextCitation } : {}),
      ...(nextCitationText ? { citationText: nextCitationText } : {}),
      ...(nextCitation !== undefined ? { citationCategory: nextCitationCategory ?? null } : {}),
    });
    setCard((prev) => (
      prev ? {
        ...prev,
        caption: nextCaption || null,
        memeLink: nextLink || null,
        ...(nextCitation ? { citation: nextCitation } : {}),
        ...(nextCitationText ? { citationText: nextCitationText } : {}),
        ...(nextCitation !== undefined ? { citationCategory: nextCitationCategory ?? null } : {}),
      } : prev
    ));
    setMemeDoc((prev) => (
      prev ? {
        ...prev,
        caption: nextCaption || null,
        memeLink: nextLink || null,
        ...(nextCitation ? { citation: nextCitation } : {}),
        ...(nextCitationText ? { citationText: nextCitationText } : {}),
        ...(nextCitation !== undefined ? { citationCategory: nextCitationCategory ?? null } : {}),
      } : prev
    ));
  }, [id]);

  const handleDeleteMeme = useCallback(async () => {
    if (!id || !memeDoc) return;
    await deleteMemeStorage(memeDoc.storagePath);
    await deleteMemeDoc(id);
    router.replace('/profile');
  }, [id, memeDoc, router]);

  const cardHeight = phoneHeight;

  const content = (
    <>
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      )}
      {error && (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
      {card && (
        <View style={[styles.cardContainer, { height: cardHeight }]}>
          <MemeCard
            imageUrl={card.imageUrl ?? ''}
            caption={card.caption ?? null}
            citation={card.citation ?? ''}
            citationText={card.citationText ?? null}
            citationCategory={card.citationCategory ?? null}
            memeLink={card.memeLink ?? null}
            onSave={handleUpdateMeme}
            onDelete={handleDeleteMeme}
            showActions={isOwner}
          />
        </View>
      )}
    </>
  );

  return (
    <PhoneViewport
      phoneWidth={phoneWidth}
      phoneHeight={phoneHeight}
      showHeader={showHeader}
      mobileNavHeight={mobileNavHeight}
    >
      {content}
    </PhoneViewport>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    color: colors.hotPink,
    fontSize: 16,
  },
  cardContainer: {
    width: '100%',
  },
});
