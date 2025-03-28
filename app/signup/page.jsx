"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function Signup() {
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const role = formData.get("role");
    const phone = formData.get("phone");

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, phone }),
    });

    if (response.ok) {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role,
      });

      if (!result?.error) {
        router.push(role === "player" ? "/players" : "/dashboard");
      } else {
        console.log("Sign-in failed:", result.error);
      }
    } else {
      console.log("Signup failed:", await response.text());
    }
  };

  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold  mb-6 text-center">Sign Up to Play </h1>
      <div className="bg-swamp-200  dark:bg-neutrals-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-1"
            >
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="John Doe"
            />
          </div>
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
              name="email"
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
              name="password"
              required
              className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-neutrals-700 dark:text-neutrals-300 mb-1"
            >
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="123-456-7890"
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
              name="role"
              required
              className="w-full px-4 py-2 border border-primary-200 dark:border-neutrals-700 rounded-md bg-primary-50 dark:bg-neutrals-900 text-neutrals-900 dark:text-neutrals-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select a role</option>
              <option value="player">Tennis Player</option>
              <option value="coach">Coach</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors shadow-md"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-neutrals-600 dark:text-neutrals-300">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary-700 dark:text-primary-300 hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
