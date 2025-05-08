import { connectDB } from "../mongodb";
import { ObjectId } from "mongodb";

export async function getUserByFirebaseUid(firebaseUid) {
  try {
    if (!firebaseUid || typeof firebaseUid !== "string") {
      throw new Error("Invalid firebaseUid: must be a non-empty string");
    }

    const db = await connectDB();
    const user = await db.collection("users").findOne({ firebaseUid });

    if (!user) {
      console.warn("No user found for firebaseUid:", firebaseUid);
    } else {
      console.log("User found:", { firebaseUid, email: user.email });
    }

    return user;
  } catch (error) {
    console.error("Error in getUserByFirebaseUid:", {
      message: error.message,
      stack: error.stack,
      firebaseUid,
    });
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid userId: must be a non-empty string");
    }

    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch (err) {
      throw new Error("Invalid userId: must be a valid ObjectId");
    }

    const db = await connectDB();
    const user = await db.collection("users").findOne({ _id: objectId });

    if (!user) {
      console.warn("No user found for userId:", userId);
    } else {
      console.log("User found:", { userId, email: user.email });
    }

    return user;
  } catch (error) {
    console.error("Error in getUserById:", {
      message: error.message,
      stack: error.stack,
      userId,
    });
    throw error;
  }
}

export async function getAllUsersByRole(role) {
  try {
    if (!role || typeof role !== "string") {
      throw new Error("Invalid role: must be a non-empty string");
    }

    const validRoles = ["player", "coach", "owner"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: must be one of ${validRoles.join(", ")}`);
    }

    const db = await connectDB();
    const users = await db.collection("users").find({ role }).toArray();

    console.log(`Found ${users.length} users with role:`, role);
    return users;
  } catch (error) {
    console.error("Error in getAllUsersByRole:", {
      message: error.message,
      stack: error.stack,
      role,
    });
    throw error;
  }
}
