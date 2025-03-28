"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const navLinks = [
  { path: "/", label: "Home", public: true },
  { path: "/coaches", label: "Coaches", public: true, roles: ["player"] },
  { path: "/players", label: "Players", public: true, roles: ["player"] },
  {
    path: "/dashboard",
    label: "Dashboard",
    public: false,
    roles: ["owner", "coach"],
  },
  { path: "/booking", label: "Book Court", public: true, roles: ["player"] },
  { path: "/about", label: "About Us", public: true },
  { path: "/signup", label: "Sign Up", public: true },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const isLoggedIn = !!session;
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      setRenderKey((prev) => prev + 1);
    }
  }, [session, status]);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  const linksWithAuth = [
    ...navLinks.filter((link) => link.label !== "Sign Up" || !isLoggedIn),
    ...(isLoggedIn
      ? [
          {
            path: "#",
            label: "Sign Out",
            public: false,
            onClick: () => signOut({ callbackUrl: "/" }),
          },
        ]
      : [{ path: "/login", label: "Log In", public: true }]),
  ];

  return (
    <header className="z-100 relative">
      <motion.div
        className="fixed top-4 left-1/2 -translate-x-1/2 h-[3.5rem] max-w-3xl rounded-full border border-swamp-400 border-opacity-40 bg-gradient-to-b from-taupe-100 to-taupe-300 bg-opacity-80 shadow-[0_8px_16px_rgba(34,85,34,0.6),inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)] backdrop-blur-[0.5rem] flex items-center justify-center px-6 font-nunito animate-jiggle"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <nav className="flex items-center space-x-6">
          {linksWithAuth.map((link) => {
            const shouldShow =
              link.label === "Sign Out"
                ? isLoggedIn
                : link.public ||
                  (isLoggedIn &&
                    link.roles &&
                    link.roles.includes(session?.user?.role));
            return shouldShow ? (
              <Link
                key={link.path}
                href={link.path}
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
