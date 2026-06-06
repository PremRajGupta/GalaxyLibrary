import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/config';
import axios from 'axios';
import { apiUrl } from '../lib/apiConfig';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: string;
  studentId?: string; // Optional student display ID
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  studentLogin: (email: string, password: string) => Promise<void>;
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
    // Check if we have a student session in localStorage first
    const storedUserStr = localStorage.getItem('galaxylibrary_user');
    const storedToken = localStorage.getItem('galaxylibrary_token');
    
    if (storedUserStr && storedToken) {
      try {
        const storedUser = JSON.parse(storedUserStr);
        if (storedUser.role === 'student') {
          setUser(storedUser);
          setLoading(false);
        }
      } catch (e) {
        console.error("Error parsing stored user", e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // If we already resolved a student session, don't let firebase clean it up or overwrite it
      const currentStoredUser = localStorage.getItem('galaxylibrary_user');
      if (currentStoredUser) {
        try {
          const parsed = JSON.parse(currentStoredUser);
          if (parsed.role === 'student') {
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

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

  const studentLogin = async (email: string, password: string) => {
    try {
      const response = await axios.post(apiUrl('/api/student/login'), { email, password }, {
        headers: { 'Content-Type': 'application/json' }
      });
      const { token, user: appUser } = response.data;
      localStorage.setItem('galaxylibrary_token', token);
      saveAppUser(appUser);
      setUser(appUser);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Invalid email or password';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    const storedUserStr = localStorage.getItem('galaxylibrary_user');
    if (storedUserStr) {
      try {
        const parsed = JSON.parse(storedUserStr);
        if (parsed.role === 'admin') {
          await signOut(auth);
        }
      } catch (e) {}
    }
    setUser(null);
    localStorage.removeItem('galaxylibrary_user');
    localStorage.removeItem('galaxylibrary_token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, studentLogin, logout }}>
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
