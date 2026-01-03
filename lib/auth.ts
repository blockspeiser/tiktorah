import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  signInWithCredential,
} from 'firebase/auth';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { auth } from './firebase';

WebBrowser.maybeCompleteAuthSession();

export interface AuthState {
  user: User | null;
  loading: boolean;
}

const googleProvider = new GoogleAuthProvider();

export function useGoogleAuthRequest() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: 'tiktorah' }),
  });

  return { request, response, promptAsync };
}

export async function signInWithGoogleRedirect() {
  return signInWithRedirect(auth, googleProvider);
}

export async function handleRedirectResult() {
  return getRedirectResult(auth);
}

export async function signInWithGoogleCredential(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signOut() {
  return firebaseSignOut(auth);
}

export const isWeb = Platform.OS === 'web';
