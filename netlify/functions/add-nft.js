import { MongoClient } from "mongodb";
import { getStore } from "@netlify/blobs";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export const handler = async (event, context) => {
  try {
    console.log("Received event:", event);

    const body = JSON.parse(event.body);
    const { walletAddress, nftData } = body;

    if (!walletAddress || !nftData) {
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

    const binding = await collection.findOne({ walletAddress });

    if (!binding) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No binding found for this wallet address",
        }),
      };
    }

    // Update MongoDB with new NFT data
    const updateResult = await collection.updateOne(
      { walletAddress },
      { $set: { nft: nftData } }
    );

    // Store NFT data in Netlify Blobs
    const nftStore = getStore("nft_data");
    await nftStore.setJSON(walletAddress, { nftData });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "NFT data added successfully",
        updateResult,
      }),
    };
  } catch (error) {
    console.error("Error updating NFT data:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update NFT data" }),
    };
  } finally {
    console.log("Closing MongoDB connection");
    await client.close();
  }
};
