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
    <nav className="bg-swamp-200 dark:bg-neutrals-900 fixed top-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-3xl h-16 z-50 shadow-lg rounded-full px-4 py-2 flex items-center justify-between">
      {/* <Link
        href="/"
        className="text-2xl font-bold font-chewy transition-colors"
      >
        <span className="text-taupe-100">Bayouside</span>{" "}
        <span className="text-teal-300">Tennis</span>
      </Link> */}
      <div className="hidden md:flex flex-1 justify-center space-x-4">
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
              className="relative text-black font-medium text-lg hover:text-gray-700 transition-colors duration-200 after:content-[''] after:absolute after:w-0 after:h-[2px] after:bg-yellow-500 after:left-[50%] after:-translate-x-1/2 after:bottom-[-4px] after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </Link>
          ) : null;
        })}
      </div>
      <div className="md:hidden mt-4 flex flex-col space-y-4 text-center">
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
              className="text-black font-medium text-lg hover:text-gray-700 transition-colors py-2"
            >
              {link.label}
            </Link>
          ) : null;
        })}
      </div>
    </nav>
  );
}
