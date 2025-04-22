// app/components/BodyWrapper.jsx
"use client";

import { usePathname } from "next/navigation";
import "@/styles/globals.css"; // Import global styles

export default function BodyWrapper({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isCoachOrOwnerDashboard =
    pathname === "/dashboard/coach" || pathname === "/dashboard/owner";

  const backgroundStyle = isCoachOrOwnerDashboard
    ? { backgroundColor: "white" }
    : {
        background: isHome
          ? "linear-gradient(to bottom right, rgba(34, 85, 34, 0.6), rgba(255, 255, 255, 1))"
          : "linear-gradient(to bottom right, rgba(34, 85, 34, 0.6), rgba(255, 255, 255, 0.5))",
        zIndex: 1,
      };

  return (
    <div className="relative min-h-screen">
      {!isCoachOrOwnerDashboard && (
        <div
          className="absolute inset-0 bg-[url('/background.png')] bg-center bg-cover bg-no-repeat"
          style={{ zIndex: 0 }}
        />
      )}
      <div className="absolute inset-0" style={backgroundStyle} />
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}
