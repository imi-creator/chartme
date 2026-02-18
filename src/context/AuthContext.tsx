'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Organization, User } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  organization: Organization | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, organizationName: string) => Promise<void>;
  signUpWithInvite: (email: string, password: string, displayName: string, inviteToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (firebaseUser: FirebaseUser) => {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as User;
      setUserData(data);
      
      // Charger l'organisation
      const orgDoc = await getDoc(doc(db, 'organizations', data.organizationId));
      if (orgDoc.exists()) {
        setOrganization({
          id: orgDoc.id,
          ...orgDoc.data(),
          createdAt: orgDoc.data().createdAt?.toDate(),
        } as Organization);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadUserData(firebaseUser);
      } else {
        setUserData(null);
        setOrganization(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshOrganization = async () => {
    if (userData?.organizationId) {
      const orgDoc = await getDoc(doc(db, 'organizations', userData.organizationId));
      if (orgDoc.exists()) {
        setOrganization({
          id: orgDoc.id,
          ...orgDoc.data(),
          createdAt: orgDoc.data().createdAt?.toDate(),
        } as Organization);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await loadUserData(userCredential.user);
  };

  const signUp = async (email: string, password: string, displayName: string, organizationName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(userCredential.user, { displayName });
    
    // Créer l'organisation
    const orgRef = await addDoc(collection(db, 'organizations'), {
      name: organizationName,
      plan: 'free',
      testCount: 0,
      createdBy: userCredential.user.uid,
      createdAt: Timestamp.now(),
    });

    // Créer l'utilisateur avec lien vers l'organisation
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: email,
      displayName: displayName,
      organizationId: orgRef.id,
      createdAt: Timestamp.now(),
    });

    await loadUserData(userCredential.user);
  };

  const signUpWithInvite = async (email: string, password: string, displayName: string, inviteToken: string) => {
    // Vérifier l'invitation
    const { getDocs, query, where, updateDoc } = await import('firebase/firestore');
    const inviteQuery = query(
      collection(db, 'invitations'),
      where('token', '==', inviteToken),
      where('status', '==', 'pending'),
      where('email', '==', email.toLowerCase())
    );
    const inviteSnapshot = await getDocs(inviteQuery);
    
    if (inviteSnapshot.empty) {
      throw new Error('Invitation invalide ou expirée');
    }

    const inviteDoc = inviteSnapshot.docs[0];
    const inviteData = inviteDoc.data();

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await updateProfile(userCredential.user, { displayName });

    // Créer l'utilisateur avec l'organisation de l'invitation
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: email,
      displayName: displayName,
      organizationId: inviteData.organizationId,
      createdAt: Timestamp.now(),
    });

    // Marquer l'invitation comme acceptée
    await updateDoc(doc(db, 'invitations', inviteDoc.id), {
      status: 'accepted',
    });

    await loadUserData(userCredential.user);
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      organization, 
      loading, 
      signIn, 
      signUp, 
      signUpWithInvite, 
      logout,
      refreshOrganization 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
