// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

export default app;