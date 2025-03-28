import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "../../../utils/mongodb";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials, req) {
        try {
          console.log("🚨 DEBUG: authorize() function was called!");
          console.log("🟡 Received credentials:", credentials);

          const client = await clientPromise;
          const db = client.db("bayou-side-tennis");

          const user = await db
            .collection("users")
            .findOne({ email: credentials.email });

          console.log("🟡 User found in database:", user);

          if (!user) {
            console.log("❌ No user found with this email.");
            throw new Error("User does not exist.");
          }

          const isMatch = user.password === credentials.password; // If using plain text
          if (!isMatch) {
            console.log("❌ Password mismatch.");
            throw new Error("Invalid password.");
          }

          console.log("✅ Login successful for:", user.email);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("❌ ERROR in authorize():", error.message);
          throw new Error(error.message); // This error triggers NextAuth's error page
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
