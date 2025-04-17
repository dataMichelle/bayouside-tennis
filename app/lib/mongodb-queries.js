// app/lib/mongodb-queries.js
import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

// --------------------
// getPaymentsForCoach
// --------------------
export async function getPaymentsForCoach(coachId) {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const bookings = await db
      .collection("bookings")
      .find({ coachId })
      .toArray();

    if (!bookings.length) {
      console.warn(`No bookings found for coachId: ${coachId}`);
      return [];
    }

    const bookingIds = bookings.map((booking) => new ObjectId(booking._id));

    const payments = await db
      .collection("payments")
      .aggregate([
        {
          $match: {
            bookingId: { $in: bookingIds },
          },
        },
        {
          $lookup: {
            from: "bookings",
            localField: "bookingId",
            foreignField: "_id",
            as: "booking",
          },
        },
        { $unwind: { path: "$booking", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "firebaseUid",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            playerName: {
              $cond: {
                if: { $eq: ["$booking.ballMachine", true] },
                then: "Ball Machine",
                else: { $ifNull: ["$user.name", "Unknown"] },
              },
            },
            amount: { $divide: ["$amount", 100] },
            currency: 1,
            status: 1,
            createdAt: 1,
            bookingTime: {
              $cond: {
                if: "$booking.startTime",
                then: {
                  $concat: [
                    {
                      $dateToString: {
                        format: "%Y-%m-%d %H:%M",
                        date: "$booking.startTime",
                      },
                    },
                    " - ",
                    {
                      $dateToString: {
                        format: "%H:%M",
                        date: "$booking.endTime",
                      },
                    },
                  ],
                },
                else: "N/A",
              },
            },
          },
        },
      ])
      .toArray();

    console.log(
      `✅ Payments retrieved for coachId ${coachId}:`,
      payments.length
    );
    return payments;
  } catch (error) {
    console.error(`❌ getPaymentsForCoach error (coachId: ${coachId}):`, error);
    throw error;
  }
}

// --------------------
// getPlayersForCoach
// --------------------
export async function getPlayersForCoach(coachId) {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    const bookings = await db
      .collection("bookings")
      .find({ coachId })
      .toArray();

    console.log(`📘 Bookings found for coachId ${coachId}:`, bookings.length);

    const playerIds = [
      ...new Set(bookings.map((b) => b.playerId).filter(Boolean)),
    ];

    const objectIds = playerIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    console.log("🎯 Converted ObjectIds for players:", objectIds);

    const players = await db
      .collection("users")
      .find({ _id: { $in: objectIds } })
      .project({ name: 1, email: 1, phone: 1 })
      .toArray();

    return players;
  } catch (error) {
    console.error(`❌ getPlayersForCoach error (coachId: ${coachId}):`, error);
    throw error;
  }
}
