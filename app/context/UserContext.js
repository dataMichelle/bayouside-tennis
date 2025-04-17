// app/context/UserContext.js
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          console.log(
            "UserContext - Fetching role for UID:",
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
          const fetchedRole = data.role || "player";
          console.log("UserContext - Role fetched:", fetchedRole);

          setRole(fetchedRole);
          localStorage.setItem("userRole", fetchedRole);
        } catch (err) {
          console.error("UserContext - Fetch role failed:", err.message);
          setRole("player");
          localStorage.setItem("userRole", "player");
        }
      } else {
        setRole(null);
        localStorage.removeItem("userRole");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, role, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
