// src/components/LogoutButton.jsx
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const LogoutButton = () => {
  const handleLogout = async () => {
    await signOut(auth);
    // After signing out, redirect to login or home
    window.location.href = "/login";
  };

  return <button onClick={handleLogout}>Log Out</button>;
};

export default LogoutButton;
