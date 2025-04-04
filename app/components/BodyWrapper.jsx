"use client";

import { usePathname } from "next/navigation";

export default function BodyWrapper({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const gradient = isHome
    ? "linear-gradient(to bottom right, rgba(34, 85, 34, 0.6), rgba(255, 255, 255, 1))"
    : "linear-gradient(to bottom right, rgba(34, 85, 34, 0.6), rgba(255, 255, 255, 0.5))";

  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 bg-[url('/background.png')] bg-center bg-cover bg-no-repeat"
        style={{ zIndex: 0 }}
      />
      <div
        className="absolute inset-0"
        style={{ background: gradient, zIndex: 1 }}
      />
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
