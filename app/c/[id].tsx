import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CommentDoc, deleteComment } from '@/lib/firestore';
import { getProfile } from '@/lib/firestore';
import { CommentFeedCard } from '@/types/cards';
import { CommentCardView } from '@/components/cards';
import { CardActions } from '@/components/CardActions';
import { colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { PhoneViewport, usePhoneViewport } from '@/components/PhoneViewport';

export default function CommentViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { phoneHeight, phoneWidth, showHeader, mobileNavHeight } = usePhoneViewport();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [card, setCard] = useState<CommentFeedCard | null>(null);
  const [ownerUid, setOwnerUid] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Comment not found.');
      setLoading(false);
      return;
    }

    let active = true;

    async function loadComment() {
      try {
        const commentRef = doc(db.current, 'comments', id);
        const commentSnap = await getDoc(commentRef);

        if (!commentSnap.exists()) {
          if (active) {
            setError('Comment not found.');
            setLoading(false);
          }
          return;
        }

        const commentData = commentSnap.data() as CommentDoc;

        let ownerDisplayName: string | null = null;
        let ownerProfileLink: string | null = null;
        let ownerPhotoURL: string | null = null;

        try {
          const profileSnap = await getProfile(commentData.ownerUid);
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
            id: commentSnap.id,
            type: 'comment',
            title: 'Comment',
            description: '',
            textBefore: commentData.textBefore,
            textAfter: commentData.textAfter,
            citation: commentData.citation,
            citationText: commentData.citationText,
            citationCategory: commentData.citationCategory,
            ownerDisplayName,
            ownerProfileLink,
            ownerPhotoURL,
          });
          setOwnerUid(commentData.ownerUid);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError('Failed to load comment.');
          setLoading(false);
        }
      }
    }

    loadComment();

    return () => {
      active = false;
    };
  }, [id]);

  const isOwner = Boolean(ownerUid && user?.uid && ownerUid === user.uid);

  const handleEdit = useCallback(() => {
    if (!id) return;
    router.push(`/comment?editId=${id}`);
  }, [id, router]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    await deleteComment(id);
    router.replace('/profile');
  }, [id, router]);

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
          <CommentCardView
            card={card}
            cardHeight={cardHeight}
            actions={isOwner ? <CardActions onEdit={handleEdit} onDelete={handleDelete} /> : undefined}
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
