// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoClient } from "mongodb";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const client = new MongoClient(process.env.MONGODB_URI);
        try {
          await client.connect();
          const db = client.db("bayou-side-tennis");
          const user = await db
            .collection("users")
            .findOne({ email: credentials.email });

          if (!user) {
            throw new Error("No user found with this email");
          }

          // Replace with proper password hashing/check (e.g., bcrypt)
          if (user.password !== credentials.password) {
            throw new Error("Password incorrect");
          }

          return {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          throw new Error(error.message);
        } finally {
          await client.close();
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT for simplicity; change to "database" if using MongoDB adapter
  },
  pages: {
    signIn: "/login", // Your custom login page
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);
