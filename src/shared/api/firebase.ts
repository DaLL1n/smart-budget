import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel
} from 'firebase/firestore';
import firebaseConfigData from '../../../firebase-applet-config.json';

// Suppress non-critical Firestore offline connection retry logs in sandbox preview
setLogLevel('error');

const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore with resilient forced long polling and tab caching
function getResilientFirestore() {
  const customDbId = firebaseConfigData.firestoreDatabaseId && firebaseConfigData.firestoreDatabaseId !== '(default)'
    ? firebaseConfigData.firestoreDatabaseId
    : undefined;

  try {
    const settings = {
      experimentalForceLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    };

    if (customDbId) {
      return initializeFirestore(app, settings, customDbId);
    }
    return initializeFirestore(app, settings);
  } catch {
    if (customDbId) {
      return getFirestore(app, customDbId);
    }
    return getFirestore(app);
  }
}

export const db = getResilientFirestore();
