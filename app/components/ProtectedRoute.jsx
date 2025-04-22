"use client";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  allowedRoles = [],
  redirectTo = "/auth/login",
  children,
}) {
  const { role, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role && !allowedRoles.includes(role)) {
      router.replace(redirectTo);
    }
  }, [loading, role, router, allowedRoles]);

  if (loading) return <div>Loading...</div>;

  return role && allowedRoles.includes(role) ? children : null;
}
