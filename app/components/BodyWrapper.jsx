// app/components/BodyWrapper.jsx
"use client";

import { usePathname } from "next/navigation";

export default function BodyWrapper({ children }) {
  const pathname = usePathname();

  // Define background styles based on route
  const getBackground = () => {
    switch (pathname) {
      case "/":
        return "bg-gradient-to-r from-blue-500 to-green-500";
      case "/dashboard":
        return "bg-gray-100";
      case "/login":
        return "bg-yellow-200";
      default:
        return "bg-white";
    }
  };

  return <div className={`${getBackground()} min-h-screen`}>{children}</div>;
}
