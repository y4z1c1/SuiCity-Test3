import { useCallback, useState } from "react";
import { ADDRESSES } from "../../addresses.ts";
import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";

const ClaimFactoryBonus = ({
  nft,
  onClaimSuccess,
  onClick,
  onError,
  showModal, // Add showModal as a prop
}: {
  nft: any;
  onClaimSuccess: () => void;
  onClick: () => void;
  onError: () => void;
  showModal: (message: string) => void; // Define showModal prop type
}) => {
  const suiClient = useSuiClient();
  const [isProcessing, setIsProcessing] = useState(false);

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

  const claimBonus = useCallback(async () => {
    setIsProcessing(true); // Disable the button while the transaction is in progress
    try {
      const transactionBlock = new Transaction();

      console.log("Claiming bonus for NFT:", nft.objectId);
      transactionBlock.moveCall({
        target: `${ADDRESSES.PACKAGE}::nft::claim_factory_bonus`,
        arguments: [
          transactionBlock.objectRef({
            objectId: nft.objectId,
            digest: nft.digest,
            version: nft.version,
          }),
          transactionBlock.object(`${ADDRESSES.GAME}`),
          transactionBlock.object(`${ADDRESSES.CLOCK}`),
        ],
      });

      await signAndExecute(
        { transaction: transactionBlock },
        {
          onSuccess: (result) => {
            console.log("Claim successful:", result);
            console.log("Bonus claimed successfully!");
            showModal("Bonus claimed successfully!"); // Show success message in the modal

            onClaimSuccess();
          },
          onError: (error) => {
            console.error("Claim failed:", error);
            console.log("Failed to claim bonus. Please try again.");
            showModal("Failed to claim bonus. Please try again."); // Show success message in the modal

            onError();
          },
        }
      );
    } catch (error) {
      console.error("Claim Error:", error);
      console.log("An error occurred. Please try again.");
      showModal("An error occurred. Please try again."); // Show success message in the modal

      onError();
    } finally {
      setIsProcessing(false); // Re-enable the button
    }
  }, [nft, signAndExecute, onClaimSuccess, onError]);

  return (
    <div>
      <button
        onClick={() => {
          onClick(); // Notify parent component
          claimBonus(); // Start the bonus claim process
        }}
        disabled={isProcessing} // Disable button while the transaction is processing
      >
        {isProcessing ? "Processing..." : "Claim Factory Bonus"}
      </button>
    </div>
  );
};

export default ClaimFactoryBonus;
