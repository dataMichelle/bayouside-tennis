"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const navLinks = [
  { path: "/", label: "Home", public: true },
  { path: "/coaches", label: "Coaches", public: true, roles: ["player"] },
  { path: "/players", label: "Players", public: true, roles: ["player"] },
  { path: "/dashboard", label: "Dashboard", public: false },
  { path: "/booking", label: "Book Court", public: true, roles: ["player"] },
  { path: "/about", label: "About Us", public: true },
  { path: "/signup", label: "Sign Up", public: true },
];

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // Initialize as null
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("Navbar useEffect - Starting...");
    // Set initial role from localStorage client-side
    setRole(localStorage.getItem("userRole") || null);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("Auth State Changed - User:", firebaseUser?.uid || "none");
      setUser(firebaseUser);
      if (firebaseUser) {
        console.log("Firebase UID:", firebaseUser.uid);
        try {
          const idToken = await firebaseUser.getIdToken();
          console.log(
            "Navbar - Fetching role with token:",
            idToken.slice(0, 20) + "..."
          );
          const response = await fetch("/api/users", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          console.log("Navbar - API Response Status:", response.status);
          const responseText = await response.text();
          console.log("Navbar - API Response Text:", responseText);
          if (!response.ok) {
            throw new Error(`API error: ${response.status} - ${responseText}`);
          }
          const data = JSON.parse(responseText);
          const fetchedRole = data.role || "player";
          setRole(fetchedRole);
          localStorage.setItem("userRole", fetchedRole);
          console.log("Fetched Role from API:", fetchedRole);
        } catch (error) {
          console.error("Error fetching user role:", error);
          // Preserve localStorage role if API fails
        }
      } else {
        setRole(null);
        localStorage.removeItem("userRole");
        console.log("User logged out, role cleared");
      }
      setLoading(false);
      console.log("Navbar useEffect - Completed");
    });
    return () => {
      console.log("Navbar useEffect - Cleanup");
      unsubscribe();
    };
  }, []);

  if (loading) {
    console.log("Navbar - Rendering loading state");
    return <div className="p-4">Loading...</div>;
  }

  const isLoggedIn = !!user;
  console.log("Navbar - isLoggedIn:", isLoggedIn, "Role:", role);

  const linksWithAuth = [
    ...navLinks.filter((link) => link.label !== "Sign Up" || !isLoggedIn),
    ...(isLoggedIn
      ? [
          {
            path: "#",
            label: "Log Out",
            public: false,
            onClick: () => {
              localStorage.removeItem("userRole");
              signOut(auth)
                .then(() => {
                  console.log("Navbar - Logout successful, redirecting to /");
                  router.push("/");
                })
                .catch((error) => {
                  console.error("Navbar - Logout error:", error);
                });
            },
          },
        ]
      : [{ path: "/login", label: "Log In", public: true }]),
  ];

  console.log("Navbar - Rendering with role:", role);

  return (
    <header className="z-100 relative">
      <motion.div
        className="fixed top-4 left-1/2 -translate-x-1/2 h-[3.5rem] max-w-3xl rounded-full border border-swamp-400 border-opacity-40 bg-taupe-200 bg-opacity-80 shadow-[0px_8px_16px_rgba(34,85,34,1)] backdrop-blur-[0.5rem] flex items-center justify-center px-6 font-nunito animate-jiggle"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="flex items-center space-x-6">
          {linksWithAuth.map((link) => {
            const shouldShow = link.public || isLoggedIn;
            const dashboardPath =
              link.label === "Dashboard" && isLoggedIn && role
                ? `/dashboard/${role}`
                : link.path;
            console.log(
              `Link: ${link.label}, Path: ${dashboardPath}, Should Show: ${shouldShow}`
            );
            return shouldShow ? (
              <Link
                key={link.path}
                href={dashboardPath}
                onClick={link.onClick || null}
                className="text-black text-md font-nunito hover:text-orange-700"
              >
                {link.label}
              </Link>
            ) : null;
          })}
        </nav>
      </motion.div>
    </header>
  );
}
