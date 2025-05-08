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
        const fetchUserData = async (retries = 3, delay = 1000) => {
          try {
            const token = await firebaseUser.getIdToken(true);
            const res = await fetch("/api/users", {
              headers: { Authorization: `Bearer ${token}` },
            });

            let errorData;
            if (!res.ok) {
              const contentType = res.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                errorData = await res.json();
              } else {
                errorData = {
                  error: (await res.text()) || "Non-JSON response",
                };
              }
              console.error("UserContext - API response error:", {
                errorData,
                status: res.status,
                uid: firebaseUser.uid,
                contentType,
              });
              throw new Error(
                `Failed to fetch user data: ${res.status} ${
                  errorData.error || "Unknown error"
                }`
              );
            }

            const data = await res.json();
            setUserData({
              id: data._id,
              email: firebaseUser.email,
              role: data.role || "player",
            });
            setRole(data.role || "player");
            localStorage.setItem("userRole", data.role || "player");
            console.log("User data fetched successfully:", {
              uid: firebaseUser.uid,
              role: data.role,
            });
          } catch (err) {
            console.error("UserContext - Fetch user data failed:", {
              message: err.message || "Unknown error",
              stack: err.stack || "No stack",
              code: err.code || "No code",
              name: err.name || "Unknown",
              uid: firebaseUser.uid,
              retries,
            });
            if (retries > 0 && err.message.includes("User not found")) {
              console.log(`Retrying fetch (${retries} attempts left)...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
              return fetchUserData(retries - 1, delay * 2);
            }
            setUserData(null);
            setRole("player");
            localStorage.setItem("userRole", "player");
          }
        };

        await fetchUserData();
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
