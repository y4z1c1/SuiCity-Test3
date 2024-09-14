import "../assets/styles/Game.css";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Mint from "./Mint";
import Balances from "./Balances"; // Import the new Balances component
import Accumulation from "./Accumulation"; // Import the new Balances component
import Building from "./Building"; // Import the Building component
import { ADDRESSES } from "../../addresses";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { useCurrentWallet, useCurrentAccount } from "@mysten/dapp-kit";
import Modal from "./Modal"; // Import the new Modal component
import NftSpecs from "./NftSpecs";
import Population from "./Population";
import TwitterLogin from "./Twitter";

const Game: React.FC = () => {
  const { connectionStatus } = useCurrentWallet();
  const account = useCurrentAccount();

  const [filteredNft, setFilteredNft] = useState<any>(null); // Storing only a single filtered NFT
  const [accumulatedSity, setAccumulatedSity] = useState<number>(0);
  const [gameData, setGameData] = useState<any>(null);
  const [sityBalance, setSityBalance] = useState<number>(0);
  const [suiBalance, setSuiBalance] = useState<number>(0);
  const [isTransactionInProgress, setTransactionInProgress] = useState(false);
  const [transactionType, setTransactionType] = useState<string | null>(null); // Tracks current transaction type
  const [, setCountdown] = useState<number | null>(null);
  const [factoryBonusCountdown, setFactoryBonusCountdown] = useState<
    number | null
  >(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state
  const [isAwaitingBlockchain, setIsAwaitingBlockchain] =
    useState<boolean>(false);
  const accumulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [, setIsUpgradeInfoExpanded] = useState(false); // Track whether upgrade info is expanded
  const [isMobileExpanded, setIsMobileExpanded] = useState(false); // Track whether building is expanded on mobile
  const [bgColor, setBgColor] = useState<0 | 1 | 2>(0); // Default to red (0)
  const [currentBuildingIndex, setCurrentBuildingIndex] = useState<number>(0); // Track current building in the carousel
  const [refreshBalances, setRefreshBalances] = useState(false); // State to trigger balance refresh

  const mintBackgroundUrl = useMemo(
    () =>
      "https://bafybeifzamdszfcbsrlmff7xqpdhjrjrp44u3iqzodm5r3bhg6aiycxjsu.ipfs.w3s.link/mint-2.webp",
    []
  );

  const buildings = useMemo(
    () => [
      {
        type: "R. Office",
        field: "residental_office",
        imageBaseUrl:
          "https://bafybeicirp2yeyxcsta4y4ch4vqslapizvrowwi7enepqvq3s4gncpuwlm.ipfs.w3s.link/",
        buildingUrl:
          "https://bafybeicz5hchwhdfde2pjeo3tbndppqfa7npyyauwi4rjio3edutqok7w4.ipfs.w3s.link/",
      },
      {
        type: "Factory",
        field: "factory",
        imageBaseUrl:
          "https://bafybeih6ncjg3sqkm5jhot7m6brgmub255gdlys6l36lrur5bxgfenswx4.ipfs.w3s.link/",
        buildingUrl:
          "https://bafybeieb6jtila7flzlkybvl36wdrokz37v4nsjbw33itragrpdtl6o36a.ipfs.w3s.link/",
      },
      {
        type: "House",
        field: "house",
        imageBaseUrl:
          "https://bafybeiemoqvgqghpcikmbizqfsh6ujod4m5yuvv3k5lpz43333sjqki7oe.ipfs.w3s.link/",
        buildingUrl:
          "https://bafybeidwyrjf7ivqm76mg2wg3jbwtvo4sifuxkbrar3xzwn7xkugkbiqke.ipfs.w3s.link/",
      },
      {
        type: "E. Complex",
        field: "entertainment_complex",
        imageBaseUrl:
          "https://bafybeifussnaorucnonp6bfpfa3nlum5wvgi7wfrv5usd6h2ubbsv5yizm.ipfs.w3s.link/",
        buildingUrl:
          "https://bafybeibyvpq4sr33flefgewlxhvfyhgqdd5kcycaz2xortm6uqqrp6ahfa.ipfs.w3s.link/",
      },
    ],
    []
  );

  const [backgroundPosition, setBackgroundPosition] = useState({
    x: 50,
    y: 50,
  });
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [isTouchDevice, setIsTouchDevice] = useState(false); // To detect if the device is touch-enabled
  const touchStartRef = useRef<{ x: number; y: number } | null>(null); // To store initial touch position

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);
  // Function to handle mouse movement
  const DAMPING_FACTOR = 0.005;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height } = currentTarget.getBoundingClientRect();

    // Calculate the top 10% and bottom 20% of the element's height
    const topBoundary = height * 0.1;
    const bottomBoundary = height * 0.85;

    // Check if the mouse is within the active area (not within top 10% or bottom 20%)
    if (clientY < topBoundary || clientY > bottomBoundary) {
      return; // Do nothing if the mouse is outside the active area
    }

    const mouseXPercent = (clientX / width) * 100;
    const mouseYPercent = (clientY / height) * 100;

    // Reduce sensitivity by applying a damping factor
    setMousePosition((prevPos) => {
      const newX = prevPos.x + (mouseXPercent - prevPos.x) * DAMPING_FACTOR;
      const newY = prevPos.y + (mouseYPercent - prevPos.y) * DAMPING_FACTOR;

      return { x: newX, y: newY };
    });
  };

  // Function to handle touch start and store initial position
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent default touch behavior (scrolling)
    const { clientX, clientY } = e.touches[0];
    touchStartRef.current = { x: clientX, y: clientY };
  };

  // Function to handle touch movement
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent default touch behavior (scrolling)
    const { clientX, clientY } = e.touches[0];
    const { width, height } = e.currentTarget.getBoundingClientRect();

    if (!touchStartRef.current) return;

    const touchStartX = touchStartRef.current.x;
    const touchStartY = touchStartRef.current.y;

    const deltaX = clientX - touchStartX;
    const deltaY = clientY - touchStartY;

    const moveXPercent = (deltaX / width) * 100;
    const moveYPercent = (deltaY / height) * 100;

    setBackgroundPosition((prevPos) => {
      let newX = prevPos.x - moveXPercent;
      let newY = prevPos.y - moveYPercent;

      newX = Math.max(0, Math.min(newX, 100));
      newY = Math.max(0, Math.min(newY, 100));

      return { x: newX, y: newY };
    });

    touchStartRef.current = { x: clientX, y: clientY };
  };

  // Function to handle touch end (optional reset or cleanup)
  const handleTouchEnd = () => {
    touchStartRef.current = null; // Reset the reference when the touch ends
  };

  // Inside your Game component
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage(null); // Clear message on close
  };

  const showModal = (message: string, bgColor: 0 | 1 | 2) => {
    setModalMessage(message);
    setIsModalOpen(true);

    // Automatically close the modal after 4 seconds
    setTimeout(() => {
      handleCloseModal();
    }, 2500);

    setBgColor(bgColor); // Set the background color based on the passed value
  };
  const currentBuilding = useMemo(
    () => buildings[currentBuildingIndex],
    [buildings, currentBuildingIndex]
  );

  const provider = new SuiClient({
    url: getFullnodeUrl("testnet"),
  });

  const handleNextBuilding = () => {
    setCurrentBuildingIndex((prevIndex) => (prevIndex + 1) % buildings.length);
  };

  const handlePreviousBuilding = () => {
    setCurrentBuildingIndex((prevIndex) =>
      prevIndex === 0 ? buildings.length - 1 : prevIndex - 1
    );
  };

  // Helper to cancel any ongoing transaction
  const cancelCurrentTransaction = () => {
    if (transactionType) {
      console.log(`Cancelling ${transactionType} transaction...`);
      setTransactionType(null);
      setTransactionInProgress(false);
    }
  };

  const handleBalancesUpdate = useCallback(
    (newSuiBalance: number, newSityBalance: number) => {
      setSityBalance(newSityBalance);
      setSuiBalance(newSuiBalance);
    },
    []
  );

  // Function to trigger balance refresh after operations
  const triggerBalanceRefresh = () => {
    setRefreshBalances((prev) => !prev); // Toggle state to re-fetch balances
  };

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
    console.log("Max Accumulation:", maxTime);
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

  const handleUpgradeClick = (buildingType: number) => {
    if (isTouchDevice) {
      // Check if the view is expanded
      if (!isMobileExpanded) {
        // First click: expand the building type div
        setIsMobileExpanded(true);
        setIsUpgradeInfoExpanded(true);
      } else {
        // Second click: initiate upgrade and collapse the view
        setIsMobileExpanded(false);
        setIsUpgradeInfoExpanded(false);
        setTransactionType("upgrade");
        setTransactionInProgress(true);
        console.log("UPGRADE CLICKED", buildingType);
        // Call upgrade function here
      }
    } else {
      // For non-mobile devices, just handle the upgrade click as usual
      setIsUpgradeInfoExpanded(false); // Collapse when clicked
      setTransactionType("upgrade");
      setTransactionInProgress(true);
      console.log("UPGRADE CLICKED", buildingType);
    }
  };

  const handleClaimClick = () => {
    cancelCurrentTransaction(); // Cancel ongoing transaction
    setTransactionType("claim");
    setTransactionInProgress(true);

    // Proceed with claim logic...
  };

  const handleUpgradeSuccess = () => {
    setTimeout(() => {
      console.log("UPGRADE SUCCESSFUL, awaiting new data...");
      setTransactionType(null);
      setIsAwaitingBlockchain(true);
      refreshNft();
      triggerBalanceRefresh(); // Trigger balance refresh
      setTransactionInProgress(false);
    }, 2000); // 2000 milliseconds = 2 seconds
  };

  const handleClaimSuccess = () => {
    setTimeout(() => {
      console.log("CLAIM SUCCESSFUL, awaiting new data...");
      refreshNft();
      setTransactionType(null);
      setIsAwaitingBlockchain(true);
      triggerBalanceRefresh(); // Trigger balance refresh
      setTransactionInProgress(false);
    }, 2000); // 2000 milliseconds = 2 seconds
    console.log("OUT");
  };

  const handleError = () => {
    setTransactionInProgress(false);
    refreshNft();
  };

  const handleMintSuccess = () => {
    setTimeout(() => {
      console.log("MINT SUCCESSFUL, awaiting new data...");
      refreshNft();
      setTransactionType(null);
      setIsAwaitingBlockchain(true);
      triggerBalanceRefresh(); // Trigger balance refresh
      setTransactionInProgress(false);
    }, 2000); // 2000 milliseconds
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
      triggerBalanceRefresh(); // Trigger balance refresh
      fetchGameData();
    }
  }, [account?.address, refreshNft, fetchGameData, handleBalancesUpdate]);

  const calculateAccumulatedSity = useCallback(
    (nft: any) => {
      if (!nft || !gameData) return 0;

      // Fetch relevant fields from the NFT data
      const lastAccumulatedTimestamp =
        nft.content.fields?.last_accumulated || 0;
      const lastClaimedTimestamp = nft.content.fields?.last_claimed || 0;
      const residentialOfficeLevel = nft.content.fields?.residental_office || 0;
      const houseLevel = nft.content.fields?.house || 0;
      const entertainmentComplexLevel =
        nft.content.fields?.entertainment_complex || 0;

      // Get current time and calculate time elapsed
      const currentTime = Date.now();
      const elapsedTime = currentTime - lastAccumulatedTimestamp;
      const elapsedTimeFromClaim = currentTime - lastClaimedTimestamp;

      // Calculate the maximum accumulation period based on house and entertainment levels
      const maxAccumulationPeriod = calculateMaxAccumulation(
        houseLevel,
        entertainmentComplexLevel
      );

      console.log("Max accumulation period:", maxAccumulationPeriod);

      // Calculate the effective elapsed time by limiting to the max accumulation period
      let effectiveElapsedTime;

      if (elapsedTimeFromClaim <= maxAccumulationPeriod) {
        effectiveElapsedTime = elapsedTime;
      } else {
        effectiveElapsedTime =
          maxAccumulationPeriod -
          (lastAccumulatedTimestamp - lastClaimedTimestamp);
      }

      console.log("Effective elapsed time:", effectiveElapsedTime);

      // If no effective time has passed, return 0
      if (effectiveElapsedTime <= 0) return 0;

      // Fetch the accumulation speed based on the residential office level
      const accumulationPerHour =
        gameData.accumulation_speeds[residentialOfficeLevel];

      // Calculate the accumulated SITY based on effective elapsed time (in hours)
      const accumulatedSityMs =
        effectiveElapsedTime * accumulationPerHour * gameData.speed;

      const accumulatedSity = accumulatedSityMs / 3600000;

      // Log and return accumulated SITY (adjust division by 100 as needed)
      console.log("Accumulated SITY:", accumulatedSity);
      return accumulatedSity / 1000;
    },
    [gameData]
  );

  // Function to calculate the maximum accumulation period
  const calculateMaxAccumulation = useCallback(
    (houseLevel: number, entertainmentLevel: number): number => {
      const totalLevel =
        parseInt(houseLevel.toString()) +
        parseInt(entertainmentLevel.toString());
      // Base accumulation period is 3 hours
      if (totalLevel === 0) {
        return (3 * 3600 * 1000) / gameData.speed;
      } else if (totalLevel <= 7) {
        return ((3 + totalLevel) * 3600 * 1000) / gameData.speed;
      }

      // Adds 2 hours per level after level 7
      return ((10 + 2 * (totalLevel - 7)) * 3600 * 1000) / gameData.speed;
    },
    [gameData]
  );

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
    refreshNft();
    triggerBalanceRefresh(); // Trigger balance refresh
    fetchGameData();
  }, [account]);

  return (
    <div
      className="game-container"
      onMouseMove={isTouchDevice ? undefined : handleMouseMove}
      onTouchStart={isTouchDevice ? handleTouchStart : undefined}
      onTouchMove={isTouchDevice ? handleTouchMove : undefined}
      onTouchEnd={isTouchDevice ? handleTouchEnd : undefined}
      style={{
        backgroundImage:
          connectionStatus === "connected" && filteredNft?.content?.fields
            ? // Apply the background for NFT-loaded state
              `url(${currentBuilding.imageBaseUrl}/${
                filteredNft.content.fields[currentBuilding.field]
              }.webp)`
            : `url(${mintBackgroundUrl})`, // Use the minting background when filteredNft is null
        backgroundPosition:
          connectionStatus === "connected" && filteredNft?.content?.fields
            ? isTouchDevice
              ? `${backgroundPosition.x}% ${backgroundPosition.y}%`
              : `${mousePosition.x}% ${mousePosition.y}%`
            : "50% 25%", // Fixed position in case of minting
        backgroundSize:
          connectionStatus === "connected" && filteredNft?.content?.fields
            ? "cover" // Full coverage when NFT is loaded
            : "cover", // Fixed size for minting background
        backgroundColor:
          connectionStatus !== "connected" || isLoading || filteredNft === null
            ? "white"
            : "transparent",
        transition: "filter 0.3s ease-in-out", // Smooth transition for blur
      }}
    >
      <TwitterLogin />

      <Modal
        show={isModalOpen}
        message={modalMessage || ""}
        onClose={handleCloseModal}
        bgColor={bgColor} // Pass the bgColor prop
      />
      {/* Check if the wallet is connected */}
      {connectionStatus === "connected" ? (
        <>
          {isLoading ? (
            <p>Loading your NFTs and game data...</p>
          ) : filteredNft ? (
            <>
              <div className="upper-div">
                {/* Connect Button and Connected Status */}
                {connectionStatus === "connected" ? (
                  <>
                    <Balances
                      onBalancesUpdate={handleBalancesUpdate}
                      refreshTrigger={refreshBalances}
                    />

                    <div className="nft-title">
                      {filteredNft ? (
                        <h2>{filteredNft.content.fields.name}</h2>
                      ) : null}
                    </div>

                    {/* New NftSpecs component */}
                    <NftSpecs filteredNft={filteredNft} gameData={gameData} />
                  </>
                ) : (
                  <></>
                )}
              </div>

              {/* Left Arrow */}
              <button onClick={handlePreviousBuilding} className="arrow-left">
                &#8592;
              </button>
              <Building
                currentBuilding={currentBuilding}
                filteredNft={filteredNft}
                gameData={gameData}
                buildingIndex={currentBuildingIndex}
                suiBalance={suiBalance}
                sityBalance={sityBalance}
                factoryBonusCountdown={factoryBonusCountdown}
                isTransactionInProgress={isTransactionInProgress}
                onClaimSuccess={handleClaimSuccess}
                onClaimError={handleError}
                onUpgradeSuccess={handleUpgradeSuccess}
                onUpgradeError={handleError}
                showModal={showModal}
                isTouchDevice={false}
                onUpgradeClick={handleUpgradeClick}
                onClaimClick={handleClaimClick}
              />
              <Accumulation
                nft={filteredNft}
                gameData={gameData}
                isTransactionInProgress={isTransactionInProgress}
                onAccumulatedSityUpdate={setAccumulatedSity} // Updates the state in Game.tsx
                onCountdownUpdate={setCountdown} // Updates the countdown in Game.tsx
                showModal={showModal} // Modal handling
                onClaimSuccess={handleClaimSuccess} // Claim success callback
                onClaimError={handleError} // Claim error callback
                suiBalance={suiBalance} // Pass SUI balance
              />

              <Population
                filteredNft={filteredNft}
                accumulatedSity={accumulatedSity}
                sityBalance={sityBalance}
              />

              {/* Right Arrow */}
              <button onClick={handleNextBuilding} className="arrow-right">
                &#8594;
              </button>
            </>
          ) : (
            <div className="mint">
              <Mint
                onMintSuccessful={handleMintSuccess}
                showModal={showModal} // Pass showModal as a prop here
                suiBalance={suiBalance} // Pass SUI balance
              />
            </div>
          )}
        </>
      ) : (
        <div className="pleaseConnect">
          <h2>Please connect your wallet</h2>
        </div>
      )}
    </div>
  );
};

export default Game;
