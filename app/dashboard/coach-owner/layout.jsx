// app/dashboard/coach-owner/layout.jsx
import "../styles/coach-owner.css";
import CoachOwnerNavbar from "../../../components/CoachOwnerNavbar"; // New navbar component

export default function CoachOwnerLayout({ children }) {
  return (
    <div>
      <CoachOwnerNavbar />
      <main>{children}</main>
    </div>
  );
}
