import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export const handler = async (event, context) => {
  try {
    const { twitterId } = event.queryStringParameters;

    if (!twitterId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    await client.connect();
    const database = client.db("twitter_bindings");
    const collection = database.collection("bindings");

    // Check if the Twitter ID is already bound
    const existingBinding = await collection.findOne({ twitterId });

    if (existingBinding) {
      return {
        statusCode: 200,

        body: JSON.stringify({
          isBound: true,
          walletAddress: existingBinding.walletAddress, // Return the bound wallet address
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        isBound: false,
      }),
    };
  } catch (error) {
    console.error("Error checking binding:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to check binding" }),
    };
  } finally {
    await client.close();
  }
};
