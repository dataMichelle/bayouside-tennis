// app/layout.jsx
import "./styles/globals.css";
import { PaymentProvider } from "./context/PaymentContext";
import { UserProvider } from "./context/UserContext";

export const metadata = {
  title: "Bayouside Tennis",
  description: "Book tennis courts and lessons with ease.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-black" suppressHydrationWarning>
        <UserProvider>
          <PaymentProvider>{children}</PaymentProvider>
        </UserProvider>
      </body>
    </html>
  );
}
