// components/UserNav.jsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/context/UserContext";
import { roleLinks, authLinks } from "@/utils/navLinks";
import { getUserNavLinks } from "@/utils/navLinks";

export default function UserNav() {
  const router = useRouter();
  const { firebaseUser, userData, role, loading } = useUser();

  const isLoggedIn = !!firebaseUser;
  const userRole = userData?.role || role || "player";

  const links = useMemo(() => {
    if (loading) return getUserNavLinks(); // fallback defaults to "player" + not logged in
    return getUserNavLinks(userRole, isLoggedIn);
  }, [loading, userRole, isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    signOut(auth)
      .then(() => router.push("/"))
      .catch((err) => console.error("Logout error:", err.message));
  };

  return (
    <nav className="flex space-x-4">
      {links.map((link) =>
        link.onClick ? (
          <button
            key={link.label}
            onClick={handleLogout}
            className="text-black text-sm hover:text-orange-700"
          >
            {link.label}
          </button>
        ) : (
          <Link
            key={link.label}
            href={link.path}
            className="text-black text-sm hover:text-orange-700"
          >
            {link.label}
          </Link>
        )
      )}
    </nav>
  );
}
