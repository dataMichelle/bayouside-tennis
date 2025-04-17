"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import CoachOwnerNavbar from "./CoachOwnerNavbar";
import Sidebar from "./Sidebar";

export default function DashboardContainer({ children }) {
  const { role, loading } = useUser();
  const router = useRouter();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!role) {
    router.push("/auth/login");
    return null;
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
