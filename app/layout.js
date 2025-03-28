import "./globals.css";
import Navbar from "./components/Navbar";
import AuthSessionProvider from "./SessionProvider";
import BodyWrapper from "./components/BodyWrapper"; // Import the Client Component

export const metadata = {
  title: "Bayouside Tennis",
  description: "Book a tennis court or lessons",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthSessionProvider>
          <BodyWrapper>
            <Navbar />
            <div style={{ height: "64px" }}></div>
            {children}
          </BodyWrapper>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
