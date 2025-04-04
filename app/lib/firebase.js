// app/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBWHQ8n86moQn1yfOfURUvif0RUMMsCMkw",
  authDomain: "bayousidetennis.firebaseapp.com",
  projectId: "bayousidetennis",
  storageBucket: "bayousidetennis.firebasestorage.app",
  messagingSenderId: "1094775154661",
  appId: "1:1094775154661:web:e4d05989a431f401eef10c",
  measurementId: "G-W2J30P3B1E",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
