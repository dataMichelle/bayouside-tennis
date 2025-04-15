import "./styles/globals.css";
import { PaymentProvider } from "./context/PaymentContext";
import { UserProvider } from "./context/UserContext";

export default function RootLayout({ children }) {
  return (
    <html>
      <body className="min-h-screen" suppressHydrationWarning>
        <UserProvider>
          <PaymentProvider>{children}</PaymentProvider>
        </UserProvider>
      </body>
    </html>
  );
}
