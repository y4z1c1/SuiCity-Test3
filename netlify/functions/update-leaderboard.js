import { MongoClient } from "mongodb";

// MongoDB connection setup
const uri = process.env.MONGODB_URI;
let client = null;

const getMongoClient = async () => {
  if (!client) {
    client = new MongoClient(uri, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
    });
    await client.connect(); // Ensure we only connect once
  }
  return client;
};

export default async (req, context) => {
  try {
    const client = await getMongoClient();
    const database = client.db("twitter_bindings");
    const leaderboardCollection = database.collection("leaderboard");

    // MongoDB Aggregation to sort by population and assign ranks
    const leaderboardPipeline = [
      { $match: {} }, // Fetch all users
      { $sort: { population: -1 } }, // Sort by population in descending order
      { $group: { _id: null, users: { $push: "$$ROOT" } } }, // Group all users
      {
        $project: {
          users: {
            $map: {
              input: { $range: [0, { $size: "$users" }] }, // Create ranks for users
              as: "rank",
              in: {
                $mergeObjects: [
                  { $arrayElemAt: ["$users", "$$rank"] },
                  { rank: { $add: ["$$rank", 1] } }, // Add rank based on position
                ],
              },
            },
          },
        },
      },
      { $unwind: "$users" }, // Unwind the users array
      { $replaceRoot: { newRoot: "$users" } }, // Replace root with users
    ];

    const usersWithRanks = await database
      .collection("bindings")
      .aggregate(leaderboardPipeline)
      .toArray();

    // Upsert leaderboard data (clear and insert new leaderboard)
    await leaderboardCollection.deleteMany({}); // Clear old leaderboard
    await leaderboardCollection.insertMany(usersWithRanks); // Insert new leaderboard

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Leaderboard updated successfully" }),
    };
  } catch (error) {
    console.error("Error updating leaderboard:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update leaderboard" }),
    };
  }
};

// Specify the cron schedule for the function to run every 2 minutes
export const config = {
  schedule: "*/2 * * * *",
};
