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
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/core@6.1.8/index.global.min.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid@6.1.8/index.global.min.css"
        />
      </head>
      <body
        className="min-h-screen bg-white text-black"
        suppressHydrationWarning
      >
        <UserProvider>
          <PaymentProvider>{children}</PaymentProvider>
        </UserProvider>
      </body>
    </html>
  );
}
