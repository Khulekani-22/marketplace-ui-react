// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M",
  authDomain: "sloane-hub.firebaseapp.com",
  projectId: "sloane-hub",
  storageBucket: "sloane-hub.firebasestorage.app",
  messagingSenderId: "664957061898",
  appId: "1:664957061898:web:71a4e19471132ef7ba88f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);

// Note: Using production Firestore, not emulator
// Emulator connection disabled for production Firebase integration

export default app;