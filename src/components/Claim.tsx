import { useCallback, useEffect, useState } from "react";
import { ADDRESSES } from "../../addresses.ts"; // Import the addresses
import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";

const Claim = ({
  nft,
  onClaimSuccess,
  onClick,
  onError, // Prop to handle error
}: {
  nft: any;
  onClaimSuccess: () => void;
  onClick: () => void;
  onError: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false); // State for loading indication
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
          showObjectChanges: true,
        },
      }),
  });

  // Memoized claim function to prevent unnecessary re-renders
  const claim = useCallback(async () => {
    try {
      setIsLoading(true); // Set loading state
      console.log("Processing your claim...");

      const transactionBlock = new Transaction();

      console.log("Claiming tokens for NFT:", nft.objectId);

      transactionBlock.moveCall({
        target: `${ADDRESSES.PACKAGE}::nft::claim_sity`,
        arguments: [
          transactionBlock.objectRef({
            objectId: nft.objectId,
            digest: nft.digest,
            version: nft.version,
          }),
          transactionBlock.object(ADDRESSES.GAME),
          transactionBlock.object(ADDRESSES.CLOCK),
        ],
      });

      signAndExecute(
        { transaction: transactionBlock },
        {
          onSuccess: () => {
            console.log("Claim successful");
            console.log("Claim successful! Your tokens have been claimed.");
            onClaimSuccess(); // Call onSuccess handler
          },
          onError: (error) => {
            console.error("Claim error", error);
            console.log("Error: Unable to claim tokens. Please try again.");
            onError(); // Call onError handler
          },
        }
      );
    } catch (error) {
      console.error("Claim Error:", error);
      console.log("Error: Unable to claim tokens. Please try again.");
      onError(); // Catch and handle any outer error
    } finally {
      setIsLoading(false); // Reset loading state
    }
  }, [nft, signAndExecute, onClaimSuccess, onError]);

  useEffect(() => {
    console.log("claim your accumulated tokens");
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <button
        className={`mx-auto px-5 py-3 border border-transparent text-base font-medium rounded-md text-white ${
          isLoading ? "bg-gray-500" : "bg-indigo-600 hover:bg-indigo-700"
        }`}
        disabled={isLoading} // Disable the button while processing
        onClick={() => {
          onClick(); // Call onClick to pause accumulation
          claim(); // Call claim function
        }}
      >
        {isLoading ? "Processing..." : "Claim"}
      </button>
    </div>
  );
};

export default Claim;
