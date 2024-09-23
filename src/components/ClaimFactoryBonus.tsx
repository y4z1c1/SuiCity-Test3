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
  suiBalance,
}: {
  nft: any;
  onClaimSuccess: () => void;
  onClick: () => void;
  onError: () => void;
  showModal: (message: string, bgColor: 0 | 1 | 2) => void; // Define showModal prop type with message and bg
  suiBalance: number;
}) => {
  const suiClient = useSuiClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const checkUserBalance = useCallback(() => {
    if (suiBalance < 0.005) {
      showModal("You need more SUI in order to pay gas.", 0);
      throw new Error("You should have more SUI in order to pay gas.");
    }

    return true;
  }, [suiBalance, showModal]);

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

      await checkUserBalance(); // Check user balance before proceeding
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
            showModal(`✅ Bonus claimed successfully!`, 1); // Show success message in the modal

            onClaimSuccess();
          },
          onError: (error) => {
            console.error("Claim failed:", error);
            showModal(`🚫 Error: ${error}`, 0); // Show success message in the modal

            onError();
          },
        }
      );
    } catch (error) {
      console.error("Claim Error:", error);

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
