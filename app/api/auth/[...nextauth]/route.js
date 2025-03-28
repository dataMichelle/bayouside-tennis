import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "../../utils/mongodb";

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
          console.log("🟡 Received credentials:", credentials);

          const client = await clientPromise;
          const db = client.db("bayou-side-tennis");

          const user = await db
            .collection("users")
            .findOne({ email: credentials.email });

          console.log("🟡 User found in database:", user);

          if (!user) {
            console.log("❌ No user found with this email.");
            return null; // No user in DB
          }

          if (user.password !== credentials.password) {
            console.log("❌ Password mismatch.");
            return null; // Wrong password
          }

          console.log("✅ Login successful for:", user.email);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("❌ Error in authorize():", error);
          return null;
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
