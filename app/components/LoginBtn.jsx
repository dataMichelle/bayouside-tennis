// src/components/LoginBtn.jsx
import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../lib/firebase";
import { useRouter } from "next/router";

const LoginBtn = () => {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Assuming the user role is stored in Firestore
      const role = user?.role; // This is an example, you may need to fetch from Firestore

      if (role) {
        // Redirect to the appropriate role-based dashboard
        router.push(`/dashboard/${role}`);
      }
    } catch (error) {
      console.error("Error signing in: ", error.message);
    }
  };

  return <button onClick={handleLogin}>Sign in with Google</button>;
};

export default LoginBtn;
