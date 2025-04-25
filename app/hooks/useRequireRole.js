"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function useRequireRole(
  allowedRoles = [],
  redirectTo = "/auth/login"
) {
  const router = useRouter();
  const { role, loading } = useUser();

  useEffect(() => {
    if (!loading && (role === null || !allowedRoles.includes(role))) {
      router.push(redirectTo);
    }
  }, [loading, role, allowedRoles, redirectTo, router]);

  return {
    role,
    loading,
    authorized: !loading && allowedRoles.includes(role),
  };
}
