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
    const collection = database.collection("leaderboard");

    // Fetch top 50 users from the leaderboard collection without sorting
    // Since the collection is pre-sorted and ranks are assigned during the update
    const topUsers = await collection.find().limit(50).toArray();

    // Find the current user by walletAddress
    const user = await collection.findOne({ walletAddress });

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    // Return the top 50 users along with the current user's data
    return {
      statusCode: 200,
      body: JSON.stringify({
        topUsers,
        currentUser: user,
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
