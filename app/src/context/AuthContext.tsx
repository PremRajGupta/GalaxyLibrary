import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase/config';
import axios from 'axios';
import { apiUrl } from '../lib/apiConfig';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phone?: string | null;
  role: string;
  studentId?: string; // Optional student display ID
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  studentLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserContext: (updates: Partial<User>) => void;
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

const mapFirebaseUser = (firebaseUser: FirebaseUser): User => {
  let cachedPhoto = null;
  let cachedName = null;
  let cachedPhone = null;

  try {
    const stored = localStorage.getItem('galaxylibrary_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      cachedPhoto = parsed.photoURL;
      cachedName = parsed.displayName;
      cachedPhone = parsed.phone;
    }
  } catch (e) {}

  try {
    const storedAdmin = localStorage.getItem('galaxylibrary_admin_profile');
    if (storedAdmin) {
      const parsedAdmin = JSON.parse(storedAdmin);
      if (parsedAdmin.displayName) cachedName = parsedAdmin.displayName;
      if (parsedAdmin.photoURL) cachedPhoto = parsedAdmin.photoURL;
      if (parsedAdmin.phone) cachedPhone = parsedAdmin.phone;
    }
  } catch (e) {}

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName || cachedName || 'Admin',
    photoURL: firebaseUser.photoURL || cachedPhoto || null,
    phone: cachedPhone || null,
    role: 'admin'
  };
};

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

        // Fetch remote admin profile from MongoDB to ensure consistency
        axios.get(apiUrl('/api/admin/profile'), {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        }).then((res) => {
          const p = res.data?.profile || res.data;
          if (p) {
            try {
              localStorage.setItem('galaxylibrary_admin_profile', JSON.stringify(p));
            } catch (e) {}
            setUser(prev => {
              if (!prev || prev.role !== 'admin') return prev;
              const updated = {
                ...prev,
                displayName: p.displayName || prev.displayName,
                photoURL: p.photoURL || prev.photoURL,
                phone: p.phone || prev.phone
              };
              saveAppUser(updated);
              return updated;
            });
          }
        }).catch(() => {});
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

  // Auto-logout after 3 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    let inactivityTimer: number;

    const resetTimer = () => {
      window.clearTimeout(inactivityTimer);
      // 3 minutes = 180000 milliseconds
      inactivityTimer = window.setTimeout(() => {
        logout();
      }, 180000);
    };

    resetTimer();

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      window.clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]); // Only re-run when user state changes

  const updateUserContext = (updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      saveAppUser(updated);
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, studentLogin, logout, updateUserContext }}>
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
