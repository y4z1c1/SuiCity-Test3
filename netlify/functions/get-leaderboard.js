const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
let client = null;

if (!client) {
  client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

exports.handler = async (event, context) => {
  try {
    await client.connect();
    const database = client.db("twitter_bindings");
    const collection = database.collection("bindings");

    // Fetch the top 20 users sorted by population
    const users = await collection
      .find()
      .sort({ population: -1 })
      .limit(50)
      .toArray();

    return {
      statusCode: 200,
      body: JSON.stringify(users),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch leaderboard" }),
    };
  }
};
