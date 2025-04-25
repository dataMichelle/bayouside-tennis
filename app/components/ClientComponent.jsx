// app/test-env/page.jsx
"use client";
import { useEffect } from "react";

export default function TestEnv() {
  useEffect(() => {
    console.log("ENV TEST", {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
    });
  }, []);

  return <div>Check console</div>;
}
