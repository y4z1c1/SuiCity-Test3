import "./App.css";
import { useEffect, useState, useRef, useCallback } from "react";
import Mint from "./components/Mint";
import Upgrade from "./components/Upgrade";
import Claim from "./components/Claim";
import ClaimFactoryBonus from "./components/ClaimFactoryBonus";
import { ADDRESSES } from "../addresses";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import {
  ConnectButton,
  useCurrentWallet,
  useCurrentAccount,
} from "@mysten/dapp-kit";
import { MIST_PER_SUI } from "@mysten/sui/utils";

function App() {
  const { connectionStatus } = useCurrentWallet();
  const account = useCurrentAccount();

  const [filteredNft, setFilteredNft] = useState<any>(null); // Storing only a single filtered NFT
  const [accumulatedSity, setAccumulatedSity] = useState<number>(0);
  const [gameData, setGameData] = useState<any>(null);
  const [sityBalance, setSityBalance] = useState<number>(0);
  const [suiBalance, setSuiBalance] = useState<number>(0);
  const [isTransactionInProgress, setTransactionInProgress] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [factoryBonusCountdown, setFactoryBonusCountdown] = useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state
  const [isAwaitingBlockchain, setIsAwaitingBlockchain] =
    useState<boolean>(false);
  const accumulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const provider = new SuiClient({
    url: getFullnodeUrl("testnet"),
  });

  // Helper to fetch balances
  const fetchBalances = useCallback(async () => {
    console.log("Fetching balances...");
    try {
      const [sityResponse, suiResponse] = await Promise.all([
        provider.getBalance({
          owner: String(account?.address),
          coinType: `${ADDRESSES.TOKEN_TYPE}`,
        }),
        provider.getBalance({ owner: String(account?.address) }),
      ]);

      console.log("SITY balance fetched:", sityResponse.totalBalance);
      console.log("SUI balance fetched:", suiResponse.totalBalance);

      setSityBalance(parseInt(sityResponse.totalBalance) / 1000);
      setSuiBalance(parseInt(suiResponse.totalBalance) / Number(MIST_PER_SUI));
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  }, [account?.address]);

  // Helper to fetch game data
  const fetchGameData = useCallback(async () => {
    console.log("Fetching game data...");
    try {
      const gameDataResponse = await provider.getObject({
        id: ADDRESSES.GAME,
        options: { showContent: true },
      });

      // Safely check for 'fields' in the content of the response
      const content = gameDataResponse?.data?.content;

      if (content && "fields" in content) {
        console.log("Game data fetched successfully:", content.fields);
        setGameData(content.fields); // This is safe now
      } else {
        console.warn("No fields found in the game data response.");
      }
    } catch (error) {
      console.error("Error fetching game data:", error);
    }
  }, []);

  const calculateCountdown = (nft: any) => {
    const houseLevel = nft.content.fields?.house || 0;
    const entertainmentComplexLevel =
      nft.content.fields?.entertainment_complex || 0;
    const maxTime = calculateMaxAccumulation(
      houseLevel,
      entertainmentComplexLevel
    );
    const currentTime = Date.now();
    const lastClaimedTimestamp = nft.content.fields?.last_claimed;
    const elapsedTime = currentTime - lastClaimedTimestamp;
    const remainingTime = maxTime - elapsedTime;

    return remainingTime > 0 ? remainingTime : 0;
  };

  const calculateFactoryBonusCountdown = (nft: any) => {
    const currentTime = Date.now();
    const lastDailyBonus = nft.content.fields?.last_daily_bonus;
    const elapsedTime = currentTime - lastDailyBonus;

    const bonusPeriod = (24 * 3600 * 1000) / gameData.speed; // 24 hours divided by game speed
    const remainingTime = bonusPeriod - elapsedTime;

    return remainingTime > 0 ? remainingTime : null;
  };

  const startCountdownInterval = (nft: any) => {
    console.log("Starting countdown interval...");
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      const newCountdown = calculateCountdown(nft);
      const newFactoryBonusCountdown = calculateFactoryBonusCountdown(nft);

      console.log("Updated countdown:", newCountdown);
      console.log("Updated factory bonus countdown:", newFactoryBonusCountdown);

      setCountdown(newCountdown);
      setFactoryBonusCountdown(newFactoryBonusCountdown);
    }, 1000); // Update every second
  };

  useEffect(() => {
    console.log("Checking if countdown and accumulation can start...");
    if (filteredNft && gameData && !isLoading && !isAwaitingBlockchain) {
      console.log("Starting accumulation and countdown...");
      const nft = filteredNft;
      startAccumulation(nft);
      startCountdownInterval(nft);

      return () => {
        if (accumulationIntervalRef.current)
          clearInterval(accumulationIntervalRef.current);
        if (countdownIntervalRef.current)
          clearInterval(countdownIntervalRef.current);
      };
    }
  }, [
    filteredNft,
    gameData,
    isLoading,
    isAwaitingBlockchain,
    isTransactionInProgress,
  ]);

  const handleUpgradeSuccess = () => {
    setTimeout(() => {
      console.log("UPGRADE SUCCESSFUL, awaiting new data...");
      setIsAwaitingBlockchain(true);
      refreshNft();
      fetchBalances();
      setTransactionInProgress(false);
    }, 2000); // 2000 milliseconds = 2 seconds
  };

  const handleClaimSuccess = () => {
    setTimeout(() => {
      console.log("CLAIM SUCCESSFUL, awaiting new data...");
      refreshNft();
      setIsAwaitingBlockchain(true);

      fetchBalances();
      setTransactionInProgress(false);
    }, 2000); // 2000 milliseconds = 2 seconds
    console.log("OUT");
  };

  // Helper to refresh NFTs
  const refreshNft = useCallback(async () => {
    console.log("Refreshing NFTs...");
    try {
      const allObjects: any[] = [];
      let lastObject = null;
      let hasMore = true;

      while (hasMore) {
        const object = await provider.getOwnedObjects({
          owner: String(account?.address),
          cursor:
            lastObject?.data?.[lastObject.data.length - 1]?.data?.objectId ||
            null,
          options: { showType: true, showContent: true },
        });

        allObjects.push(...object.data);

        if (object.data.length === 0 || !object.nextCursor) {
          hasMore = false;
        } else {
          lastObject = object;
        }
      }

      const nft = allObjects.find(
        (nft) => String(nft.data?.type) === `${ADDRESSES.NFT_TYPE}`
      );
      console.log("Filtered NFT found:", nft?.data);

      setFilteredNft(nft?.data || null);
      setIsLoading(false); // Mark loading as complete once NFT is fetched
      setIsAwaitingBlockchain(false); // Re-enable interaction and accumulation process
    } catch (error) {
      console.error("Error refreshing NFTs:", error);
      setIsLoading(false); // Stop loading if error occurs
      setIsAwaitingBlockchain(false); // Re-enable interaction and accumulation process
    }
  }, [account?.address]);

  // Re-fetch NFTs and balances when account changes
  useEffect(() => {
    if (account?.address) {
      console.log("Account changed, resetting state and fetching data...");
      setFilteredNft(null); // Reset NFT state
      setIsLoading(true); // Start loading when account changes
      refreshNft();
      fetchGameData();
      fetchBalances();
    }
  }, [account?.address, refreshNft, fetchGameData, fetchBalances]);

  const calculateAccumulatedSity = useCallback(
    (nft: any) => {
      if (!nft || !gameData) return 0;

      const lastClaimedTimestamp = nft.content.fields?.last_accumulated;
      const residentialOfficeLevel = nft.content.fields?.residental_office || 0;
      const houseLevel = nft.content.fields?.house || 0;
      const entertainmentComplexLevel =
        nft.content.fields?.entertainment_complex || 0;
      const currentTime = Date.now();
      const elapsedTime = currentTime - lastClaimedTimestamp;

      const maxAccumulationPeriod = calculateMaxAccumulation(
        houseLevel,
        entertainmentComplexLevel
      );
      const effectiveElapsedTime = Math.min(elapsedTime, maxAccumulationPeriod);
      const accumulationPerHour =
        gameData.accumulation_speeds[residentialOfficeLevel];
      const accumulatedSity =
        (effectiveElapsedTime / (3600 * 1000)) * accumulationPerHour;

      console.log("Accumulated SITY:", accumulatedSity);
      return accumulatedSity / 100;
    },
    [gameData]
  );

  const calculateMaxAccumulation = useCallback(
    (houseLevel: number, entertainmentLevel: number): number => {
      const houseLevelInt = parseInt(String(houseLevel), 10);
      const entertainmentLevelInt = parseInt(String(entertainmentLevel), 10);
      const totalLevel = houseLevelInt + entertainmentLevelInt;

      if (totalLevel === 0) {
        return (3 * 3600 * 1000) / gameData.speed;
      } else if (totalLevel <= 7) {
        return ((3 + totalLevel) * 3600 * 1000) / gameData.speed;
      }
      return ((10 + 2 * (totalLevel - 7)) * 3600 * 1000) / gameData.speed;
    },
    [gameData]
  );

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const startAccumulation = (nft: any) => {
    if (!nft || isTransactionInProgress) return;

    console.log("Starting accumulation...");

    // Clear the previous accumulation interval if it exists
    if (accumulationIntervalRef.current)
      clearInterval(accumulationIntervalRef.current);

    // Start a new accumulation interval
    accumulationIntervalRef.current = setInterval(() => {
      const newlyAccumulatedSity = calculateAccumulatedSity(nft);
      console.log("Updated accumulated SITY:", newlyAccumulatedSity);
      setAccumulatedSity(newlyAccumulatedSity);
    }, 100); // Update every second
  };

  useEffect(() => {
    console.log("blochhain wait status:: ", isAwaitingBlockchain);
    console.log("loading  status:: ", isLoading);
  }, [isAwaitingBlockchain, isLoading]);

  useEffect(() => {
    refreshNft();
    fetchGameData();
  }, [account]);

  return (
    <div className="container">
      <div className="upperDiv">
        <ConnectButton />
      </div>
      {connectionStatus === "connected" ? (
        <div>
          {isLoading ? (
            <p>Loading your NFTs and game data...</p> // Show loading message while fetching data
          ) : filteredNft ? (
            <div>
              <div className="upperDiv">
                connected: {account?.address.slice(0, 8)}...
                <p>{`you have: ${sityBalance.toFixed(
                  2
                )} $SITY and ${suiBalance.toFixed(2)} $SUI`}</p>
                {gameData?.speed && <p>{`Game speed: ${gameData.speed}`}</p>}
                {gameData?.cost_multiplier && (
                  <p>{`Cost multiplier: ${(
                    gameData.cost_multiplier / 100
                  ).toFixed(2)}`}</p>
                )}
              </div>

              <div className="centerDiv">
                <p>Your SuiCity:</p>
                <div className="nft-container">
                  <h2>{filteredNft.content.fields.name}</h2>
                  <img
                    src={filteredNft.content.fields.url}
                    alt={filteredNft.content.fields.name}
                  />
                  <p>{`accumulated $SITY: `}</p>
                  <h4>{`${(
                    accumulatedSity +
                    filteredNft.content.fields?.balance / 1000
                  ).toFixed(2)}`}</h4>
                  <p>{`Max accumulation countdown: ${
                    countdown ? formatTime(countdown) : "Accumulation full"
                  }`}</p>

                  {/* Hide buttons while loading */}
                  {!isLoading && (
                    <>
                      <Claim
                        nft={filteredNft}
                        onClaimSuccess={handleClaimSuccess}
                        onClick={() => setTransactionInProgress(true)}
                        onError={() => {
                          setTransactionInProgress(false);
                          refreshNft();
                        }}
                      />

                      <div className="building-grid">
                        <div className="building-item">
                          <p>
                            Office Level:{" "}
                            {filteredNft.content.fields?.residental_office}
                          </p>
                          <Upgrade
                            nft={filteredNft}
                            buildingType={0}
                            onUpgradeSuccess={() => handleUpgradeSuccess()} // Pass the building type and NFT
                            onClick={() => setTransactionInProgress(true)}
                            onError={() => {
                              setTransactionInProgress(false);
                              refreshNft();
                            }}
                            gameData={gameData}
                          />
                        </div>

                        <div className="building-item">
                          <p>
                            Factory Level: {filteredNft.content.fields?.factory}
                          </p>
                          <Upgrade
                            nft={filteredNft}
                            buildingType={1}
                            onUpgradeSuccess={() => handleUpgradeSuccess()} // Pass the building type and NFT
                            onClick={() => setTransactionInProgress(true)}
                            onError={() => {
                              setTransactionInProgress(false);
                              refreshNft();
                            }}
                            gameData={gameData}
                          />
                          <div className="flex flex-row gap-4 justify-center">
                            {factoryBonusCountdown !== null &&
                            factoryBonusCountdown > 0 ? (
                              <p>{`Factory bonus countdown: ${formatTime(
                                factoryBonusCountdown
                              )}`}</p>
                            ) : (
                              <ClaimFactoryBonus
                                nft={filteredNft}
                                onClaimSuccess={handleClaimSuccess}
                                onClick={() => setTransactionInProgress(true)}
                                onError={() => {
                                  setTransactionInProgress(false);
                                  refreshNft();
                                }}
                              />
                            )}
                          </div>
                        </div>

                        <div className="building-item">
                          <p>
                            House Level: {filteredNft.content.fields?.house}
                          </p>
                          <Upgrade
                            nft={filteredNft}
                            buildingType={2}
                            onUpgradeSuccess={() => handleUpgradeSuccess()} // Pass the building type and NFT
                            onClick={() => setTransactionInProgress(true)}
                            onError={() => {
                              setTransactionInProgress(false);
                              refreshNft();
                            }}
                            gameData={gameData}
                          />
                        </div>

                        <div className="building-item">
                          <p>
                            Entertainment Level:{" "}
                            {filteredNft.content.fields?.entertainment_complex}
                          </p>
                          <Upgrade
                            nft={filteredNft}
                            buildingType={3}
                            onUpgradeSuccess={() => handleUpgradeSuccess()} // Pass the building type and NFT
                            onClick={() => setTransactionInProgress(true)}
                            onError={() => {
                              setTransactionInProgress(false);
                              refreshNft();
                            }}
                            gameData={gameData}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <Mint
              onMintSuccessful={() => {
                console.log("Minting was successful! Refreshing data...");
                refreshNft(); // Refresh NFTs after mint
                fetchBalances(); // Fetch updated balances
              }}
            />
          )}
        </div>
      ) : (
        <p>Please connect your wallet</p>
      )}
    </div>
  );
}

export default App;
