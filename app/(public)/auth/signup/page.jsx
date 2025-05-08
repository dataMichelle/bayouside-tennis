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

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    let userCredential;
    try {
      // Create Firebase user
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      } catch (firebaseError) {
        console.error("Firebase authentication error:", {
          code: firebaseError.code || "No code",
          message: firebaseError.message || "No message",
          name: firebaseError.name || "Unknown",
          stack: firebaseError.stack || "No stack",
          rawError: JSON.stringify(
            firebaseError,
            Object.getOwnPropertyNames(firebaseError)
          ),
          email,
        });

        let userErrorMessage;
        switch (firebaseError.code) {
          case "auth/email-already-in-use":
            userErrorMessage =
              "This email is already registered. Please log in or use a different email.";
            break;
          case "auth/invalid-email":
            userErrorMessage = "Invalid email format.";
            break;
          case "auth/weak-password":
            userErrorMessage =
              "Password is too weak. Please use a stronger password.";
            break;
          case "auth/network-request-failed":
            userErrorMessage =
              "Network error. Please check your connection and try again.";
            break;
          default:
            userErrorMessage = "Failed to create account. Please try again.";
        }
        throw new Error(userErrorMessage);
      }

      const uid = userCredential.user.uid;
      console.log("Firebase user created:", { uid, email });

      // Send user data to /api/signup with retry logic
      const payload = { name, email, phone, uid, role };
      let result;
      let res;
      let attempts = 3;
      let delay = 500; // Reduced delay to minimize token expiration
      const requestId = uuidv4(); // Unique ID for tracing

      while (attempts > 0) {
        const attemptTimestamp = new Date().toISOString();
        console.log(
          `Initiating /api/signup request (attempt ${4 - attempts}):`,
          {
            requestId,
            email,
            attemptTimestamp,
            payload,
          }
        );

        try {
          res = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const contentType = res.headers.get("content-type");
          console.log(
            `Received response from /api/signup (attempt ${4 - attempts}):`,
            {
              requestId,
              status: res.status,
              statusText: res.statusText,
              contentType,
              url: res.url,
            }
          );

          if (
            res.ok &&
            contentType &&
            contentType.includes("application/json")
          ) {
            result = await res.json();
            console.log(
              `Successfully parsed JSON response from /api/signup (attempt ${
                4 - attempts
              }):`,
              {
                requestId,
                result,
              }
            );
            break; // Success, exit retry loop
          } else {
            const responseText = await res.text();
            const headers = {};
            res.headers.forEach((value, key) => {
              headers[key] = value;
            });
            result = { error: responseText || "Unknown server error" };
            console.error(
              `Non-JSON or error response from /api/signup (attempt ${
                4 - attempts
              }):`,
              {
                requestId,
                url: res.url,
                method: "POST",
                status: res.status,
                statusText: res.statusText,
                contentType,
                headers,
                requestBody: JSON.stringify(payload),
                attemptTimestamp,
                responseText:
                  responseText.length > 500
                    ? responseText.slice(0, 500) + "..."
                    : responseText,
                email,
              }
            );
            if (res.status === 404) {
              console.error(
                `API endpoint /api/signup not found (attempt ${
                  4 - attempts
                }). Check Netlify deployment, ensure app/api/signup/route.js exists and is committed, verify netlify.toml configuration, and confirm environment variables.`
              );
              attempts--;
              if (attempts > 0) {
                console.log(
                  `Retrying /api/signup in ${delay}ms... (${attempts} attempts left)`
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
            `Fetch error for /api/signup (attempt ${4 - attempts}):`,
            {
              requestId,
              message: fetchError.message || "No message",
              stack: fetchError.stack || "No stack",
              name: fetchError.name || "Unknown",
              requestBody: JSON.stringify(payload),
              attemptTimestamp,
              email,
            }
          );
          attempts--;
          if (attempts > 0) {
            console.log(
              `Retrying /api/signup in ${delay}ms... (${attempts} attempts left)`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
          result = {
            error: fetchError.message || "Network error during signup",
          };
          res = { ok: false, status: 0, statusText: "Network Error" };
          break;
        }
      }

      // Check for API errors
      if (!res.ok) {
        console.error("Signup API failed:", {
          requestId,
          error: result.error || "No error message",
          status: res.status,
          statusText: res.statusText,
          result,
          requestBody: JSON.stringify(payload),
          finalTimestamp: new Date().toISOString(),
          email,
        });
        // Clean up Firebase user on API failure
        try {
          // Refresh token to avoid auth/user-token-expired
          await userCredential.user.getIdToken(true);
          await userCredential.user.delete();
          console.log("Cleaned up Firebase user due to /api/signup failure:", {
            requestId,
            uid,
            email,
          });
        } catch (deleteError) {
          console.error("Failed to delete Firebase user after API error:", {
            requestId,
            message: deleteError.message || "No message",
            stack: deleteError.stack || "No stack",
            code: deleteError.code || "No code",
            name: deleteError.name || "Unknown",
            email,
          });
        }
        throw new Error(
          res.status === 404
            ? "Signup server endpoint not found. Please try again later or contact support."
            : result.error ||
              "Signup API request failed. Please check server logs."
        );
      }

      console.log("Signup successful:", {
        requestId,
        userId: result.userId,
        email,
        role,
      });

      // Show success toast and delay redirect
      toast.success("Signup successful! Redirecting...", {
        duration: 3000,
        icon: "✅",
        style: { background: "#f0fff4", color: "#2f855a" },
        position: "top-center",
      });

      // Delay redirect to ensure MongoDB sync and Firebase state propagation
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error("Signup error:", {
        message: err.message || "Unknown error",
        stack: err.stack || "No stack trace",
        code: err.code || "No code",
        name: err.name || "Unknown",
        email,
      });
      // Clean up Firebase user on general error (if created)
      if (userCredential && userCredential.user) {
        try {
          // Refresh token to avoid auth/user-token-expired
          await userCredential.user.getIdToken(true);
          await userCredential.user.delete();
          console.log("Cleaned up Firebase user due to general error:", {
            uid: userCredential.user.uid,
            email,
          });
        } catch (deleteError) {
          console.error("Failed to delete Firebase user after general error:", {
            message: deleteError.message || "No message",
            stack: deleteError.stack || "No stack",
            code: deleteError.code || "No code",
            name: deleteError.name || "Unknown",
            email,
          });
        }
      }
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
