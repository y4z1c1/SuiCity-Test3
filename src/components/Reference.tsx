import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit"; // Assuming you're using this hook for current account
import ClaimReference from "./ClaimReference";

interface ReferenceProps {
    nft: any;
    showModal: (message: string, bgColor: 0 | 1 | 2) => void; // Modal handler for success/error messages
    officeLevel: number;
    factoryLevel: number;
    houseLevel: number;
    enterLevel: number;

    currentNonce: number | null;
    onClaimSuccessful: () => void;
}

const Reference = ({ nft, showModal, officeLevel, factoryLevel, houseLevel, enterLevel, currentNonce, onClaimSuccessful }: ReferenceProps) => {
    const currentAccount = useCurrentAccount(); // Get current wallet address
    const [refNumber, setRefNumber] = useState<number | null>(null); // State for reference number
    const [usedRefs, setUsedRefs] = useState<string[]>([]); // List of used references
    const [, setNewUsedRefs] = useState<string[]>([]); // List of new used references
    const [refUsed, setRefUsed] = useState<boolean>(false); // State for reference usage

    // Check if the reference has already been used (from nft content)
    useEffect(() => {
        if (nft?.content?.fields?.ref_used) {
            setRefUsed(nft.content.fields.ref_used); // Set refUsed if it's true
        }
    }, [nft]);

    useEffect(() => {
        const fetchReferences = async () => {
            await fetchUsedRefs(); // Initial fetch when the user lands on the page
        };

        fetchReferences(); // Immediately fetch references when component mounts

        // Set up an interval to fetch references every 15 minutes
        const intervalId = setInterval(() => {
            console.log("Fetching used references...");
            fetchUsedRefs(); // Fetch references every 15 minutes
        }, 900000); // 900,000 milliseconds = 15 minutes

        // Cleanup the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, [currentAccount]); // Dependency array includes currentAccount


    // Fetch reference number from backend
    const fetchRefNumber = async () => {
        if (!currentAccount?.address || !nft) {  // Ensure that nft is available
            console.error("No wallet address or NFT found.");
            return;
        }

        try {
            const response = await fetch("/.netlify/functions/get-ref-number", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ walletAddress: currentAccount.address }),
            });

            const data = await response.json();
            if (data.refNumber) {
                setRefNumber(data.refNumber); // Set the reference number in state
            } else {
                console.error("Reference number not found:", data.error);
                showModal("❗️ Reference number not found.", 0); // Show error modal
            }
        } catch (error) {
            console.error("Error fetching reference number:", error);
            if (error instanceof Error) {
                showModal(`🚫 Error fetching reference number: ${error.message}`, 0); // Show error modal
            } else {
                showModal("🚫 Error fetching reference number.", 0); // Show generic error modal
            }
        }
    };

    // Fetch usedRefs and newRefs from backend
    const fetchUsedRefs = async () => {
        if (!currentAccount?.address || !nft) {  // Ensure that nft is available
            console.error("No wallet address or NFT found.");
            return;
        }
        try {
            const response = await fetch("/.netlify/functions/get-used-refs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ walletAddress: currentAccount.address }),
            });

            const data = await response.json();
            if (data.usedRefs) {
                console.log("Used references found:", data.usedRefs);
                setUsedRefs(data.usedRefs); // Store all used references
            }
            if (data.newRefs) {
                console.log("New references found:", data.newRefs);
                setNewUsedRefs(data.newRefs); // Notify user of new references
            } else {
                console.error("No new references found:", data.error);
            }
        } catch (error) {
            console.error("Error fetching used refs:", error);
            if (error instanceof Error) {
                console.log(`🚫 Error fetching used references: ${error.message}`, 0); // Show error modal
            } else {
                console.log("🚫 Error fetching used references.", 0); // Show generic error modal
            }
        }
    };

    useEffect(() => {
        fetchUsedRefs(); // Fetch the references on component load
    }, [currentAccount]);

    return (
        <div className="reference-system">
            {/* Generate Reference Code Button */}
            <button className="reference-system-button" onClick={fetchRefNumber} disabled={!!refNumber}>
                {refNumber ? `${refNumber}` : "Generate Reference Code"}
            </button>

            {refNumber && (
                <p>
                    This is your reference code. Share it with your friends to earn rewards when they use it.
                </p>
            )}

            {/* Ensure the levels are treated as numbers before adding them */}
            {currentAccount && !refUsed && (Number(houseLevel) + Number(officeLevel) + Number(factoryLevel) + Number(enterLevel) >= 3) && (
                <ClaimReference
                    nft={nft}
                    currentAccount={currentAccount}
                    onClaimSuccessful={() => {
                        showModal("✅ Claim was successful!", 1);
                        setRefUsed(true); // Set refUsed to true after successful claim
                        onClaimSuccessful(); // Trigger the success callback
                    }}
                    showModal={showModal}
                    currentNonce={currentNonce}
                />
            )}

            {(Number(houseLevel) + Number(officeLevel) + Number(factoryLevel) + Number(enterLevel) < 3) && (
                <p>
                    You need at least 3 total building level to use the reference reward.
                </p>
            )}

            {refUsed && (Number(houseLevel) + Number(officeLevel) + Number(factoryLevel) + Number(enterLevel) >= 3) && (
                <p className="already-used-message">
                    You have already used the reference reward.
                </p>
            )}

            {/* Display the fetched reference numbers */}
            {usedRefs.length > 0 && (
                <div>
                    <h3>👥 Last users who used your reference code:</h3>
                    <ul>
                        {usedRefs.slice(0, 2).map((ref, index) => (
                            <li key={index}>
                                {ref.slice(0, 12)}...{ref.slice(-12)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );

};

export default Reference;
