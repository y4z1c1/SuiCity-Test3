import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export const handler = async (event, context) => {
  try {
    console.log("Received event:", event);

    // Parse the incoming request body
    const body = JSON.parse(event.body);
    console.log("Parsed body:", body);

    const { walletAddress, nftData } = body;

    // Check for missing fields
    if (!walletAddress || !nftData) {
      console.log("Missing fields:", {
        walletAddress,
        nftData,
      });
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Successfully connected to MongoDB");

    const database = client.db("twitter_bindings");
    const collection = database.collection("bindings");

    // Find the binding associated with the walletAddress
    const binding = await collection.findOne({ walletAddress });
    console.log("Existing binding for wallet:", binding);

    if (!binding) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No binding found for this wallet address",
        }),
      };
    }

    // Update the binding document with the new NFT data
    const updateResult = await collection.updateOne(
      { walletAddress },
      { $set: { nft: nftData } }
    );

    console.log("Update result:", updateResult);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "NFT data added successfully",
        updateResult,
      }),
    };
  } catch (error) {
    console.error("Error updating binding with NFT data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update binding with NFT data" }),
    };
  } finally {
    console.log("Closing MongoDB connection");
    await client.close();
  }
};
