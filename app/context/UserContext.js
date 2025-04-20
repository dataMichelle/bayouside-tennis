"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          console.log(
            "UserContext - Fetching user data for UID:",
            firebaseUser.uid,
            "Email:",
            firebaseUser.email
          );
          const res = await fetch("/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            console.error("UserContext - API response:", await res.text());
            throw new Error(`API error: ${res.status}`);
          }
          const data = await res.json();
          console.log("UserContext - User data fetched:", {
            id: data._id,
            role: data.role,
          });

          setUserData({
            id: data._id, // MongoDB _id
            email: firebaseUser.email,
            role: data.role || "player",
          });
          setRole(data.role || "player");
          localStorage.setItem("userRole", data.role || "player");
        } catch (err) {
          console.error("UserContext - Fetch user data failed:", err.message);
          setUserData(null);
          setRole("player");
          localStorage.setItem("userRole", "player");
        }
      } else {
        setUserData(null);
        setRole(null);
        localStorage.removeItem("userRole");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ firebaseUser, userData, role, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
