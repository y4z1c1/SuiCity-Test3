import { useCallback, useEffect, useState } from "react";
import { BURN } from "../../burn.ts";
import { coinWithBalance, Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const Burn = ({
    onBurnSuccessful,
    showModal,
    nftIdToBurn, // Add nftIdToBurn prop to specify the NFT to burn
}: {
    showModal: (message: string, bgColor: 0 | 1 | 2) => void;
    onBurnSuccessful: () => void;
    nftIdToBurn: string; // NFT ID to burn
}) => {
    const suiClient = useSuiClient();
    const [loading, setLoading] = useState<boolean>(false);
    const account = useCurrentAccount();
    const [, setOldBalance] = useState<number>(0);

    const provider = new SuiClient({
        url: getFullnodeUrl("mainnet"),
    });

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

    const fetchBalances = useCallback(async () => {
        if (!account?.address) return 0; // Return 0 if no account

        try {
            const [sity] = await Promise.all([
                provider.getBalance({
                    owner: String(account?.address),
                    coinType: `${BURN.TOKEN_TYPE}`,
                }),
            ]);

            const fetched = parseInt(sity.totalBalance) / Number(1000);

            // Update state
            setOldBalance(fetched);
            console.log("Fetched balance:", fetched);

            // Return fetched balance
            return fetched;
        } catch (error) {
            console.error("Error fetching balances:", error);
            return 0; // Return 0 on error
        }
    }, [account?.address]);


    const burn = useCallback(async () => {
        const fetchedBalance = await fetchBalances();
        setLoading(true);
        try {
            console.log("Burning NFT:", nftIdToBurn);
            const transactionBlock = new Transaction();

            transactionBlock.moveCall({
                target: `${BURN.PACKAGE}::nft::claim_sity`,
                arguments: [
                    transactionBlock.object(`${nftIdToBurn}`), // Pass the NFT to burn
                    transactionBlock.object(BURN.GAME),
                    transactionBlock.object(BURN.CLOCK),
                ],
            });

            // Since the transaction hasn't executed yet, the balance on-chain hasn't changed.
            // Fetching balances now will still return the same value.

            transactionBlock.moveCall({
                target: `${BURN.PACKAGE}::nft::burn`,
                arguments: [
                    transactionBlock.object(`${nftIdToBurn}`), // Pass the NFT to burn
                ],
            });

            transactionBlock.setSender(String(account?.address));

            transactionBlock.transferObjects(
                [
                    coinWithBalance({
                        type: `${BURN.TOKEN_TYPE}`,
                        balance: fetchedBalance * 1000,
                    }),
                ],
                "0x0000000000000000000000000000000000000000000000000000000000000000",
            );

            signAndExecute(
                {
                    transaction: transactionBlock,
                },
                {
                    onSuccess: async (result) => {
                        console.log("Burn successful", result);
                        // Handle successful burn
                        onBurnSuccessful(); // Trigger the success callback
                    },
                    onError: (error) => {
                        console.error("Burn error:", error);
                        showModal(`🚫 Error: ${error}`, 0); // Show error message in the modal
                    },
                },
            );
        } catch (error) {
            console.error("Burn Error:", error);
            showModal("🚫 Error burning NFT", 0);
        } finally {
            setLoading(false); // Stop loading when the burn is done
        }
    }, [signAndExecute, nftIdToBurn, onBurnSuccessful]);


    const reset = useCallback(() => { }, []);

    useEffect(() => {
        reset();
    }, [reset]);

    return (
        <div className="burn">
            <button
                className="burn-button"
                onClick={burn}
                disabled={loading} // Disable button while burning
            >
                {loading ? "Burning..." : "🔥 Burn your Old NFT"}
            </button>

            <p>This is a one-time process.</p>
        </div>
    );
};

export default Burn;
