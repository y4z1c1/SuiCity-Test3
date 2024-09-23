import { MongoClient } from "mongodb";

export const handler = async (event, context) => {
  const MONGODB_URI = process.env.MONGODB_URI;
  const DATABASE_NAME = "EligibleObjects";
  const COLLECTION_NAME = "objects";

  // Parse the request body
  const { wallet, objectIds } = JSON.parse(event.body);

  if (!wallet || !objectIds || !Array.isArray(objectIds)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid wallet or objectIds array" }),
    };
  }

  try {
    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // Check if any objectId is already associated with a different wallet
    const existingEntries = await collection
      .find({ objectIds: { $in: objectIds } })
      .toArray();

    if (existingEntries.length > 0) {
      // Check if any of the found entries belong to a different wallet
      const conflictingWallets = existingEntries.filter(
        (entry) => entry.wallet !== wallet
      );

      if (conflictingWallets.length > 0) {
        // Conflict found, return error
        await client.close();
        return {
          statusCode: 403,
          body: JSON.stringify({
            error: "Some objects are already claimed by a different wallet.",
            conflictingWallets: conflictingWallets.map((entry) => entry.wallet),
          }),
        };
      }
    }

    // Close the connection
    await client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message:
          "No conflicting objects found. Objects are eligible for addition.",
      }),
    };
  } catch (error) {
    console.error("Error checking objectIds:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to check objectIds" }),
    };
  }
};
