import "./styles/globals.css";
import { PaymentProvider } from "./context/PaymentContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PaymentProvider>{children}</PaymentProvider>
      </body>
    </html>
  );
}
