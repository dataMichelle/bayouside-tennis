"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/context/UserContext";
import { getNavLinksForRole } from "@/utils/navLinks";

export default function Navbar() {
  const router = useRouter();
  const { firebaseUser, userData, role, loading } = useUser();

  // Use firebaseUser to determine logged-in state
  const isLoggedIn = !!firebaseUser;
  const navRole = userData?.role || role || "player"; // Fallback to role or "player"
  const links = getNavLinksForRole(navRole, isLoggedIn);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    signOut(auth)
      .then(() => {
        router.push("/");
      })
      .catch((error) => {
        console.error("Navbar - Logout error:", error.message);
      });
  };

  if (loading) {
    return (
      <header className="relative z-[100]">
        <motion.div
          className="fixed top-4 left-1/2 -translate-x-1/2 h-[3.5rem] max-w-4xl rounded-full border border-swamp-400 border-opacity-40 bg-taupe-200 bg-opacity-80 shadow-[0px_8px_16px_rgba(34,85,34,1)] backdrop-blur-[0.5rem] flex items-center justify-center px-6 font-nunito"
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-black text-sm font-nunito">Loading...</div>
        </motion.div>
      </header>
    );
  }

  return (
    <header className="relative z-[100]">
      <motion.div
        className="fixed top-4 left-1/2 -translate-x-1/2 h-[3.5rem] max-w-4xl rounded-full border border-swamp-400 border-opacity-40 bg-taupe-200 bg-opacity-80 shadow-[0px_8px_16px_rgba(34,85,34,1)] backdrop-blur-[0.5rem] flex items-center justify-center px-6 font-nunito animate-jiggle"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="flex flex-row flex-nowrap items-center space-x-4">
          {links.map((link) =>
            link.label === "Log Out" ? (
              <button
                key={link.label}
                onClick={handleLogout}
                className="text-black text-sm font-nunito hover:text-orange-700 whitespace-nowrap"
              >
                {link.label}
              </button>
            ) : (
              <Link
                key={link.label}
                href={link.path}
                className="text-black text-sm font-nunito hover:text-orange-700 whitespace-nowrap"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>
      </motion.div>
    </header>
  );
}
