// app/dashboard/layout.jsx (server)
import DashboardContainer from "@/components/DashboardContainer";
import ProtectedRoute from "@/components/ProtectedRoute";
import "@/styles/dashboard.css";

export default function DashboardLayout({ children }) {
  return (
    <ProtectedRoute allowedRoles={["coach", "owner"]} redirectTo="/auth/login">
      <DashboardContainer>{children}</DashboardContainer>
    </ProtectedRoute>
  );
}
