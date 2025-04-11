// app/layout.jsx
import "./styles/globals.css"; // Global styles
import BodyWrapper from "./components/BodyWrapper";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BodyWrapper>{children}</BodyWrapper>
      </body>
    </html>
  );
}
