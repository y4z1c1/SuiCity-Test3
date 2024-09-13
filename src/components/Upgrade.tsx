import { useCallback, useEffect, useMemo, useState } from "react";
import { ADDRESSES } from "../../addresses";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { MIST_PER_SUI } from "@mysten/sui/utils";

const Upgrade = ({
  nft,
  buildingType, // 0 for office, 1 for factory, 2 for house, 3 for entertainment_complex
  onUpgradeSuccess,
  onClick,
  onError,
  gameData, // Pass the gameData object containing cost_multiplier and other values
  showModal, // Add showModal as a prop
  isTouchDevice, // Add isTouchDevice as a prop
}: {
  nft: any;
  buildingType: number;
  onUpgradeSuccess: () => void;
  onClick: () => void;
  onError: () => void;
  gameData: any; // Add gameData as a prop
  showModal: (message: string) => void; // Define showModal prop type
  isTouchDevice: boolean; // Define the type for isTouchDevice
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const [clickCount, setClickCount] = useState(0);
  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
          showBalanceChanges: true,
        },
      }),
  });

  // Memoize currentLevel to avoid recalculating on every render
  const currentLevel = useMemo(() => {
    if (!nft?.content?.fields) {
      console.warn("nft or nft fields are not available yet");
      return 0;
    }
    switch (buildingType) {
      case 0:
        return nft.content.fields.residental_office;
      case 1:
        return nft.content.fields.factory;
      case 2:
        return nft.content.fields.house;
      case 3:
        return nft.content.fields.entertainment_complex;
      default:
        console.log("Unknown building type");
        return 0;
    }
  }, [nft, buildingType]);

  // Memoized function to calculate the upgrade costs based on level and building type
  const getUpgradeCosts = useCallback(
    (level: number) => {
      const officeHouseCosts = [
        { sui: 1, sity: 0 },
        { sui: 0, sity: 240 },
        { sui: 5, sity: 0 },
        { sui: 0, sity: 1280 },
        { sui: 25, sity: 0 },
        { sui: 0, sity: 5120 },
        { sui: 100, sity: 0 },
        { sui: 0, sity: 0 },
      ];

      const factoryEntertainmentCosts = [
        { sui: 0, sity: 80 },
        { sui: 2.25, sity: 0 },
        { sui: 0, sity: 640 },
        { sui: 12, sity: 0 },
        { sui: 0, sity: 2560 },
        { sui: 50, sity: 0 },
        { sui: 0, sity: 10240 },
        { sui: 0, sity: 0 },
      ];

      const baseCosts =
        buildingType === 0 || buildingType === 2
          ? officeHouseCosts[level]
          : factoryEntertainmentCosts[level];

      const costMultiplier = gameData?.cost_multiplier || 100;
      return {
        sui:
          Math.round(
            baseCosts.sui * Number(MIST_PER_SUI) * (costMultiplier / 100) * 100
          ) / 100,
        sity:
          Math.round(baseCosts.sity * 1000 * (costMultiplier / 100) * 100) /
          100,
      };
    },
    [buildingType, gameData]
  );
  const costs = useMemo(
    () => getUpgradeCosts(currentLevel),
    [currentLevel, getUpgradeCosts]
  );
  // Function to check user's balance before initiating transaction
  const checkUserBalance = useCallback(
    async (costs: { sui: number; sity: number }) => {
      try {
        // Fetch SUI balance
        const suiBalanceResponse = await suiClient.getBalance({
          owner: String(account?.address),
        });
        const suiBalance = parseInt(suiBalanceResponse.totalBalance);

        // Fetch SITY balance
        const sityBalanceResponse = await suiClient.getBalance({
          owner: String(account?.address),
          coinType: `${ADDRESSES.TOKEN_TYPE}`,
        });
        const sityBalance = parseInt(sityBalanceResponse.totalBalance);

        if (costs.sui > 0 && suiBalance < costs.sui) {
          showModal(
            "Insufficient SUI balance. You need more SUI to upgrade this building."
          );

          throw new Error("Insufficient SUI balance.");
        }
        if (costs.sity > 0 && sityBalance < costs.sity) {
          showModal(
            "Insufficient SITY balance. You need more SITY to upgrade this building."
          );

          throw new Error("Insufficient SITY balance.");
        }

        return true;
      } catch (error) {
        console.error("Error checking user balance:", error);
        if (error instanceof Error) {
          console.log(error.message || "Error checking balance.");
        } else {
          console.log("Error checking balance.");
        }
        setIsProcessing(false); // Reset processing on error
        throw error; // Re-throw the error to be caught in the upgrade function
      }
    },
    [account?.address, suiClient]
  );

  // Upgrade logic
  const upgrade = useCallback(async () => {
    try {
      setIsProcessing(true); // Set processing state
      console.log("Processing your upgrade...");

      if (!nft?.content?.fields) {
        console.error(
          "nft or nft fields are missing, cannot proceed with upgrade."
        );
        return;
      }

      const costs = getUpgradeCosts(currentLevel);

      // Check if the user has sufficient balance before proceeding
      await checkUserBalance(costs); // Throws error if balance is insufficient

      const transactionBlock = new Transaction();
      transactionBlock.setSender(String(account?.address));
      console.log("Upgrade with SITY:", costs.sity * Number(MIST_PER_SUI));

      // Handle SUI-based upgrades
      if (costs.sui > 0) {
        transactionBlock.moveCall({
          target: `${ADDRESSES.PACKAGE}::nft::upgrade_building_with_sui`,
          arguments: [
            transactionBlock.objectRef({
              objectId: nft.objectId,
              digest: nft.digest,
              version: nft.version,
            }),
            transactionBlock.object(ADDRESSES.GAME),
            transactionBlock.object(String(buildingType)),
            coinWithBalance({ balance: costs.sui }),
            transactionBlock.object(ADDRESSES.CLOCK),
          ],
        });

        signAndExecute(
          { transaction: transactionBlock },
          {
            onSuccess: () => {
              console.log("Upgrade successful with SUI");
              console.log("Upgrade successful! SUI used.");
              showModal("Upgrade successful!"); // Show success message in the modal

              onUpgradeSuccess();
              setIsProcessing(false); // Reset processing state after success
            },
            onError: (error) => {
              console.error("Upgrade error with SUI", error);
              console.log("Error: Unable to process SUI transaction.");
              showModal("Error: Unable to process SUI transaction."); // Show success message in the modal

              setIsProcessing(false); // Reset processing state on error
              onError();
            },
          }
        );
      }
      // Handle SITY-based upgrades
      else if (costs.sity > 0) {
        transactionBlock.setGasBudgetIfNotSet(10000000);
        console.log("Upgrade with SITY:", costs.sity * 1000);
        transactionBlock.moveCall({
          target: `${ADDRESSES.PACKAGE}::nft::upgrade_building_with_sity`,
          arguments: [
            transactionBlock.object(nft.objectId),
            transactionBlock.object(ADDRESSES.GAME),
            transactionBlock.object(String(buildingType)),
            coinWithBalance({
              balance: costs.sity,
              type: `${ADDRESSES.TOKEN_TYPE}`,
            }),
            transactionBlock.object(ADDRESSES.CLOCK),
          ],
        });

        signAndExecute(
          { transaction: transactionBlock },
          {
            onSuccess: () => {
              console.log("Upgrade successful with SITY");
              console.log("Upgrade successful! SITY used.");
              showModal("Upgrade successful!"); // Show success message in the modal

              onUpgradeSuccess();
              setIsProcessing(false); // Reset processing state after success
            },
            onError: (error) => {
              console.error("Upgrade error with SITY", error);
              console.log("Error: Unable to process SITY transaction.");
              showModal("Error: Unable to process SUI transaction."); // Show success message in the modal

              setIsProcessing(false); // Reset processing state on error
              onError();
            },
          }
        );
      }
    } catch (error) {
      console.error("Upgrade Error:", error);
      if (error instanceof Error) {
        console.log(error.message || "Error occurred during the upgrade.");
      } else {
        console.log("Error occurred during the upgrade.");
        showModal("Error occurred during the upgrade."); // Show success message in the modal
      }
      setIsProcessing(false); // Reset processing state on general error
      onError();
    }
  }, [
    nft,
    buildingType,
    currentLevel,
    getUpgradeCosts,
    signAndExecute,
    onUpgradeSuccess,
    onError,
    checkUserBalance, // Include the balance check logic in the dependencies
  ]);

  // Update the message with current upgrade costs on each change
  useEffect(() => {
    const costs = getUpgradeCosts(currentLevel);
    if (costs.sui > 0) {
      console.log(
        `Upgrade for ${(costs.sui / Number(MIST_PER_SUI)).toFixed(2)} SUI`
      );
    } else if (costs.sity > 0) {
      console.log(`Upgrade for ${(costs.sity / 1000).toFixed(2)} SITY`);
    } else {
      console.log("No upgrades available");
    }
  }, [currentLevel, getUpgradeCosts]);
  const handleClick = () => {
    setClickCount((prevCount) => prevCount + 1);
    console.log("Click count:", clickCount);

    console.log("Touch device:", isTouchDevice);
    if (isTouchDevice) {
      if (clickCount === 1) {
        // Trigger upgrade on the second click for mobile devices
        upgrade();
        setClickCount(0); // Reset click count after triggering upgrade
      }
    } else {
      upgrade(); // Directly trigger upgrade for non-touch devices
    }
  };
  return (
    <div>
      {currentLevel < 7 ? (
        <>
          <button
            onClick={() => {
              onClick(); // Notify parent component to pause accumulation
              handleClick(); // Handle the upgrade logic
            }}
            disabled={isProcessing || !nft?.content?.fields} // Disable button if processing or nft is not ready
          >
            {isProcessing
              ? "Processing..."
              : costs.sui > 0
              ? `Upgrade for ${(costs.sui / Number(MIST_PER_SUI)).toFixed(
                  2
                )} $SUI`
              : `Upgrade for ${(costs.sity / 1000).toFixed(2)} $SITY`}
          </button>
        </>
      ) : (
        <p>Max level reached</p> // Message when the level is maxed out
      )}
    </div>
  );
};

export default Upgrade;
