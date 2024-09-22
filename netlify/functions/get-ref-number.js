import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export const handler = async (event) => {
  try {
    const { walletAddress } = JSON.parse(event.body);

    if (!walletAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Wallet address is required" }),
      };
    }

    console.log("Wallet Address received:", walletAddress);

    await client.connect();
    const database = client.db("twitter_bindings");
    const collection = database.collection("bindings");

    // Log to check if the connection and collection are correct
    console.log("Connected to MongoDB and using collection 'bindings'");

    // Find the user by wallet address
    const binding = await collection.findOne({ walletAddress });

    if (!binding) {
      console.log(`No binding found for wallet address: ${walletAddress}`);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Binding not found" }),
      };
    }

    console.log("Binding found:", binding);

    return {
      statusCode: 200,
      body: JSON.stringify({ refNumber: binding.refNumber }),
    };
  } catch (error) {
    console.error("Error fetching reference number:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch reference number" }),
    };
  } finally {
    await client.close();
  }
};
