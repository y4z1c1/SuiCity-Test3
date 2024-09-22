import { useCallback, useEffect } from "react";
import { ADDRESSES } from "../../addresses.ts";
import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { bcs } from "@mysten/sui/bcs";

// Helper function to convert hex string to Uint8Array
const hexToUint8Array = (hexString: string) => {
  if (hexString.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const array = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    array[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return array;
};

const ClaimReward = ({
  onClaimSuccessful,
  showModal,
  mySignature, // Signature in hex format from the backend
  hashedMessage, // Hashed message in hex format from the backend
  amount, // Amount of SITY tokens to claim
}: {
  showModal: (message: string, bgColor: 0 | 1 | 2) => void; // Define showModal prop type with message and bg
  onClaimSuccessful: () => void;
  mySignature: string; // Hex-encoded signature from the backend
  hashedMessage: string; // Hex-encoded hashed message
  amount: number; // Amount of SITY to claim
}) => {
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          // Raw effects are required so the effects can be reported back to the wallet
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  const claimReward = useCallback(async () => {
    try {
      console.log("ClaimReward function invoked");
      console.log("Signature received (hex):", mySignature);
      console.log("Hashed message received (hex):", hashedMessage);
      console.log("Amount to claim:", amount);

      // Convert the hex signature to Uint8Array
      const signatureArray = hexToUint8Array(mySignature);
      console.log("Signature array (Uint8Array):", signatureArray);

      const transactionBlock = new Transaction();

      // Add the Move function call for claim_reward
      transactionBlock.moveCall({
        target: `${ADDRESSES.PACKAGE}::nft::claim_reward`,
        arguments: [
          transactionBlock.object(`${ADDRESSES.GAME}`), // Game data object
          transactionBlock.pure(bcs.vector(bcs.U8).serialize(signatureArray)), // Serialize Uint8Array for signature
          transactionBlock.pure.string(hashedMessage), // Serialize Uint8Array for hashed message
          transactionBlock.pure.u64(BigInt(amount * 1000)), // Amount as u64
        ],
      });

      console.log("Transaction prepared. Executing...");

      signAndExecute(
        {
          transaction: transactionBlock,
        },
        {
          onSuccess: (result) => {
            console.log("Claim successful", result);
            onClaimSuccessful(); // Trigger the success callback
          },
          onError: (error) => {
            console.error("Claim error:", error);
            showModal(`🚫 Error: ${error}`, 0); // Show error message in the modal
          },
        }
      );
    } catch (error) {
      console.error("Claim Error:", error);
    }
  }, [signAndExecute, onClaimSuccessful, mySignature, hashedMessage, amount]);

  const reset = useCallback(() => {
    console.log("Reset function called");
  }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="claim-reward">
      <button
        onClick={claimReward}
      >
        🎁 Claim {amount} $SITY Allocation
      </button>
    </div>
  );
};

export default ClaimReward;
