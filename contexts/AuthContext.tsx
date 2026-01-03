import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import { handleRedirectResult, isWeb, signInWithGoogleCredential, signInWithGooglePopup, signInWithGoogleRedirect, signOut, subscribeToAuth, useGoogleAuthRequest } from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { response, promptAsync } = useGoogleAuthRequest();

  useEffect(() => {
    const unsubscribe = subscribeToAuth((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isWeb) return;
    handleRedirectResult().catch(() => {
      // ignore redirect result errors; auth state will handle failures
    });
  }, []);

  useEffect(() => {
    if (!response || response.type !== 'success') return;
    const idToken = response.authentication?.idToken;
    if (idToken) {
      signInWithGoogleCredential(idToken);
    }
  }, [response]);

  const signInWithGoogle = useCallback(async () => {
    if (isWeb) {
      try {
        await signInWithGooglePopup();
      } catch (error) {
        await signInWithGoogleRedirect();
      }
      return;
    }
    await promptAsync();
  }, [promptAsync]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    signInWithGoogle,
    signOutUser: signOut,
  }), [user, loading, signInWithGoogle]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
