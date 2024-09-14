import { useCallback, useEffect } from "react";
import { ADDRESSES } from "../../addresses.ts";
import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";

const Mint = ({
  onMintSuccessful, // Add onMintSuccessful prop
  showModal,
  suiBalance,
}: {
  showModal: (message: string, bgColor: 0 | 1 | 2) => void; // Define showModal prop type with message and bg
  onMintSuccessful: () => void;
  suiBalance: number;
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

  const checkUserBalance = useCallback(() => {
    if (suiBalance < 0.005) {
      showModal("You need more SUI in order to pay gas.", 0);
      throw new Error("You should have more SUI in order to pay gas.");
    }

    return true;
  }, [suiBalance, showModal]);

  const mint = useCallback(async () => {
    try {
      const transactionBlock = new Transaction();
      await checkUserBalance(); // Check user balance before proceeding
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
          onSuccess: (result) => {
            console.log("Mint successful ", result);

            onMintSuccessful(); // Trigger the success callback
          },
          onError: (error) => {
            console.error("Mint error:", error);
            showModal(`Error: ${error}`, 0); // Show success message in the modal
          },
        }
      );
    } catch (error) {
      console.error("Mint Error:", error);
    }
  }, [signAndExecute, onMintSuccessful]);

  const reset = useCallback(() => {}, []);

  useEffect(() => {
    reset();
  }, [reset]);

  return (
    <div className="flex flex-col gap-6">
      <button
        className="mx-auto px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        onClick={mint}
      >
        Build your SuiCity
      </button>
    </div>
  );
};

export default Mint;
