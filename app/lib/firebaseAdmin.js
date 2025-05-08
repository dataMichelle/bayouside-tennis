import admin from "firebase-admin";

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      if (
        !process.env.FIREBASE_CLIENT_EMAIL ||
        !process.env.FIREBASE_PRIVATE_KEY
      ) {
        throw new Error(
          "Missing Firebase Admin environment variables: FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY"
        );
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "bayousidetennis",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        }),
      });
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
  return admin;
}

export const adminAuth = initializeFirebaseAdmin().auth();
export const adminApp = initializeFirebaseAdmin();
