import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export const handler = async (event, context) => {
  try {
    console.log("Received event:", event);

    const body = JSON.parse(event.body);
    const { walletAddress } = body;

    if (!walletAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing wallet address" }),
      };
    }

    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Successfully connected to MongoDB");

    const database = client.db("twitter_bindings");
    const collection = database.collection("bindings");

    // Fetch the user document from MongoDB
    const userBinding = await collection.findOne({ walletAddress });

    if (!userBinding) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No binding found for this wallet address",
        }),
      };
    }

    // Check if the user already has an nft field
    const hasNft = !!userBinding.nft;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        hasNft,
      }),
    };
  } catch (error) {
    console.error("Error checking NFT data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to check NFT data" }),
    };
  } finally {
    console.log("Closing MongoDB connection");
    await client.close();
  }
};
