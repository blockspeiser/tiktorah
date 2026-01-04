import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { FeedPreferences } from './preferences';

export interface ProfileDoc {
  uid: string;
  displayName: string;
  googleName: string | null;
  profileLink: string | null;
  photoURL: string | null;
  email: string | null;
  feedPreferences?: FeedPreferences;
  createdAt: unknown;
  modifiedAt: unknown;
}

export interface MemeDoc {
  ownerUid: string;
  storagePath: string;
  contentType: string;
  citation: string;
  citationText?: string | null;
  citationCategory?: string | null;
  caption: string | null;
  memeLink: string | null;
  createdAt: unknown;
  modifiedAt: unknown;
  originalFileName?: string | null;
  fileSize?: number | null;
  width?: number | null;
  height?: number | null;
}

export interface CommentDoc {
  ownerUid: string;
  textBefore: string | null;
  textAfter: string | null;
  citation: string;
  citationText: string;
  citationCategory: string | null;
  createdAt: unknown;
  modifiedAt: unknown;
}

export async function getProfile(uid: string) {
  const ref = doc(db.current, 'profiles', uid);
  return getDoc(ref);
}

export async function createProfile(uid: string, data: Omit<ProfileDoc, 'createdAt' | 'modifiedAt'>) {
  const ref = doc(db.current, 'profiles', uid);
  return setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    modifiedAt: serverTimestamp(),
  });
}

export async function updateProfile(uid: string, data: Partial<ProfileDoc>) {
  const ref = doc(db.current, 'profiles', uid);
  return updateDoc(ref, {
    ...data,
    modifiedAt: serverTimestamp(),
  });
}

export async function createMeme(memeId: string, data: Omit<MemeDoc, 'createdAt' | 'modifiedAt'>) {
  const ref = doc(db.current, 'memes', memeId);
  return setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    modifiedAt: serverTimestamp(),
  });
}

export async function updateMeme(memeId: string, data: Partial<MemeDoc>) {
  const ref = doc(db.current, 'memes', memeId);
  return updateDoc(ref, {
    ...data,
    modifiedAt: serverTimestamp(),
  });
}

export async function deleteMemeDoc(memeId: string) {
  const ref = doc(db.current, 'memes', memeId);
  return deleteDoc(ref);
}

export function subscribeToMyMemes(
  uid: string,
  callback: (docs: { id: string; data: MemeDoc }[]) => void,
  onError?: (error: Error) => void
) {
  const memesRef = collection(db.current, 'memes');
  const q = query(memesRef, where('ownerUid', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const results = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        data: docSnap.data() as MemeDoc,
      }));
      callback(results);
    },
    onError
  );
}

export function subscribeToMemesFeed(
  callback: (docs: { id: string; data: MemeDoc }[]) => void,
  onError?: (error: Error) => void
) {
  const memesRef = collection(db.current, 'memes');
  const q = query(memesRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const results = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        data: docSnap.data() as MemeDoc,
      }));
      callback(results);
    },
    onError
  );
}

export async function createComment(commentId: string, data: Omit<CommentDoc, 'createdAt' | 'modifiedAt'>) {
  const ref = doc(db.current, 'comments', commentId);
  return setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    modifiedAt: serverTimestamp(),
  });
}

export async function updateComment(commentId: string, data: Partial<CommentDoc>) {
  const ref = doc(db.current, 'comments', commentId);
  return updateDoc(ref, {
    ...data,
    modifiedAt: serverTimestamp(),
  });
}

export async function deleteComment(commentId: string) {
  const ref = doc(db.current, 'comments', commentId);
  return deleteDoc(ref);
}

export function subscribeToMyComments(
  uid: string,
  callback: (docs: { id: string; data: CommentDoc }[]) => void,
  onError?: (error: Error) => void
) {
  const commentsRef = collection(db.current, 'comments');
  const q = query(commentsRef, where('ownerUid', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const results = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        data: docSnap.data() as CommentDoc,
      }));
      callback(results);
    },
    onError
  );
}

export function subscribeToCommentsFeed(
  callback: (docs: { id: string; data: CommentDoc }[]) => void,
  onError?: (error: Error) => void
) {
  const commentsRef = collection(db.current, 'comments');
  const q = query(commentsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const results = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        data: docSnap.data() as CommentDoc,
      }));
      callback(results);
    },
    onError
  );
}
