import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot 
} from 'firebase/firestore';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isAnalyst: boolean;
  allUsers: UserProfile[];
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserRole: (uid: string, newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BOOTSTRAP_ADMIN_EMAIL = 'developermaxbd@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);

          const isBootstrap = user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            // Elevate bootstrap admin if not already
            if (isBootstrap && data.role !== 'ADMIN') {
              await updateDoc(userDocRef, { role: 'ADMIN', updatedAt: new Date().toISOString() });
              setUserProfile({ ...data, role: 'ADMIN' });
            } else {
              setUserProfile(data);
            }
          } else {
            // New user registration profile
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || 'user@wingo.vip',
              displayName: user.displayName || user.email?.split('@')[0] || 'VIP Member',
              role: isBootstrap ? 'ADMIN' : 'ANALYST', // Default to analyst for immediate testing or viewer
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback in-memory profile if firestore write delayed
          setUserProfile({
            uid: user.uid,
            email: user.email || 'user@wingo.vip',
            displayName: user.displayName || 'VIP Member',
            role: user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ? 'ADMIN' : 'ANALYST',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen to all users if Admin
  useEffect(() => {
    if (!currentUser || userProfile?.role !== 'ADMIN') {
      setAllUsers([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const users: UserProfile[] = [];
        snap.forEach((d) => users.push(d.data() as UserProfile));
        setAllUsers(users);
      },
      (err) => {
        console.warn('Could not subscribe to users list (non-admin or rules):', err);
      }
    );

    return () => unsub();
  }, [currentUser, userProfile?.role]);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email login error:', error);
      throw error;
    }
  };

  const signupWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      console.error('Email signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        role: newRole,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const role: UserRole = userProfile?.role || 'VIEWER';
  const isAdmin = role === 'ADMIN';
  const isAnalyst = isAdmin || role === 'ANALYST';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        loading,
        isAdmin,
        isAnalyst,
        allUsers,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
