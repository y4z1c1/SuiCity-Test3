import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI; // Ensure you have this environment variable set
const client = new MongoClient(uri);

export const handler = async (event) => {
  try {
    const { refNumber } = JSON.parse(event.body); // Get the reference number from the request body

    if (!refNumber) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Reference number is required" }),
      };
    }

    await client.connect();
    const database = client.db("twitter_bindings");
    const collection = database.collection("bindings");

    // Find the binding with the provided reference number
    const binding = await collection.findOne({
      refNumber: parseInt(refNumber),
    });

    if (!binding) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Reference number not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        walletAddress: binding.walletAddress, // Return the bound wallet address
      }),
    };
  } catch (error) {
    console.error("Error fetching reference wallet:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch reference wallet" }),
    };
  } finally {
    await client.close();
  }
};
