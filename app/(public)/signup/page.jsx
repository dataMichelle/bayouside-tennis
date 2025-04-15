"use client";

import { useState } from "react";
import { auth } from "../../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import PageContainer from "@/components/PageContainer";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("player");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          uid: userCredential.user.uid,
          role,
        }),
      });

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <PageContainer title="Sign Up">
      <form onSubmit={handleSignup} className="space-y-6 max-w-md mx-auto">
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
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-1"
          >
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="player">Player</option>
            <option value="coach">Coach</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}
        {success && (
          <p className="text-green-600 text-center">Signup successful!</p>
        )}

        <button
          type="submit"
          className="w-full px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors shadow-md"
        >
          Sign Up
        </button>

        <p className="mt-4 text-center text-neutrals-600 dark:text-neutrals-300">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary-700 dark:text-primary-300 hover:underline"
          >
            Log In
          </Link>
        </p>
      </form>
    </PageContainer>
  );
}
