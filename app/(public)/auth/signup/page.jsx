"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signOut,
} from "firebase/auth";
import SignUp from "@/components/SignUp";
import { toast } from "react-hot-toast";
import PageContainer from "@/components/PageContainer";
import Link from "next/link";

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

  // Sign out any existing Firebase user on page load
  useEffect(() => {
    if (auth.currentUser) {
      signOut(auth)
        .then(() => {})
        .catch((signOutError) => {
          console.error("Failed to sign out Firebase user:", {
            message: signOutError.message || "No message",
            code: signOutError.code || "No code",
            timestamp: new Date().toISOString(),
          });
        });
    } else {
    }
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      console.error("Password mismatch:", {
        password,
        confirmPassword,
        timestamp: new Date().toISOString(),
      });
      setLoading(false);
      return;
    }

    try {
      // Check if Firebase user exists

      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      let userCredential;
      let uid;

      if (signInMethods.length > 0) {
        console.error("Firebase user already exists:", {
          email,
          signInMethods,
          timestamp: new Date().toISOString(),
        });
        // Check if MongoDB user exists for this Firebase user

        const existsRes = await fetch("/api/users/exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const existsResult = await existsRes.json();
        if (!existsRes.ok) {
          console.error("Error checking MongoDB user existence:", {
            status: existsRes.status,
            error: existsResult.error,
            timestamp: new Date().toISOString(),
          });
          setError(
            existsResult.error ||
              "Failed to check user existence. Please try again."
          );
          setLoading(false);
          return;
        }
        if (existsResult.exists) {
          setError(
            "A user with this email already exists. Please log in or use a different email."
          );
          console.error("MongoDB user already exists for Firebase user:", {
            email,
            timestamp: new Date().toISOString(),
          });
          setLoading(false);
          return;
        }
        // Firebase user exists, but no MongoDB user; proceed to create MongoDB user

        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          setError(
            "Firebase user exists but is not signed in. Please log in or use a different email."
          );
          console.error("Firebase user exists but not signed in:", {
            email,
            timestamp: new Date().toISOString(),
          });
          setLoading(false);
          return;
        }
      } else {
        // No Firebase user exists, create one

        try {
          userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

          uid = userCredential.user.uid;
        } catch (firebaseError) {
          console.error("Firebase authentication error:", {
            code: firebaseError.code || "No code",
            message: firebaseError.message || "No message",
            name: firebaseError.name || "Unknown",
            stack: firebaseError.stack || "No stack",
            email,
            timestamp: new Date().toISOString(),
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
      }

      // Proceed to create MongoDB user
      const payload = { name, email, phone, uid, role, password };

      let result;
      let res;
      let attempts = 3;
      let delay = 500;

      while (attempts > 0) {
        const attemptTimestamp = new Date().toISOString();

        try {
          res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const contentType = res.headers.get("content-type");

          if (
            res.ok &&
            contentType &&
            contentType.includes("application/json")
          ) {
            result = await res.json();

            break;
          } else {
            const responseText = await res.text();
            const headers = {};
            res.headers.forEach((value, key) => {
              headers[key] = value;
            });
            result = { error: responseText || "Unknown server error" };
            console.error(
              `Non-JSON or error response from /api/auth/signup (attempt ${
                4 - attempts
              }):`,
              {
                url: res.url,
                method: "POST",
                status: res.status,
                statusText: res.statusText,
                contentType,
                headers,
                requestBody: JSON.stringify(payload),
                responseText:
                  responseText.length > 500
                    ? responseText.slice(0, 500) + "..."
                    : responseText,
                email,
                timestamp: attemptTimestamp,
              }
            );
            if (res.status === 404) {
              console.error(
                `API endpoint /api/auth/signup not found (attempt ${
                  4 - attempts
                }). Check Netlify deployment, ensure app/api/auth/signup/route.js exists and is committed, verify netlify.toml configuration, and confirm environment variables.`
              );
              attempts--;
              if (attempts > 0) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2;
                continue;
              }
            }
            break;
          }
        } catch (fetchError) {
          console.error(
            `Fetch error during /api/auth/signup (attempt ${4 - attempts}):`,
            {
              message: fetchError.message || "No message",
              stack: fetchError.stack || "No stack",
              name: fetchError.name || "Unknown",
              requestBody: JSON.stringify(payload),
              email,
              timestamp: attemptTimestamp,
            }
          );
          attempts--;
          if (attempts > 0) {
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

      if (!res.ok) {
        console.error("Signup API failed:", {
          error: result.error || "No error message",
          status: res.status,
          statusText: res.statusText,
          result,
          requestBody: JSON.stringify(payload),
          email,
          timestamp: new Date().toISOString(),
        });
        // Clean up Firebase user on API failure, if created
        if (userCredential && userCredential.user) {
          try {
            await userCredential.user.getIdToken(true);
            await userCredential.user.delete();
          } catch (deleteError) {
            console.error("Failed to delete Firebase user after API error:", {
              message: deleteError.message || "No message",
              stack: deleteError.stack || "No stack",
              code: deleteError.code || "No code",
              name: deleteError.name || "Unknown",
              email,
              timestamp: new Date().toISOString(),
            });
          }
        }
        throw new Error(
          res.status === 404
            ? "Signup server endpoint not found. Please try again later or contact support."
            : result.error ||
              "Signup API request failed. Please check server logs."
        );
      }

      toast.success("Signup successful! Redirecting...", {
        duration: 3000,
        icon: "✅",
        style: { background: "#f0fff4", color: "#2f855a" },
        position: "top-center",
      });

      // Redirect based on role

      setTimeout(() => {
        if (role === "player") {
          router.push("/players/info");
        } else if (role === "owner" || role === "coach") {
          router.push("/dashboard");
        } else {
          console.error("Invalid role for redirect, defaulting to /login:", {
            role,
            timestamp: new Date().toISOString(),
          });
          router.push("/login");
        }
      }, 2000);
    } catch (err) {
      console.error("Signup error:", {
        message: err.message || "Unknown error",
        stack: err.stack || "No stack trace",
        code: err.code || "No code",
        name: err.name || "Unknown",
        email,
        timestamp: new Date().toISOString(),
      });
      if (userCredential && userCredential.user) {
        try {
          await userCredential.user.getIdToken(true);
          await userCredential.user.delete();
        } catch (deleteError) {
          console.error("Failed to delete Firebase user after general error:", {
            message: deleteError.message || "No message",
            stack: deleteError.stack || "No stack",
            code: deleteError.code || "No code",
            name: deleteError.name || "Unknown",
            email,
            timestamp: new Date().toISOString(),
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
      <SignUp
        handleSignUp={handleSignup}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        role={role}
        setRole={setRole}
        error={error}
        loading={loading}
      />
      <p className="mt-4 text-center text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Log In
        </Link>
      </p>
    </PageContainer>
  );
}
