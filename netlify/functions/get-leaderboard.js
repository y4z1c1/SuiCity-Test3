const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
let client = null;

if (!client) {
  client = new MongoClient(uri); // No need for useNewUrlParser and useUnifiedTopology
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

    // Fetch all users sorted by population
    const users = await collection.find().sort({ population: -1 }).toArray();

    // Find the current user by walletAddress
    const user = users.find((u) => u.walletAddress === walletAddress);

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    // Get the user's rank based on their index in the sorted array
    const userRank =
      users.findIndex((u) => u.walletAddress === walletAddress) + 1;

    // Return the top 50 users along with the current user's rank
    return {
      statusCode: 200,
      body: JSON.stringify({
        topUsers: users.slice(0, 50), // Return top 50 users
        currentUser: {
          ...user,
          rank: userRank,
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
