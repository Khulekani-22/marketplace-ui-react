/**
 * Authentication helpers for Marketplace SDK
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, Auth, UserCredential } from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export class FirebaseAuthHelper {
  private app: FirebaseApp;
  private auth: Auth;

  constructor(config: FirebaseConfig) {
    this.app = initializeApp(config);
    this.auth = getAuth(this.app);
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Get current ID token
   */
  async getIdToken(): Promise<string | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    return this.auth.signOut();
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.auth.currentUser;
  }
}

export interface ApiKeyAuthHelper {
  apiKey: string;
}

export function createApiKeyAuth(apiKey: string): ApiKeyAuthHelper {
  return { apiKey };
}
