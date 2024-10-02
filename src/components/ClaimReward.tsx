import { useCallback, useEffect, useState } from "react";
import { ADDRESSES } from "../../addresses.ts";
import { Transaction } from "@mysten/sui/transactions";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { bcs } from "@mysten/sui/bcs";
import { useCurrentAccount } from "@mysten/dapp-kit";

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
  walletObject,
}: {
  showModal: (message: string, bgColor: 0 | 1 | 2) => void; // Define showModal prop type with message and bg
  onClaimSuccessful: () => void;
  mySignature: string; // Hex-encoded signature from the backend
  hashedMessage: string | null; // Hex-encoded hashed message
  amount: number; // Amount of SITY to claim
  walletObject: any;

}) => {

  const [hasNftInDb, setHasNftInDb] = useState<boolean | null>(null);
  const [isCheckingNft, setIsCheckingNft] = useState(true); // Track NFT check loading state
  const [isClaiming, setIsClaiming] = useState(false); // Track claim loading state

  const handleClaimClick = async () => {
    setIsClaiming(true); // Start claim loading state
    setHasNftInDb(null); // Reset NFT status
    await checkIfUserHasNft(); // Recheck NFT status before claim

    if (hasNftInDb == false) {
      await claimReward(); // Proceed with the claim if no NFT in the database
    } else {
      localStorage.removeItem("airdrop_signature");
      localStorage.removeItem("total_airdrop");
      showModal("❌ You already claimed your airdrop!", 0); // Show error if NFT exists
    }

    setIsClaiming(false); // End claim loading state
  };

  const currentAccount = useCurrentAccount();
  const checkIfUserHasNft = useCallback(async () => {
    setIsCheckingNft(true); // Start loading state
    try {
      const response = await fetch(
        `/.netlify/functions/check-nft?walletAddress=${currentAccount?.address}`, // Add walletAddress as query parameter
        {
          method: "GET", // Change to GET request
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        console.log("data is: ", data);
        setHasNftInDb(data.hasNft); // Update the state based on the response
        if (data.hasNft) {
          localStorage.removeItem("airdrop_signature");
          localStorage.removeItem("total_airdrop");
        }
        setIsCheckingNft(false); // End loading state
      } else {
        console.error("Failed to check NFT status:", data.error);
        setHasNftInDb(true); // Set to false if no NFT found or error occurred
        setIsCheckingNft(false); // End loading state
      }
    } catch (error) {
      setHasNftInDb(true); // Set to false in case of an error
      setIsCheckingNft(false); // End loading state
      console.error("Error checking if user has NFT:", error);
    }
  }, [currentAccount?.address]);

  useEffect(() => {
    checkIfUserHasNft();
  }, [checkIfUserHasNft]);

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

      // Convert the hex signature to Uint8Array
      const signatureArray = hexToUint8Array(mySignature);

      console.log("Message is:", hashedMessage);

      const transactionBlock = new Transaction();



      // Add the Move function call for claim_reward
      transactionBlock.moveCall({
        target: `${ADDRESSES.PACKAGE}::nft::claim_reward`,
        arguments: [
          transactionBlock.object(`${ADDRESSES.GAME}`), // Game data object
          transactionBlock.object(`${walletObject}`), // Wallet object
          transactionBlock.pure(bcs.vector(bcs.U8).serialize(signatureArray)), // Serialize Uint8Array for signature
          transactionBlock.pure.string(String(hashedMessage)), // Serialize Uint8Array for hashed message
        ],
      });


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
      {isCheckingNft || isClaiming ? (
        <><p style={{ color: "white" }}>loading...</p></>
      ) : hasNftInDb ? (<></>
      ) : (
        <button onClick={handleClaimClick} disabled={isCheckingNft || isClaiming}>
          🎁 Claim {amount} $SITY Allocation
        </button>
      )}
    </div>
  );
};

export default ClaimReward;
