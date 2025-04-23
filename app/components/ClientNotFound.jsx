"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ClientNotFound() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-red-600">404 - Page Not Found</h1>
      <p className="mt-2 text-gray-600">Redirecting you to the homepage...</p>
    </div>
  );
}
