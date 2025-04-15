import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

export async function getPaymentsForCoach(coachId) {
  try {
    const client = await clientPromise;
    const db = client.db("bayou-side-tennis");

    console.log(`Querying payments for coachId: ${coachId}`);

    const bookings = await db
      .collection("bookings")
      .find({ coachId }) // coachId is string (Firebase UID)
      .toArray();
    console.log(
      `Bookings found for coachId ${coachId}:`,
      bookings.length,
      bookings
    );

    if (bookings.length === 0) {
      console.log(`No bookings found for coachId: ${coachId}`);
      return [];
    }

    const bookingIds = bookings.map((booking) => new ObjectId(booking._id));
    console.log(`Booking IDs:`, bookingIds);

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
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: "$_id",
            playerName: {
              $cond: {
                if: { $eq: ["$booking.ballMachine", true] },
                then: "Ball Machine",
                else: { $ifNull: ["$user.name", "Unknown"] },
              },
            },
            amount: { $divide: ["$amount", 100] }, // Convert cents to dollars
            currency: "$currency",
            status: "$status",
            createdAt: "$createdAt",
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

    console.log(`Payments found for coachId ${coachId}:`, payments);
    return payments;
  } catch (error) {
    console.error(
      `Error in getPaymentsForCoach for coachId ${coachId}:`,
      error
    );
    throw error;
  }
}
