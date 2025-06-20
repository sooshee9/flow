'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../../src/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import type { User } from '../../src/lib/types';
import { useToast } from '../../src/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('[AuthContext] onAuthStateChanged:', firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.exists() ? userDoc.data() : null;
        console.log('[AuthContext] Firestore userDoc:', userData);
        // Always use firebaseUser.email if available, fallback to userData.email, else null
        setCurrentUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || userData?.email || null,
          role: userData?.role ?? 'viewer',
        });
        console.log('[AuthContext] setCurrentUser:', {
          uid: firebaseUser.uid,
          email: firebaseUser.email || userData?.email || null,
          role: userData?.role ?? 'viewer',
        });
      } else {
        setCurrentUser(null);
        console.log('[AuthContext] setCurrentUser: null');
      }
      setLoading(false);
      console.log('[AuthContext] setLoading: false');
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      toast({
        title: 'Success',
        description: 'Logged out successfully.',
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Error',
        description: 'Failed to log out.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}