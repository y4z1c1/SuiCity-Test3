import { useCallback, useEffect, useState } from "react";
import { ADDRESSES } from "../../addresses"; // Import the addresses
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
  const [claimMessage, setClaimMessage] = useState(
    "claim your accumulated tokens"
  );
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
        },
      }),
  });

  // Memoized claim function to prevent unnecessary re-renders
  const claim = useCallback(async () => {
    try {
      setIsLoading(true); // Set loading state
      setClaimMessage("Processing your claim...");

      const transactionBlock = new Transaction();

      console.log("Claiming tokens for NFT:", nft.objectId);

      transactionBlock.moveCall({
        target: `${ADDRESSES.PACKAGE}::nft::claim_sity`,
        arguments: [
          transactionBlock.object(nft.objectId),
          transactionBlock.object(ADDRESSES.GAME),
          transactionBlock.object(ADDRESSES.CLOCK),
        ],
      });

      signAndExecute(
        { transaction: transactionBlock },
        {
          onSuccess: () => {
            console.log("Claim successful");
            setClaimMessage("Claim successful! Your tokens have been claimed.");
            onClaimSuccess(); // Call onSuccess handler
          },
          onError: (error) => {
            console.error("Claim error", error);
            setClaimMessage("Error: Unable to claim tokens. Please try again.");
            onError(); // Call onError handler
          },
        }
      );
    } catch (error) {
      console.error("Claim Error:", error);
      setClaimMessage("Error: Unable to claim tokens. Please try again.");
      onError(); // Catch and handle any outer error
    } finally {
      setIsLoading(false); // Reset loading state
    }
  }, [nft, signAndExecute, onClaimSuccess, onError]);

  useEffect(() => {
    setClaimMessage("claim your accumulated tokens");
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <p>{claimMessage}</p>
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
