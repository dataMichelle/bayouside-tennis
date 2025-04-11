// app/player/layout.jsx
import BodyWrapper from "../components/BodyWrapper";
import Navbar from "../components/Navbar";

export default function PlayerLayout({ children }) {
  return (
    <BodyWrapper>
      <Navbar />
      {children}
    </BodyWrapper>
  );
}
