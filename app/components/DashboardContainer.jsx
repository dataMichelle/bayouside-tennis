"use client";

import useRequireRole from "@/hooks/useRequireRole";
import CoachOwnerNavbar from "./CoachOwnerNavbar";
import Sidebar from "./Sidebar";

export default function DashboardContainer({ children }) {
  const { role, loading, authorized } = useRequireRole(["coach", "owner"]);

  if (loading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <CoachOwnerNavbar role={role} />
      <div className="flex flex-1">
        <Sidebar role={role} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
