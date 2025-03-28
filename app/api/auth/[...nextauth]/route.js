import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);

async function connectToDatabase() {
  await client.connect();
  return client.db("bayou-side-tennis");
}

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
        const db = await connectToDatabase();
        const user = await db.collection("users").findOne({
          email: credentials.email,
          password: credentials.password, // Plain text for now
        });
        if (user) {
          console.log("Authorize - User:", user); // Debug
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
        console.log("Authorize - No user found for:", credentials.email);
        return null;
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
      console.log("Session Callback - Session:", session); // Debug
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
