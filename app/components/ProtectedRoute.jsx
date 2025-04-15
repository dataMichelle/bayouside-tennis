// components/ProtectedRoute.jsx
"use client";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ allowedRoles, redirectTo = "/" }) {
  const { role, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !allowedRoles.includes(role)) {
      router.replace(redirectTo);
    }
  }, [loading, role, router]);

  return null;
}
