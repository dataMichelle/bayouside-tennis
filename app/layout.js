import "./styles/globals.css";
import { PaymentProvider } from "./context/PaymentContext";

export default function RootLayout({ children }) {
  return (
    <html>
      <body className="min-h-screen" suppressHydrationWarning>
        <PaymentProvider>
          {children} {/* No navbar here */}
        </PaymentProvider>
      </body>
    </html>
  );
}
