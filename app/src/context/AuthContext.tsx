import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/config';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const saveAppUser = (appUser: User) => {
  localStorage.setItem('galaxylibrary_user', JSON.stringify(appUser));
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message || 'An error occurred. Please try again.';
  }
  return 'An error occurred. Please try again.';
};

const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName,
  role: 'admin'
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('galaxylibrary_token', token);
        const appUser = mapFirebaseUser(firebaseUser);
        setUser(appUser);
        saveAppUser(appUser);
      } else {
        setUser(null);
        localStorage.removeItem('galaxylibrary_user');
        localStorage.removeItem('galaxylibrary_token');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = credential.user;
      const token = await firebaseUser.getIdToken();
      const appUser = mapFirebaseUser(firebaseUser);
      localStorage.setItem('galaxylibrary_token', token);
      saveAppUser(appUser);
      setUser(appUser);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem('galaxylibrary_user');
    localStorage.removeItem('galaxylibrary_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
