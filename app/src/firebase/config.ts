import { initializeApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyB0hdihOzFZmF7gBk7QYG62tV6SCgVR3ec',
  authDomain: 'galaxy-library-bcebe.firebaseapp.com',
  projectId: 'galaxy-library-bcebe',
  storageBucket: 'galaxy-library-bcebe.firebasestorage.app',
  messagingSenderId: '456542646786',
  appId: '1:456542646786:web:1e794dde90402f0ee92d1b',
  measurementId: 'G-6GGGHEY1MP',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let analytics: Analytics | null = null;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (error) {
  console.warn('Firebase Analytics could not be initialized:', error);
}

export { app, analytics, auth };
export default firebaseConfig;
