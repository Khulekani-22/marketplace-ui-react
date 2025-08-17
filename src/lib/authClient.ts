import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onIdTokenChanged,
} from "firebase/auth";

export async function signInEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return await cred.user.getIdToken(); // <-- your JWT
}

export async function signInGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return await cred.user.getIdToken(); // <-- your JWT
}

// keep token fresh in memory for API calls
let currentToken: string | null = null;
onIdTokenChanged(auth, async (user) => {
  currentToken = user ? await user.getIdToken() : null;
});
export function getBearer() { return currentToken ? `Bearer ${currentToken}` : ""; }
