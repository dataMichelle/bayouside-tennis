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
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        let client;
        try {
          client = new MongoClient(process.env.MONGODB_URI);
          await client.connect();
          const db = client.db("bayou-side-tennis");
          const user = await db.collection("users").findOne({
            email: credentials.email,
            password: credentials.password, // Plain text for now
          });
          if (user) {
            console.log("Authorize - User:", user);
            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
          console.log("Authorize - No user found for:", credentials.email);
          return null;
        } catch (error) {
          console.error("Authorize error:", {
            message: error.message,
            stack: error.stack,
          });
          throw new Error("Authentication failed");
        } finally {
          if (client) await client.close();
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
      console.log("Session Callback - Session:", session);
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure this is set
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
