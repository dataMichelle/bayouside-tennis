"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      router.push(session.user.role === "player" ? "/players" : "/dashboard");
    }
  }, [status, session, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const callbackUrl = role === "player" ? "/players" : "/dashboard";
    const result = await signIn("credentials", {
      email,
      password,
      role,
      callbackUrl,
      redirect: false,
    });

    if (result?.error) {
      setError(
        result.error === "CredentialsSignin"
          ? "Invalid email, password, or role"
          : result.error
      );
    } else if (result?.ok) {
      router.push(callbackUrl);
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Log In</h1>
      <div className="bg-swamp-200 dark:bg-neutrals-800 p-6 rounded-lg shadow-md max-w-3xl mx-auto">
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
              className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none autofill:bg-primary-50 autofill:dark:bg-neutrals-900 :-webkit-autofill:bg-primary-50 :-webkit-autofill:dark:bg-neutrals-900"
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
              className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none autofill:bg-primary-50 autofill:dark:bg-neutrals-900 :-webkit-autofill:bg-primary-50 :-webkit-autofill:dark:bg-neutrals-900"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-1"
            >
              Your Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none autofill:bg-primary-50 autofill:dark:bg-neutrals-900"
            >
              <option value="">Select a role</option>
              <option value="player">Tennis Player</option>
              <option value="coach">Coach</option>
              <option value="owner">Owner</option>
            </select>
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
      </div>
    </main>
  );
}
