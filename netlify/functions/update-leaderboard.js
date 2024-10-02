import { MongoClient } from "mongodb";

// MongoDB connection setup
const uri = process.env.MONGODB_URI;
let client = null;

if (!client) {
  client = new MongoClient(uri, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  });
}

export default async (req, context) => {
  try {
    // Connect to MongoDB
    await client.connect();
    const database = client.db("twitter_bindings");
    const bindingsCollection = database.collection("bindings");
    const leaderboardCollection = database.collection("leaderboard");

    // Fetch all users
    const users = await bindingsCollection.find().toArray();

    // Prepare users with population
    const usersWithPopulation = users.map((user) => ({
      ...user,
      population: user.population || 0,
    }));

    // Sort users by population (descending)
    usersWithPopulation.sort((a, b) => b.population - a.population);

    // Assign ranks to each user
    usersWithPopulation.forEach((user, index) => {
      user.rank = index + 1;
    });

    // Upsert leaderboard data
    await leaderboardCollection.deleteMany({}); // Clear old leaderboard
    await leaderboardCollection.insertMany(usersWithPopulation); // Insert new leaderboard

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
