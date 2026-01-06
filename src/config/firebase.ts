import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug: Log config to verify env vars are loaded
console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey ? '✓ Loaded' : '✗ Missing',
  projectId: firebaseConfig.projectId || '✗ Missing',
  appId: firebaseConfig.appId ? '✓ Loaded' : '✗ Missing'
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Kinde handles authentication)
export const db = getFirestore(app);

// Connect to Firestore emulator in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  console.log('🔧 Connecting to Firestore Emulator...');
  connectFirestoreEmulator(db, 'localhost', 8081);
  console.log('✅ Connected to Firestore Emulator');
}

export default app;
