import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export const handler = async (event) => {
  try {
    const { refOwnerWallet, claimerWallet } = JSON.parse(event.body);

    if (!refOwnerWallet || !claimerWallet) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    await client.connect();
    const database = client.db("twitter_bindings"); // Adjust your MongoDB database name
    const collection = database.collection("bindings"); // Adjust your MongoDB collection

    // Find the reference owner's info
    const existingOwner = await collection.findOne({
      walletAddress: refOwnerWallet,
    });

    if (!existingOwner) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Reference owner not found" }),
      };
    }

    // Add the claimer's address to the usedRefs array if it's not already present
    if (!existingOwner.usedRefs) {
      existingOwner.usedRefs = [];
    }

    if (!existingOwner.usedRefs.includes(claimerWallet)) {
      await collection.updateOne(
        { walletAddress: refOwnerWallet },
        { $push: { usedRefs: claimerWallet } }
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Reference successfully updated" }),
    };
  } catch (error) {
    console.error("Error updating reference owner info:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to update reference owner info" }),
    };
  } finally {
    await client.close();
  }
};
