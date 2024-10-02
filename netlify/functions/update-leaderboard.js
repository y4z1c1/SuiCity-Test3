const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
let client = null;

if (!client) {
  client = new MongoClient(uri, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  });
}

exports.handler = async (event, context) => {
  try {
    await client.connect();
    const database = client.db("twitter_bindings");
    const bindingsCollection = database.collection("bindings");
    const leaderboardCollection = database.collection("leaderboard");

    // Fetch all users
    const users = await bindingsCollection.find().toArray();

    // Prepare users with population
    const usersWithPopulation = users
      .map((user) => ({
        ...user,
        population: user.population || 0,
      }))
      .sort((a, b) => b.population - a.population);

    // Assign ranks
    usersWithPopulation.forEach((user, index) => {
      user.rank = index + 1;
    });

    // Upsert the leaderboard data
    await leaderboardCollection.deleteMany({}); // Clear previous leaderboard
    await leaderboardCollection.insertMany(usersWithPopulation);

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
