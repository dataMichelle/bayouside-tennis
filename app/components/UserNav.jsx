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

export default function UserNav({ closeMenu }) {
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
    <nav className="flex flex-col sm:flex-row gap-2 sm:space-x-4 whitespace-nowrap">
      {links.map((link) =>
        link.onClick ? (
          <button
            key={link.label}
            onClick={() => {
              closeMenu();
              handleLogout();
            }}
            className="text-black text-sm hover:text-orange-700 text-left"
          >
            {link.label}
          </button>
        ) : (
          <Link
            key={link.label}
            href={link.path}
            onClick={closeMenu}
            className="text-black text-sm hover:text-orange-700 hover:bg-taupe-300 rounded-md px-2 py-1"
          >
            {link.label}
          </Link>
        )
      )}
    </nav>
  );
}
