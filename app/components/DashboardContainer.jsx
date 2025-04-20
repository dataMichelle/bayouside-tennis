"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import CoachOwnerNavbar from "./CoachOwnerNavbar";
import Sidebar from "./Sidebar";

export default function DashboardContainer({ children }) {
  const { role, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !role) {
      router.push("/auth/login");
    }
  }, [loading, role, router]);

  if (loading || !role) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <CoachOwnerNavbar role={role} />
      <div className="flex flex-1">
        <Sidebar role={role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
