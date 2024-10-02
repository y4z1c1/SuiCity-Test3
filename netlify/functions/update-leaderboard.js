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
    const bindingsCollection = database.collection("bindings");
    const leaderboardCollection = database.collection("leaderboard");

    // Fetch users and sort directly in MongoDB by population
    const users = await bindingsCollection
      .find()
      .sort({ population: -1 })
      .toArray();

    // Assign ranks to each user
    users.forEach((user, index) => {
      user.rank = index + 1;
    });

    // Upsert leaderboard data (clear and insert new leaderboard)
    await leaderboardCollection.deleteMany({}); // Clear old leaderboard
    await leaderboardCollection.insertMany(users); // Insert new leaderboard

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
