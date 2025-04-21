"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import PageContainer from "@/components/PageContainer";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(
          "Login - JSON Parse Error:",
          jsonError.message,
          "Raw Response:",
          responseText
        );
        throw new Error("Invalid JSON response from server");
      }

      if (!response.ok) {
        throw new Error(
          data.error || `API request failed with status ${response.status}`
        );
      }

      const userCredential = await signInWithCustomToken(auth, data.token);

      localStorage.setItem("userRole", data.role);

      await new Promise((resolve) => setTimeout(resolve, 100));

      let callbackUrl;
      switch (data.role) {
        case "player":
          callbackUrl = "/players/reservations";
          break;
        case "coach":
          callbackUrl = "/dashboard/coach";
          break;
        case "owner":
          callbackUrl = "/dashboard/owner";
          break;
        default:
          callbackUrl = "/dashboard";
          console.warn("Login - Unknown role:", data.role);
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err.message || "An unknown error occurred");
    }
  };

  return (
    <PageContainer title="Log In">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // Fixed: setPassword instead of setEmail
            required
            className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <button
          type="submit"
          className="w-full px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors shadow-md"
        >
          Sign In
        </button>
      </form>
      <p className="mt-4 text-center text-neutrals-600 dark:text-neutrals-300">
        Don’t have an account?{" "}
        <Link
          href="/signup"
          className="text-primary-700 dark:text-primary-300 hover:underline"
        >
          Sign Up
        </Link>
      </p>
    </PageContainer>
  );
}
