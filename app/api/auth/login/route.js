// app/api/auth/login/route.js
import { MongoClient } from "mongodb";
import admin from "firebase-admin";

const mongoClient = new MongoClient(process.env.MONGODB_URI);

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    console.log("API - Initializing Firebase Admin SDK");
    // Use absolute path to avoid relative path issues
    const serviceAccount = require("C:/Users/miche/Developer/Projects/Portfolio/bayouside-tennis/app/lib/bayousidetennis-firebase-adminsdk-fbsvc-ddf4afc83e.json");
    console.log("API - Service Account Loaded:", {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
    });
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("API - Firebase Admin SDK Initialized Successfully");
  } catch (error) {
    console.error("API - Firebase Admin Initialization Error:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    throw error;
  }
}

export async function POST(req) {
  console.log("API - Received POST request to /api/auth/login");

  try {
    const { email, password } = await req.json();
    console.log("API - Request Body Parsed:", {
      email,
      password: password ? "[hidden]" : "none",
    });

    console.log("API - Connecting to MongoDB");
    await mongoClient.connect();
    const db = mongoClient.db("bayou-side-tennis");
    console.log("API - Connected to MongoDB, querying user");
    const user = await db.collection("users").findOne({ email });
    console.log(
      "API - MongoDB User Query Result:",
      user ? { email: user.email, role: user.role } : null
    );

    if (!user) {
      console.log("API - User not found");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (password) {
      if (user.password !== password) {
        console.log("API - Authentication Failed: Invalid credentials");
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      console.log(
        "API - Generating Firebase Custom Token for UID:",
        user._id.toString()
      );
      const customToken = await admin
        .auth()
        .createCustomToken(user._id.toString());
      console.log(
        "API - Custom Token Generated Successfully, Token Length:",
        customToken.length
      );

      mongoClient.close();
      console.log("API - MongoDB Connection Closed");

      return new Response(
        JSON.stringify({ token: customToken, role: user.role }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("API - Returning role for authenticated user:", user.role);
    mongoClient.close();
    console.log("API - MongoDB Connection Closed");
    return new Response(JSON.stringify({ role: user.role }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API - Login Error:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
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
