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
      signOut(auth).catch(() => {});
    }
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      let userCredential;
      let uid;

      if (signInMethods.length > 0) {
        const existsRes = await fetch("/api/users/exists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const existsResult = await existsRes.json();
        if (!existsRes.ok) {
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
          setLoading(false);
          return;
        }
        if (auth.currentUser) {
          uid = auth.currentUser.uid;
        } else {
          setError(
            "Firebase user exists but is not signed in. Please log in or use a different email."
          );
          setLoading(false);
          return;
        }
      } else {
        try {
          userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          uid = userCredential.user.uid;
        } catch (firebaseError) {
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

      const payload = { name, email, phone, uid, role };
      let result;
      let res;
      let attempts = 3;
      let delay = 500;

      while (attempts > 0) {
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
            result = { error: responseText || "Unknown server error" };
            if (res.status === 404) {
              attempts--;
              if (attempts > 0) {
                await new Promise((resolve) => setTimeout(resolve, delay));
                delay *= 2;
                continue;
              }
            }
            break;
          }
        } catch {
          attempts--;
          if (attempts > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            continue;
          }
          result = {
            error: "Network error during signup",
          };
          res = { ok: false, status: 0, statusText: "Network Error" };
          break;
        }
      }

      if (!res.ok) {
        if (userCredential && userCredential.user) {
          try {
            await userCredential.user.getIdToken(true);
            await userCredential.user.delete();
          } catch {}
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

      setTimeout(() => {
        if (role === "player") {
          router.push("/players/info");
        } else if (role === "owner" || role === "coach") {
          router.push("/dashboard");
        } else {
          router.push("/login");
        }
      }, 2000);
    } catch (err) {
      if (userCredential && userCredential.user) {
        try {
          await userCredential.user.getIdToken(true);
          await userCredential.user.delete();
        } catch {}
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
