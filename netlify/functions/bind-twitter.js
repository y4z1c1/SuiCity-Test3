import { MongoClient } from "mongodb";
import { getStore } from "@netlify/blobs";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// Function to generate a unique reference number
async function generateUniqueRefNumber(collection) {
  let refNumber;
  let isUnique = false;
  let lowerBound = 20000;
  let upperBound = 100000;
  let attemptCount = 0;
  const maxAttempts = 100;

  while (!isUnique) {
    refNumber =
      Math.floor(Math.random() * (upperBound - lowerBound + 1)) + lowerBound;
    const existingRef = await collection.findOne({ refNumber });
    if (!existingRef) {
      isUnique = true;
    } else {
      attemptCount++;
      if (attemptCount >= maxAttempts) {
        upperBound += 100000;
        attemptCount = 0;
      }
    }
  }
  return refNumber;
}

export const handler = async (event, context) => {
  try {
    const body = JSON.parse(event.body);
    const { twitterId, walletAddress, message, signature } = body;

    if (!twitterId || !walletAddress || !message || !signature) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    await client.connect();
    const database = client.db("twitter_bindings");
    const collection = database.collection("bindings");

    const existingBindingForTwitter = await collection.findOne({ twitterId });
    if (existingBindingForTwitter) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "This Twitter account is already bound to a wallet",
        }),
      };
    }

    const existingBindingForWallet = await collection.findOne({
      walletAddress,
    });
    if (existingBindingForWallet) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "This wallet is already bound to another Twitter account",
        }),
      };
    }

    const indexNumber = await collection.countDocuments();
    const refNumber = await generateUniqueRefNumber(collection);

    const result = await collection.insertOne({
      twitterId,
      walletAddress,
      message,
      signature,
      indexNumber,
      refNumber,
      createdAt: new Date(),
    });

    // Store binding in Netlify Blobs
    const bindingStore = getStore("twitter_bindings");
    await bindingStore.setJSON(walletAddress, {
      twitterId,
      message,
      signature,
      indexNumber,
      refNumber,
      createdAt: new Date(),
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Binding stored successfully",
        result,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to store binding data" }),
    };
  } finally {
    await client.close();
  }
};
