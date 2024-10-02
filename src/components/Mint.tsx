import { useCallback, useEffect, useState } from "react";
import { ADDRESSES } from "../../addresses.ts";
import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";


const Mint = ({
  onMintSuccessful, // Add onMintSuccessful prop
  showModal,
}: {
  showModal: (message: string, bgColor: 0 | 1 | 2) => void; // Define showModal prop type with message and bg
  onMintSuccessful: () => void;
}) => {
  const suiClient = useSuiClient();
  const [loading, setLoading] = useState<boolean>(false); // Add loading state

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  const mint = useCallback(async () => {
    setLoading(true); // Set loading to true
    try {
      const transactionBlock = new Transaction();
      transactionBlock.moveCall({
        target: `${ADDRESSES.PACKAGE}::nft::build_city`,
        arguments: [
          transactionBlock.object(`${ADDRESSES.GAME}`),
          transactionBlock.object(`${ADDRESSES.CLOCK}`),
        ],
      });

      signAndExecute(
        {
          transaction: transactionBlock,
        },
        {
          onSuccess: async (result) => {
            console.log("Mint successful ", result);

            const created = result.effects?.created;
            if (created && created.length > 0) {
              const nftId = created[0].reference.objectId;
              console.log("NFT created with ID:", nftId);
            } else {
              console.error("No NFT created");
            }

            onMintSuccessful(); // Trigger the success callback
          },
          onError: (error) => {
            console.error("Mint error:", error);
            showModal(`🚫 Error: ${error}`, 0); // Show error message in the modal
          },
        }
      );
    } catch (error) {
      console.error("Mint Error:", error);
      showModal("🚫 Error minting NFT", 0);
    } finally {
      setLoading(false); // Stop loading when mint is done
    }
  }, [signAndExecute, onMintSuccessful]);

  const reset = useCallback(() => { }, []);

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="flex flex-col gap-6">
      <button
        className="mint-button"
        onClick={mint}
        disabled={loading} // Disable button while minting
      >
        {loading ? "Minting..." : "🏙️ Free Mint your SuiCity"}
      </button>

      <p>You will be able to claim your tokens after minting.</p>
    </div>
  );
};

export default Mint;
