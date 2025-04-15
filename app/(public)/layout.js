import Navbar from "../components/Navbar";
import BodyWrapper from "../components/BodyWrapper";

export default function PublicLayout({ children }) {
  return (
    <BodyWrapper>
      <Navbar />
      <main className="public-main">{children}</main>
    </BodyWrapper>
  );
}
