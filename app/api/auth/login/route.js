import { MongoClient } from "mongodb";
import { adminAuth } from "../../../lib/firebaseAdmin"; // Adjusted path

const mongoClient = new MongoClient(process.env.MONGODB_URI);

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    await mongoClient.connect();
    const db = mongoClient.db("bayou-side-tennis");
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (password) {
      if (user.password !== password) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const customToken = await adminAuth.createCustomToken(
        user._id.toString()
      );
      mongoClient.close();
      return new Response(
        JSON.stringify({ token: customToken, role: user.role }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    mongoClient.close();
    return new Response(JSON.stringify({ role: user.role }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API - Login Error:", {
      message: error.message,
      code: error.code,
    });
    return new Response(
      JSON.stringify({ error: error.message || "Login failed" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
