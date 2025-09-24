import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// your credentials (already working)
const firebaseConfig = {
  apiKey: "AIzaSyDFzUfv1enm5_lucOMz4tWh26GJfIG751M",
  authDomain: "sloane-hub.firebaseapp.com",
  projectId: "sloane-hub",
  storageBucket: "sloane-hub.firebasestorage.app",
  messagingSenderId: "664957061898",
  appId: "1:664957061898:web:71a4e19471132ef7ba88f3",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
