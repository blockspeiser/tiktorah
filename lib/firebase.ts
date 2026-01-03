import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// getReactNativePersistence is exported from @firebase/auth only in react-native context
// TypeScript doesn't understand conditional exports, so we use require
const getReactNativePersistence = Platform.OS !== 'web'
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require('@firebase/auth').getReactNativePersistence
  : null;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Lazy initialization to avoid errors during static build
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return _app;
}

// Lazy getter for auth - only initializes when actually accessed at runtime
const auth = {
  get current(): Auth {
    if (!_auth) {
      const app = getApp();
      _auth = Platform.OS === 'web'
        ? getAuth(app)
        : initializeAuth(app, {
            persistence: getReactNativePersistence!(AsyncStorage),
          });
    }
    return _auth;
  }
};

const db = {
  get current(): Firestore {
    if (!_db) {
      _db = getFirestore(getApp());
    }
    return _db;
  }
};

const storage = {
  get current(): FirebaseStorage {
    if (!_storage) {
      _storage = getStorage(getApp());
    }
    return _storage;
  }
};

// Export getters that provide lazy access
export { auth, db, storage };
export const app = { get current() { return getApp(); } };
