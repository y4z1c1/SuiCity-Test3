import { MongoClient } from "mongodb";
import { getStore } from "@netlify/blobs";

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

export const handler = async (event) => {
  try {
    const { refNumber } = JSON.parse(event.body);

    if (!refNumber) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Reference number is required" }),
      };
    }

    await client.connect();
    const database = client.db("twitter_bindings");
    const collection = database.collection("bindings");

    const binding = await collection.findOne({
      refNumber: parseInt(refNumber),
    });

    if (!binding) {
      // Check Netlify Blobs if MongoDB doesn't have the binding
      const refStore = getStore("ref_data");
      const blobBinding = await refStore.get(refNumber);

      if (!blobBinding) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Reference number not found" }),
        };
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          walletAddress: JSON.parse(blobBinding).walletAddress,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ walletAddress: binding.walletAddress }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to fetch reference wallet" }),
    };
  } finally {
    await client.close();
  }
};
