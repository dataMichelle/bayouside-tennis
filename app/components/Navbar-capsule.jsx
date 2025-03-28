"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { path: "/", label: "Home", public: true },
  { path: "/coaches", label: "Coaches", public: true, roles: ["player"] },
  {
    path: "/dashboard",
    label: "Dashboard",
    public: false,
    roles: ["owner", "coach"],
  },
  { path: "/booking", label: "Book Court", public: true, roles: ["player"] },
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
    <nav className="bg-swamp-100 fixed top-4 left-1/2 transform -translate-x-1/2 max-w-3xl w-full h-16 z-50 shadow-lg rounded-full flex items-center justify-center px-2">
      <div className="flex items-center space-x-2">
        <Link
          href="/"
          className="text-xl font-bold text-swamp-600 hover:text-swamp-700 transition-colors"
        >
          Bayouside Tennis
        </Link>
        <div className="hidden md:flex items-center space-x-2">
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
                className="text-black font-medium text-lg hover:text-gray-700 transition-colors"
              >
                {link.label}
              </Link>
            ) : null;
          })}
        </div>
      </div>
    </nav>
  );
}
