import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
let client; // Declare client outside to reuse it across requests

const getMongoClient = async () => {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client;
};

export const handler = async (event) => {
  let clientInstance;

  try {
    const { walletAddress } = JSON.parse(event.body);

    if (!walletAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    clientInstance = await getMongoClient(); // Reuse or create a new connection
    const database = clientInstance.db("twitter_bindings");
    const collection = database.collection("bindings");

    // Fetch the user's reference binding data
    const binding = await collection.findOne({ walletAddress });

    if (!binding) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "No reference found for this wallet" }),
      };
    }

    // Track the last check timestamp (if it exists)
    const lastCheck = binding.lastCheck || new Date(0); // Default to Unix epoch if no check was made
    const usedRefs = binding.usedRefs || [];

    // Fetch only new references (filter those added after the last check)
    const newRefs = usedRefs.filter(
      (ref) => new Date(ref.timestamp) > new Date(lastCheck)
    );

    // Update the last check timestamp to now
    const updatedTimestamp = new Date();

    await collection.updateOne(
      { walletAddress },
      { $set: { lastCheck: updatedTimestamp } }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ newRefs, usedRefs }),
    };
  } catch (error) {
    console.error("Error fetching usedRefs:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch usedRefs" }),
    };
  } finally {
    // No need to close the connection since it's reused
    // If you need to close it explicitly, make sure to do it properly
    // await clientInstance.close();
  }
};
