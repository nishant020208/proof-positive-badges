import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: 'customer' | 'shop_owner' | 'owner';
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  credibilityScore: number;
  totalReports: number;
  acceptedReports: number;
  streakDays: number;
  lastActiveDate: Date | null;
}

interface FirebaseAuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'customer' | 'shop_owner' | 'owner') => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refetchProfile: () => Promise<void>;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile({
          id: docSnap.id,
          email: data.email || '',
          fullName: data.fullName || null,
          phone: data.phone || null,
          role: data.role || 'customer',
          avatarUrl: data.avatarUrl || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          credibilityScore: data.credibilityScore || 50,
          totalReports: data.totalReports || 0,
          acceptedReports: data.acceptedReports || 0,
          streakDays: data.streakDays || 0,
          lastActiveDate: data.lastActiveDate?.toDate() || null,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'customer' | 'shop_owner' | 'owner') => {
    try {
      // Check owner whitelist if signing up as owner
      if (role === 'owner') {
        const whitelistRef = doc(db, 'ownerWhitelist', email.toLowerCase());
        const whitelistSnap = await getDoc(whitelistRef);
        
        if (!whitelistSnap.exists() || whitelistSnap.data()?.status !== 'pending') {
          return { error: new Error('This email is not whitelisted for Owner access') };
        }
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      // Update display name
      await updateProfile(newUser, { displayName: fullName });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        email: email,
        fullName: fullName,
        role: role === 'owner' ? 'customer' : role, // Store as customer, but add to userRoles
        phone: null,
        avatarUrl: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        credibilityScore: 50,
        totalReports: 0,
        acceptedReports: 0,
        streakDays: 0,
        lastActiveDate: null,
      });

      // If owner, add to userRoles collection
      if (role === 'owner') {
        await setDoc(doc(db, 'userRoles', newUser.uid), {
          userId: newUser.uid,
          role: 'owner',
          createdAt: serverTimestamp(),
        });

        // Update whitelist status
        await updateDoc(doc(db, 'ownerWhitelist', email.toLowerCase()), {
          status: 'activated',
          activatedAt: serverTimestamp(),
        });
      }

      await fetchProfile(newUser.uid);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      await fetchProfile(user.uid);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refetchProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  return (
    <FirebaseAuthContext.Provider value={{
      user,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateUserProfile,
      refetchProfile,
    }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}
