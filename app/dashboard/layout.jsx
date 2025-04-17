// app/dashboard/layout.jsx (server)
import DashboardContainer from "@/components/DashboardContainer";

export default function DashboardLayout({ children }) {
  return <DashboardContainer>{children}</DashboardContainer>;
}
