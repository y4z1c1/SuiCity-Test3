import { useCallback, useEffect } from "react";
import { ADDRESSES } from "../../addresses";
import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";

const Mint = () => {
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
  const mint = useCallback(async () => {
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
          onSuccess: (result) => {
            console.log("mint succssful ", result);
          },
        }
      );
    } catch (error) {
      console.error("Mint Error:", error);
    }
  }, [signAndExecute]);

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
        build your SuiCity
      </button>
    </div>
  );
};

export default Mint;
