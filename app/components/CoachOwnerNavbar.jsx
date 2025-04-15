"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function CoachOwnerNavbar() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const isLoggedIn = !!user;

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        router.push("/");
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <ul className="flex justify-center space-x-5">
        <li>
          <Link href="/">Home</Link>
        </li>
        {isLoggedIn && (
          <li>
            <button
              onClick={handleLogout}
              className="text-white hover:text-gray-400"
            >
              Logout
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
