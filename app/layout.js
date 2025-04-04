// app/layout.jsx
import "./globals.css";
import Navbar from "./components/Navbar";
import BodyWrapper from "./components/BodyWrapper";

export const metadata = {
  title: "Bayouside Tennis",
  description: "Book a tennis court or lessons",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen" suppressHydrationWarning>
        <BodyWrapper>
          <Navbar />
          <div style={{ height: "64px" }}></div>
          {children}
        </BodyWrapper>
      </body>
    </html>
  );
}
