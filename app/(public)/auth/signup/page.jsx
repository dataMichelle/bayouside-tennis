"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import PageContainer from "@/components/PageContainer";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("player");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log("Signup initiated", { name, email, phone, role });

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      console.error("Passwords do not match", { password, confirmPassword });
      return;
    }

    let userCredential;
    try {
      console.log("Creating Firebase user...");
      // Create Firebase user
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("Firebase user created:", userCredential.user.uid);
      } catch (firebaseError) {
        console.error("Firebase authentication error:", firebaseError);
        throw new Error("Failed to create Firebase user");
      }

      const uid = userCredential.user.uid;
      console.log("Firebase user created with UID:", uid);

      // Send user data to /api/auth/signup with retry logic
      const payload = { name, email, phone, uid, role };
      let res;
      let attempts = 3;
      let delay = 500;
      const requestId = uuidv4();
      console.log("Sending user data to /api/auth/signup:", { payload });

      while (attempts > 0) {
        console.log(
          `Attempt ${4 - attempts}: Sending data to /api/auth/signup`
        );

        try {
          res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const contentType = res.headers.get("content-type");
          console.log(
            `Response from /api/auth/signup (attempt ${4 - attempts}):`,
            res.status,
            contentType
          );

          if (
            res.ok &&
            contentType &&
            contentType.includes("application/json")
          ) {
            const result = await res.json();
            console.log("Successfully created user in the backend:", result);
            break; // Success, exit retry loop
          } else {
            const responseText = await res.text();
            console.error(
              "API error response from /api/auth/signup:",
              responseText
            );
            if (res.status === 404) {
              console.error("API endpoint not found, retrying...");
              attempts--;
              if (attempts > 0) {
                console.log(
                  `Retrying in ${delay}ms... (${attempts} attempts left)`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2;
                continue;
              }
            }
            break; // Non-404 error, break retry loop
          }
        } catch (fetchError) {
          console.error(
            "Fetch error during /api/auth/signup attempt:",
            fetchError
          );
          attempts--;
          if (attempts > 0) {
            console.log(
              `Retrying in ${delay}ms... (${attempts} attempts left)`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
          setError("Network error during signup");
        }
      }
    } catch (err) {
      console.error("Signup process error:", err);
      setError(
        err.message || "Something went wrong during signup. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Sign Up">
      <form onSubmit={handleSignup} className="space-y-6 max-w-md mx-auto">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="123-456-7890"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="player">Player</option>
            <option value="coach">Coach</option>
          </select>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-md font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="mt-4 text-center text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </form>
    </PageContainer>
  );
}
