// app/dashboard/player/layout.jsx
import BodyWrapper from "../../../components/BodyWrapper";
import Navbar from "../../../components/Navbar";

export default function PlayerDashboardLayout({ children }) {
  return (
    <BodyWrapper>
      <Navbar />
      {children}
    </BodyWrapper>
  );
}
