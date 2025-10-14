/**
 * Utility to ensure Firebase Auth is initialized before making API calls
 * This prevents 401 errors during app startup when components mount before auth completes
 */

import { auth } from "../firebase.js";

let authReadyPromise: Promise<void> | null = null;

/**
 * Returns a promise that resolves when Firebase auth has initialized
 * Safe to call multiple times - returns the same promise instance
 */
export function waitForAuth(): Promise<void> {
  if (authReadyPromise) return authReadyPromise;

  authReadyPromise = new Promise((resolve) => {
    // If already signed in, resolve immediately
    if (auth.currentUser) {
      resolve();
      return;
    }

    // Otherwise wait for first auth state change
    const unsubscribe = auth.onAuthStateChanged(() => {
      unsubscribe();
      resolve();
    });

    // Timeout after 5 seconds to prevent hanging
    setTimeout(() => {
      unsubscribe();
      resolve();
    }, 5000);
  });

  return authReadyPromise;
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return !!auth.currentUser;
}

/**
 * Reset the auth ready promise (useful for testing or after sign-out)
 */
export function resetAuthReady(): void {
  authReadyPromise = null;
}
