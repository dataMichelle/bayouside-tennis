"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function BodyWrapper({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    const pageClass = pathname === "/" ? "home" : pathname.replace("/", "");

    // Set the body class dynamically
    document.body.className = pageClass;
  }, [pathname]);

  return <>{children}</>;
}
