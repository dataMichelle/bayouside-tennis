// app/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ Your config stays the same
const firebaseConfig = {
  apiKey: "AIzaSyBWHQ8n86moQn1yfOfURUvif0RUMMsCMkw",
  authDomain: "bayousidetennis.firebaseapp.com",
  projectId: "bayousidetennis",
  storageBucket: "bayousidetennis.firebasestorage.app",
  messagingSenderId: "1094775154661",
  appId: "1:1094775154661:web:e4d05989a431f401eef10c",
  measurementId: "G-W2J30P3B1E",
};

// ✅ Initialize Firebase app
const app = initializeApp(firebaseConfig);

// ✅ Export auth and set persistence (AFTER defining it)
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .then(() => {})
  .catch((err) => {
    console.error("Failed to set Firebase auth persistence:", err);
  });

// ✅ Export other utilities
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
