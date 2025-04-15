"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUser } from "@/context/UserContext";

const navLinks = [
  { path: "/", label: "Home", public: true },
  { path: "/coaches", label: "Coaches", public: true, roles: ["player"] },
  {
    path: "/players/info",
    label: "Player Info",
    public: true,
    roles: ["player"],
  },
  {
    path: "/players/reservations",
    label: "Reservations",
    public: false,
    roles: ["player"],
  },
  {
    path: "/dashboard",
    label: "Dashboard",
    public: false,
    roles: ["coach", "owner"],
  },
  { path: "/booking", label: "Book Court", public: true, roles: ["player"] },
  { path: "/about", label: "About Us", public: true },
  { path: "/signup", label: "Sign Up", public: true },
];

export default function Navbar() {
  const router = useRouter();
  const { role, user, loading } = useUser();

  if (loading) return <div className="p-4">Loading...</div>;

  const isLoggedIn = !!user;

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
                  router.push("/");
                })
                .catch((error) => {
                  console.error("Logout error:", error);
                });
            },
          },
        ]
      : [{ path: "/login", label: "Log In", public: true }]),
  ];

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
            const shouldShow =
              (link.public && (!link.roles || !isLoggedIn)) ||
              (isLoggedIn && (!link.roles || link.roles.includes(role)));

            const linkPath =
              link.label === "Dashboard" && isLoggedIn && role
                ? `/dashboard/${role}`
                : link.path;

            return shouldShow ? (
              <Link
                key={link.label}
                href={linkPath}
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
