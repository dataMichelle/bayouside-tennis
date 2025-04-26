"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/context/UserContext";
import { getUserNavLinks } from "@/utils/navLinks";

export default function UserNav({ closeMenu, isMobile }) {
  const router = useRouter();
  const { firebaseUser, userData, role, loading } = useUser();

  const isLoggedIn = !!firebaseUser;
  const userRole = userData?.role || role || "player";

  const links = useMemo(() => {
    if (loading) return getUserNavLinks(); // Fallback defaults to "player" + not logged in
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
              if (typeof closeMenu === "function") {
                closeMenu();
              } else if (process.env.NODE_ENV === "development") {
                console.warn(
                  "UserNav: closeMenu is not a function. Ensure the parent component provides a valid closeMenu prop for mobile menu functionality.",
                  { closeMenu, isMobile }
                );
              }
              handleLogout();
            }}
            className="text-black text-sm text-left"
          >
            {link.label}
          </button>
        ) : (
          <Link
            key={link.label}
            href={link.path}
            onClick={() => {
              if (typeof closeMenu === "function") {
                closeMenu();
              }
            }}
            className={`text-black text-sm rounded-md px-2 py-1 ${
              isMobile
                ? "hover:bg-taupe-400 hover:text-white"
                : "hover:text-black"
            }`}
          >
            {link.label}
          </Link>
        )
      )}
    </nav>
  );
}
