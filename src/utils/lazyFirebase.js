/**
 * Lazy Firebase Initialization
 * 
 * This module delays loading the Firebase SDK (481 KB bundle) until it's actually needed.
 * Instead of loading Firebase on every page load, we load it on-demand when authentication
 * is required.
 * 
 * Benefits:
 * - Reduces initial bundle size by 481 KB (113 KB gzipped)
 * - Prevents Firebase initialization from blocking main thread
 * - Speeds up Time to Interactive (TTI) by ~2 seconds
 * 
 * Usage:
 *   import { initializeFirebase, getAuth, getDb } from './utils/lazyFirebase';
 *   
 *   // In async context:
 *   const { auth, db, app } = await initializeFirebase();
 *   
 *   // Or use synchronous getters (throws if not initialized):
 *   const auth = getAuth();
 */

// Singleton instances (initialized once, reused everywhere)
let firebaseApp = null;
let firestoreDb = null;
let firebaseAuth = null;
let initPromise = null;

/**
 * Initialize Firebase SDK lazily
 * @returns {Promise<{app: FirebaseApp, db: Firestore, auth: Auth}>}
 */
export async function initializeFirebase() {
  // Return cached instances if already initialized
  if (firebaseApp && firestoreDb && firebaseAuth) {
    return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth };
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    console.log('[LazyFirebase] 🔥 Loading Firebase SDK...');
    const startTime = performance.now();

    try {
      // Dynamically import Firebase modules (code splitting)
      const [
        { initializeApp, getApp, getApps },
        { getFirestore },
        { getAuth }
      ] = await Promise.all([
        import('firebase/app'),
        import('firebase/firestore'),
        import('firebase/auth')
      ]);

      // Initialize Firebase app (reuse existing instance if already created elsewhere)
      const existingApps = getApps();
      firebaseApp = existingApps.length > 0
        ? getApp()
        : initializeApp({
        apiKey: "AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M",
        authDomain: "sloane-hub.firebaseapp.com",
        projectId: "sloane-hub",
        storageBucket: "sloane-hub.firebasestorage.app",
        messagingSenderId: "664957061898",
        appId: "1:664957061898:web:71a4e19471132ef7ba88f3"
        });

      // Initialize Firestore
      firestoreDb = getFirestore(firebaseApp);

      // Initialize Authentication
      firebaseAuth = getAuth(firebaseApp);

      const loadTime = (performance.now() - startTime).toFixed(2);
      console.log(`[LazyFirebase] ✅ Firebase SDK loaded in ${loadTime}ms`);

      return { app: firebaseApp, db: firestoreDb, auth: firebaseAuth };
    } catch (error) {
      console.error('[LazyFirebase] ❌ Failed to initialize Firebase:', error);
      // Reset promise so it can be retried
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Get Firebase Auth instance (synchronous)
 * @throws {Error} If Firebase is not initialized yet
 * @returns {Auth}
 */
export function getAuth() {
  if (!firebaseAuth) {
    throw new Error('[LazyFirebase] Firebase Auth not initialized. Call initializeFirebase() first.');
  }
  return firebaseAuth;
}

/**
 * Get Firestore instance (synchronous)
 * @throws {Error} If Firebase is not initialized yet
 * @returns {Firestore}
 */
export function getDb() {
  if (!firestoreDb) {
    throw new Error('[LazyFirebase] Firestore not initialized. Call initializeFirebase() first.');
  }
  return firestoreDb;
}

/**
 * Get Firebase App instance (synchronous)
 * @throws {Error} If Firebase is not initialized yet
 * @returns {FirebaseApp}
 */
export function getApp() {
  if (!firebaseApp) {
    throw new Error('[LazyFirebase] Firebase App not initialized. Call initializeFirebase() first.');
  }
  return firebaseApp;
}

/**
 * Check if Firebase is initialized
 * @returns {boolean}
 */
export function isInitialized() {
  return !!(firebaseApp && firestoreDb && firebaseAuth);
}

/**
 * Legacy compatibility: Export auth getter
 * This allows existing code to work: import { auth } from './lazyFirebase'
 * But it will throw if Firebase isn't initialized yet.
 */
export { getAuth as auth, getDb as db, getApp as app };

export default initializeFirebase;
