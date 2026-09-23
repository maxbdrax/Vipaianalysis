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
  isDirectAdmin: boolean;
  allUsers: UserProfile[];
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string) => Promise<void>;
  loginAsRootAdmin: () => void;
  logout: () => Promise<void>;
  updateUserRole: (uid: string, newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const BOOTSTRAP_ADMIN_EMAIL = 'developermaxbd@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isDirectAdmin, setIsDirectAdmin] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('wingo_vip_root_admin') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsDirectAdmin(false);
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
              role: isBootstrap ? 'ADMIN' : 'ANALYST',
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
        if (localStorage.getItem('wingo_vip_root_admin') === 'true') {
          setIsDirectAdmin(true);
          setUserProfile({
            uid: 'root-admin-direct',
            email: BOOTSTRAP_ADMIN_EMAIL,
            displayName: 'Root Administrator (Max)',
            role: 'ADMIN',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync direct admin mode if changed
  useEffect(() => {
    if (!currentUser && isDirectAdmin) {
      setUserProfile({
        uid: 'root-admin-direct',
        email: BOOTSTRAP_ADMIN_EMAIL,
        displayName: 'Root Administrator (Max)',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [currentUser, isDirectAdmin]);

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
    } catch (error: any) {
      console.error('Google sign in error:', error);
      if (error?.code === 'auth/unauthorized-domain' || error?.message?.includes('unauthorized-domain')) {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
        const enrichedErr = new Error(`Firebase Auth Domain Error: Current domain "${hostname}" is not authorized.`);
        (enrichedErr as any).code = 'auth/unauthorized-domain';
        (enrichedErr as any).hostname = hostname;
        throw enrichedErr;
      }
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

  const loginAsRootAdmin = () => {
    localStorage.setItem('wingo_vip_root_admin', 'true');
    setIsDirectAdmin(true);
    setUserProfile({
      uid: 'root-admin-direct',
      email: BOOTSTRAP_ADMIN_EMAIL,
      displayName: 'Root Administrator (Max)',
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const logout = async () => {
    localStorage.removeItem('wingo_vip_root_admin');
    setIsDirectAdmin(false);
    setUserProfile(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout error:', e);
    }
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

  const role: UserRole = userProfile?.role || (isDirectAdmin ? 'ADMIN' : 'VIEWER');
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
        isDirectAdmin,
        allUsers,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        loginAsRootAdmin,
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
