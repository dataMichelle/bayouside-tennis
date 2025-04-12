// app/dashboard/layout.jsx

import CoachOwnerNavbar from "../components/CoachOwnerNavbar";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <CoachOwnerNavbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
