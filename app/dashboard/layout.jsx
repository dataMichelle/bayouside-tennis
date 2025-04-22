// app/dashboard/layout.jsx (server)
import DashboardContainer from "@/components/DashboardContainer";
import "@/styles/dashboard.css";

export default function DashboardLayout({ children }) {
  return <DashboardContainer>{children}</DashboardContainer>;
}
