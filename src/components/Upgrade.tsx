import { useCallback, useMemo, useState } from "react";
import { ADDRESSES } from "../../addresses";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { MIST_PER_SUI } from "@mysten/sui/utils";

const Upgrade = ({
  buildingType, // 0 for office, 1 for factory, 2 for house, 3 for entertainment_complex
  officeLevel, // Level of the residential office
  factoryLevel, // Level of the factory
  houseLevel, // Level of the house
  enterLevel, // Level of the entertainment complex
  onUpgradeSuccess,
  onClick,
  onError,
  gameData, // Pass the gameData object containing cost_multiplier and other values
  showModal, // Add showModal as a prop
  // Add isTouchDevice as a prop
  suiBalance, // Receive SUI balance as prop
  sityBalance, // Receive SITY balance as prop
  nft, // Include the NFT object for transaction purposes
  isExpanded, // New prop

}: {
  buildingType: number;
  officeLevel: number;
  factoryLevel: number;
  houseLevel: number;
  enterLevel: number;
  onUpgradeSuccess: () => void;
  onClick: () => void;
  onError: () => void;
  suiBalance: number; // Add SUI balance as prop
  sityBalance: number; // Add SITY balance as prop
  gameData: any; // Add gameData as a prop
  showModal: (message: string, bgColor: 0 | 1 | 2) => void; // Define showModal prop type with message and bg
  isTouchDevice: boolean; // Define the type for isTouchDevice
  nft: any;
  isExpanded: boolean; // New prop

}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const account = useCurrentAccount();
  const suiClient = useSuiClient();

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        requestType: "WaitForEffectsCert",
        options: {
          showRawEffects: true,
          showEffects: true,
          showBalanceChanges: true,
        },
      }),
  });

  // Memoized current level based on building type
  const currentLevel = useMemo(() => {
    switch (buildingType) {
      case 0:
        return officeLevel;
      case 1:
        return factoryLevel;
      case 2:
        return houseLevel;
      case 3:
        return enterLevel;
      default:
        console.log("Unknown building type");
        return 0;
    }
  }, [buildingType, officeLevel, factoryLevel, houseLevel, enterLevel]);

  // Memoized function to calculate the upgrade costs based on level and building type
  const getUpgradeCosts = useCallback(
    (level: number) => {
      const officeHouseCosts = [
        { sui: 0.8, sity: 0 },
        { sui: 0, sity: 620 },
        { sui: 4, sity: 0 },
        { sui: 0, sity: 2900 },
        { sui: 20, sity: 0 },
        { sui: 0, sity: 9400 },
        { sui: 75, sity: 0 },
        { sui: 0, sity: 0 },
      ];

      const factoryCosts = [
        { sui: 0, sity: 200 },
        { sui: 0, sity: 620 },
        { sui: 0, sity: 1400 },
        { sui: 9.5, sity: 0 },
        { sui: 0, sity: 6200 },
        { sui: 35, sity: 0 },
        { sui: 0, sity: 20000 },
        { sui: 0, sity: 0 },
      ];

      const enterCosts = [
        { sui: 0, sity: 200 },
        { sui: 1.8, sity: 0 },
        { sui: 0, sity: 1400 },
        { sui: 9.5, sity: 0 },
        { sui: 0, sity: 6200 },
        { sui: 35, sity: 0 },
        { sui: 0, sity: 20000 },
        { sui: 0, sity: 0 },
      ];

      const baseCosts =
        buildingType === 0 || buildingType === 2
          ? officeHouseCosts[level]
          : buildingType === 1 ? factoryCosts[level]
            : enterCosts[level];

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
  const checkUserBalance = useCallback(() => {
    if (suiBalance < 0.01) {
      showModal("❗️ You need more SUI in order to pay gas.", 0);
      throw new Error("You need more SUI in order to pay gas.");
    }

    if (costs.sui > 0 && suiBalance * Number(MIST_PER_SUI) < costs.sui) {
      showModal("❗️ Insufficient SUI balance.", 0);
      throw new Error("Insufficient SUI balance.");
    }

    if (costs.sity > 0 && sityBalance * 1000 < costs.sity) {
      showModal("❗️ Insufficient SITY balance.", 0);
      throw new Error("Insufficient SITY balance.");
    }

    return true;
  }, [costs, suiBalance, sityBalance, showModal]);

  // Upgrade logic
  const upgrade = useCallback(async () => {
    try {
      setIsProcessing(true); // Set processing state
      console.log("Processing your upgrade...");

      const costs = getUpgradeCosts(currentLevel);

      // Check if the user has sufficient balance before proceeding
      checkUserBalance(); // Throws error if balance is insufficient

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
            onSuccess: (result) => {
              console.log("Upgrade successful with SUI", result);
              showModal("✅ Upgrade successful!", 1); // Show success message in the modal
              onUpgradeSuccess();
              setIsProcessing(false); // Reset processing state after success
            },
            onError: (error) => {
              console.error("Upgrade error with SUI", error);
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
            transactionBlock.objectRef({
              objectId: nft.objectId,
              digest: nft.digest,
              version: nft.version,
            }),
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
              showModal("✅ Upgrade successful!", 1); // Show success message in the modal
              onUpgradeSuccess();
              setIsProcessing(false); // Reset processing state after success
            },
            onError: (error) => {
              console.error("Upgrade error with SITY", error);
              showModal(`🚫 Error: ${error}`, 0); // Show error message in the modal
              setIsProcessing(false); // Reset processing state on error
              onError();
            },
          }
        );
      }
    } catch (error) {
      console.error("Upgrade Error:", error);
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

  const handleClick = () => {
    if (isExpanded) {
      // Perform the upgrade logic only if the building is already expanded
      onClick();
      upgrade(); // Call the upgrade function
      console.log("Upgrade initiated...");
    } else {
      onClick();

      // Do nothing except expanding the building
      console.log("Building expanded, click again to upgrade.");
    }
  };

  return (
    <div>
      {currentLevel < 7 ? (
        <>
          <button
            onClick={() => {
              handleClick(); // Handle the upgrade logic
            }}
            disabled={isProcessing} // Disable button if processing
          >
            {isProcessing
              ? "Processing..."
              : !isExpanded // If not expanded, show only "Upgrade"
                ? "Upgrade"
                : costs.sui > 0
                  ? `Upgrade for ${(costs.sui / Number(MIST_PER_SUI)).toFixed(2)} $SUI`
                  : `Upgrade for ${(costs.sity / 1000).toFixed(2)} $SITY`}
          </button>
        </>
      ) : (
        <p>Max level reached 🎉</p> // Message when the level is maxed out
      )}
    </div>
  );
};

export default Upgrade;
