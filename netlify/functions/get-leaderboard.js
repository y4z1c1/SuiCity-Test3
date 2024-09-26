const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
let client = null;

if (!client) {
  client = new MongoClient(uri, {
    connectTimeoutMS: 30000, // Set the connection timeout to 30 seconds
    socketTimeoutMS: 30000, // Set the socket timeout to 30 seconds
  });
}

exports.handler = async (event, context) => {
  const walletAddress = event.queryStringParameters.walletAddress; // For GET requests

  if (!walletAddress) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing wallet address" }),
    };
  }

  try {
    await client.connect();
    const database = client.db("twitter_bindings");
    const collection = database.collection("bindings");

    // Fetch all users and sort by population if the field exists, default to 0 if not
    const users = await collection.find().toArray();

    // Filter out users without a population field or set their population to 0
    const usersWithPopulation = users
      .map((user) => ({
        ...user,
        population: user.population || 0, // Default population to 0 if undefined
      }))
      .sort((a, b) => b.population - a.population); // Sort by population in descending order

    // Find the current user by walletAddress
    const user = usersWithPopulation.find(
      (u) => u.walletAddress === walletAddress
    );

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    let userRank = 0;

    // Only calculate rank if population exists and is greater than 0
    if (user.population > 0) {
      userRank =
        usersWithPopulation.findIndex(
          (u) => u.walletAddress === walletAddress
        ) + 1;
    }

    // Return the top 50 users along with the current user's rank
    return {
      statusCode: 200,
      body: JSON.stringify({
        topUsers: usersWithPopulation.slice(0, 50), // Return top 50 users
        currentUser: {
          ...user,
          rank: userRank, // Rank is calculated only if population > 0
        },
      }),
    };
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch leaderboard" }),
    };
  }
};
