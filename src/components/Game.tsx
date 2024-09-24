import "../assets/styles/Game.css";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Balances from "./Balances"; // Import the new Balances component
import Accumulation from "./Accumulation"; // Import the new Balances component
import Building from "./Building"; // Import the Building component
import { ADDRESSES } from "../../addresses";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { useCurrentWallet, useCurrentAccount } from "@mysten/dapp-kit";
import Modal from "./Modal"; // Import the new Modal component
import NftSpecs from "./NftSpecs";
import Population from "./Population";
import NftTech from "./NftTech";
import Reference from "./Reference";
import WalletChecker from "./WalletChecker";
import ClaimReward from "./ClaimReward";


const Game: React.FC = () => {

  const { connectionStatus } = useCurrentWallet();

  useEffect(() => {
    if (connectionStatus === "connected") {
      document.body.classList.remove("disconnected"); // Set background for connected wallet
    } else {
      document.body.classList.add("disconnected"); // Set background for disconnected wallet
    }
  }, [connectionStatus]);

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
  const [, setIsBuildingClickable] = useState<boolean>(true); // Manage clickable areas
  const [isMapView, setIsMapView] = useState(true); // Track if map view is active
  // State for tracking airdrop claim data
  const [storedSignature, setStoredSignature] = useState<string | null>(null);
  const [airdropAmount, setAirdropAmount] = useState<number>(0);
  const [office, setOffice] = useState<number>(0);
  const [factory, setFactory] = useState<number>(0);
  const [house, setHouse] = useState<number>(0);
  const [enter, setEnter] = useState<number>(0);
  const [mapUrl, setMapUrl] = useState<string>("https://bafybeig5ettnunvapmokcki3xjqwzxb3qmvsvj3qmi4mpelcsitpq6z7ui.ipfs.w3s.link/");
  // Add this state to track if the Castle is hovered
  const [isCastleHovered, setIsCastleHovered] = useState(false);
  const [preloadedVideoUrls] = useState<{ [key: string]: string }>({}); // Store preloaded video URLs
  const clickAudioRef = useRef<HTMLAudioElement | null>(null); // Ref for click sound
  const [hasNftInDb, setHasNftInDb] = useState<boolean | null>(null); // Initialize as null to avoid confusion
  const [isCheckingNft, setIsCheckingNft] = useState(false);
  const [canClaimReward, setCanClaimReward] = useState(false);

  // Add this state to manage the sound
  const [isGameActive, setIsGameActive] = useState(false); // Track if the game-container is on
  const audioRef = useRef<HTMLAudioElement | null>(null); // Ref to the audio element
  // Play the click sound

  const checkIfUserHasNft = useCallback(async () => {
    try {
      const response = await fetch(
        `/.netlify/functions/check-nft?walletAddress=${account?.address}`, // Add walletAddress as query parameter
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
      } else {
        console.error("Failed to check NFT status:", data.error);
        setHasNftInDb(true); // Set to false if no NFT found or error occurred
      }
    } catch (error) {
      setHasNftInDb(true); // Set to false in case of an error
      console.error("Error checking if user has NFT:", error);
    }
  }, [account?.address]);


  useEffect(() => {
    if (connectionStatus === "connected" && account?.address) {
      checkIfUserHasNft(); // Check if the user has an NFT in the database
    }
  }, [connectionStatus, account?.address, checkIfUserHasNft]);

  useEffect(() => {
    if (connectionStatus === "connected") {
      setIsGameActive(true); // Set game active when wallet is connected
    } else {
      setIsGameActive(false); // Stop the game when the wallet is disconnected
    }
  }, [connectionStatus]);

  // Function to handle hover state for the Castle
  const handleMouseEnterCastle = () => {
    setIsCastleHovered(true);
  };

  const handleMouseLeaveCastle = () => {
    setIsCastleHovered(false);
  };

  const mintBackgroundUrl = useMemo(
    () =>
      "https://bafybeifzamdszfcbsrlmff7xqpdhjrjrp44u3iqzodm5r3bhg6aiycxjsu.ipfs.w3s.link/mint-2.webp",
    []
  );

  const fetchAirdropData = useCallback(() => {
    // Fetch data from localStorage when the component mounts
    const signature = localStorage.getItem("airdrop_signature");
    const airdrop = localStorage.getItem("total_airdrop");

    if (signature) {
      setStoredSignature(signature);
    } else {
      setStoredSignature(null); // Ensure signature is cleared if not found
    }

    if (airdrop) {
      setAirdropAmount(parseInt(airdrop));
    } else {
      setAirdropAmount(0); // Ensure airdrop amount is cleared if not found
    }
  }, []);


  // Added useEffect to check local storage when the component mounts and when connectionStatus changes
  useEffect(() => {
    fetchAirdropData(); // Fetch airdrop data on mount
  }, [fetchAirdropData]);

  useEffect(() => {
    // Also run the fetch when the wallet connection status changes
    if (connectionStatus === "connected") {
      fetchAirdropData();
    }
  }, [connectionStatus, fetchAirdropData]);



  const originalBackgroundSize = { width: 1280, height: 1280 }; // Original map size

  const buildings = useMemo(
    () => [
      {
        type: "Office",
        imageBaseUrl:
          "https://bafybeiat3x2wrv3b2vqjprvdutvbxnpw2g32flsnogfnwlmmfydjqgtyea.ipfs.w3s.link/",
        buildingUrl:
          "https://bafybeicz5hchwhdfde2pjeo3tbndppqfa7npyyauwi4rjio3edutqok7w4.ipfs.w3s.link/",
        posUrl:
          "https://bafybeig5vgubjuwhqreshajj2cmb2nfpug6aq7imjpbduhjvmta2cj5374.ipfs.w3s.link/",
        videoBase:
          "https://bafybeianb2ja544u4lw3ncdeprtd3vn6pdngu7ekhn43qlx45c3essl4cq.ipfs.w3s.link/",

      },
      {
        type: "Factory",
        imageBaseUrl:
          "https://bafybeie3jnj2qolzprowinmupykm4q3t77utkyejolase4uu2iwgp7qdf4.ipfs.w3s.link/",
        buildingUrl:
          "https://bafybeieb6jtila7flzlkybvl36wdrokz37v4nsjbw33itragrpdtl6o36a.ipfs.w3s.link/",
        posUrl:
          "https://bafybeihe5sssbkonsvpo6ggzejbt4j7s6lyydu4sx42xemaxja7ifsohtu.ipfs.w3s.link/",
        videoBase:
          "https://bafybeigckd2yoq6vkdcgrrvhtoonfyxsef5ehpqu7fcijitz3gwlnw5lcy.ipfs.w3s.link/"

      },
      {
        type: "House",
        imageBaseUrl:
          "https://bafybeiamjbdidb4ynhpbjl42npcmasrq4m6oussd5icrcijziurgiq237e.ipfs.w3s.link/",
        buildingUrl:
          "https://bafybeidwyrjf7ivqm76mg2wg3jbwtvo4sifuxkbrar3xzwn7xkugkbiqke.ipfs.w3s.link/",
        posUrl:
          "https://bafybeid7a7hu6e6izwdu2ocx5vb6v6uojwfa6u2wed5jzyfxt5ku7minwy.ipfs.w3s.link/",
        videoBase:
          "https://bafybeiawqfyyd3m6kck2c63wu5mjednb262asjgqwd24jsy7o7ytuyd4sq.ipfs.w3s.link/"

      },
      {
        type: "Entertainment Complex",
        imageBaseUrl:
          "https://bafybeihdl2hkkro6gncq2nu522i7meuvsmjiks6ve3k7mgskglco6cjqai.ipfs.w3s.link/",
        buildingUrl:
          "https://bafybeibyvpq4sr33flefgewlxhvfyhgqdd5kcycaz2xortm6uqqrp6ahfa.ipfs.w3s.link/",
        posUrl:
          "https://bafybeiagsoqg2h4rh2xhgbsmybiszerwvhbip3u2iyyzn6baqfoykforpa.ipfs.w3s.link/",
        videoBase:
          "https://bafybeien27gmpaxgavzbxl3x4mvoutrre2p4qdate4qj2m56gktriecakm.ipfs.w3s.link/"

      },
      {
        type: "Castle",

        disabled: true,
      },
    ],
    []
  );

  const [backgroundPosition,] = useState({
    x: 50,
    y: 50,
  });
  const [mousePosition,] = useState({ x: 50, y: 50 });
  const [isTouchDevice, setIsTouchDevice] = useState(false); // To detect if the device is touch-enabled

  useEffect(() => {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
  }, []);



  // Inside your Game component
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // State to track if the game is muted

  // Toggle the mute state
  const handleMuteClick = () => {
    setIsMuted((prevMuted) => !prevMuted);
  };
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

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

  const handleBuildingClick = (index: number) => {

    setCurrentBuildingIndex(index); // Set the clicked building as the current one
    setMapUrl(""); // Clear the map URL when a building is clicked
    setIsBuildingClickable(false); // Disable clickable areas after a building is clicked
    setIsMapView(false); // Enable map view
    setIsHovered(false); // Reset hover state
  };
  const currentLevel =
    currentBuilding.type === "Office"
      ? office
      : currentBuilding.type === "Factory"
        ? factory
        : currentBuilding.type === "House"
          ? house
          : enter; // for "E. Complex"

  const provider = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });


  // Helper to cancel any ongoing transaction
  const cancelCurrentTransaction = () => {
    if (transactionType) {
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

  const calculateFactoryBonusCountdown = (nft: any) => {
    const currentTime = Date.now();
    const lastDailyBonus = nft.content.fields?.last_daily_bonus;
    const elapsedTime = currentTime - lastDailyBonus;

    const bonusPeriod = (24 * 3600 * 1000) / gameData.speed; // 24 hours divided by game speed
    const remainingTime = bonusPeriod - elapsedTime;

    return remainingTime > 0 ? remainingTime : null;
  };

  const startCountdownInterval = (nft: any) => {
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      const newFactoryBonusCountdown = calculateFactoryBonusCountdown(nft);

      setFactoryBonusCountdown(newFactoryBonusCountdown);
    }, 1000); // Update every second
  };

  useEffect(() => {
    if (filteredNft && gameData && !isLoading && !isAwaitingBlockchain) {
      const nft = filteredNft;
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

  const preloadImage = (url: string) => {
    const img = new Image();
    img.src = url;
  };

  const handleUpgradeClick = async (buildingType: number) => {

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
        // Call upgrade function here
      }
    } else {
      // For non-mobile devices, just handle the upgrade click as usual
      setIsUpgradeInfoExpanded(false); // Collapse when clicked
      setTransactionType("upgrade");
      setTransactionInProgress(true);
      console.log("UPGRADE CLICKED", buildingType);
    }

    const newLevel =
      buildingType === 0
        ? Number(office) + 1
        : buildingType === 1
          ? Number(factory) + 1
          : buildingType === 2
            ? Number(house) + 1
            : Number(enter) + 1;

    const newImageUrl = `${buildings[buildingType].imageBaseUrl}/${newLevel}.webp`;
    const newBuildingUrl = `${buildings[buildingType].buildingUrl}/${newLevel}.webp`;
    const newPosUrl = `${buildings[buildingType].posUrl}/${newLevel}.png`;

    // Preload new images
    preloadImage(newImageUrl);
    preloadImage(newBuildingUrl);
    preloadImage(newPosUrl);


  };


  const handleAirdropClaimSuccess = useCallback(async () => {
    showModal("✅ Airdrop claimed successfully!", 1);

    // Clear airdrop data from localStorage
    localStorage.removeItem("airdrop_signature");
    localStorage.removeItem("total_airdrop");

    checkIfUserHasNft(); // Check if the user has an NFT in the database

    setStoredSignature(null); // Remove signature from state
    setAirdropAmount(0); // Set airdrop amount to 0

    setTimeout(() => {
      triggerBalanceRefresh(); // Trigger balance refresh after 2 seconds
    }, 2000);

    // Check if the NFT has already been added to the database by checking localStorage
    const storedNftId = localStorage.getItem("added_nft_id");

    // Only add to the database if it hasn't been added before
    if (filteredNft?.objectId && storedNftId !== filteredNft.objectId) {
      try {
        const response = await fetch("/.netlify/functions/add-nft", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: account?.address, // The current wallet address
            nftData: filteredNft.objectId, // Add actual NFT data
          }),
        });

        const data = await response.json();
        if (data.success) {

          // Store the NFT ID in local storage to prevent future redundant additions
          localStorage.setItem("added_nft_id", filteredNft.objectId);
        } else {
          console.error("Failed to add NFT data:", data.error);
        }
      } catch (error) {
        console.error("Error adding NFT data:", error);
      }
    }
  }, [filteredNft, account?.address, triggerBalanceRefresh, showModal]);

  const handleAirdropClick = async () => {
    setIsCheckingNft(true); // Set loading state
    await checkIfUserHasNft(); // Call function to check if the user has NFT in DB

    if (!hasNftInDb) {
      setCanClaimReward(true); // Allow the claim if no NFT exists in DB
    } else {
      setCanClaimReward(false); // Block the claim if NFT exists
      console.error("❌ You already have an NFT in the database!", 0); // Show error message
    }
    setIsCheckingNft(false); // End loading state
  };

  const handleClaimClick = () => {

    cancelCurrentTransaction(); // Cancel ongoing transaction
    setTransactionType("claim");
    setTransactionInProgress(true);

    // Proceed with claim logic...
  };
  const handleUpgradeSuccess = async () => {

    // Store the previous levels before refreshing NFT data
    const previousLevels = {
      office,
      factory,
      house,
      enter,
    };

    setTransactionType(null);
    setIsAwaitingBlockchain(true);

    const retryLimit = 10; // Set a retry limit
    let retryCount = 0; // Counter for retries

    // Function to refresh levels and check if they have increased
    const waitForLevelChange = async () => {
      await refreshNft(); // Refresh the NFT data
      const newLevels = {
        office,
        factory,
        house,
        enter,
      };


      // Check if any of the levels have increased
      return (
        newLevels.office > previousLevels.office ||
        newLevels.factory > previousLevels.factory ||
        newLevels.house > previousLevels.house ||
        newLevels.enter > previousLevels.enter
      );
    };

    // Keep refreshing until the levels increase or retry limit is reached
    let levelIncreased = false;
    while (!levelIncreased && retryCount < retryLimit) {
      levelIncreased = await waitForLevelChange();
      retryCount++;

      if (!levelIncreased) {
        console.log(`No level increase detected, retrying... (${retryCount}/${retryLimit})`);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before trying again
      }
    }

    if (!levelIncreased) {
      console.warn("Reached retry limit without detecting a level increase.");
      // You can add logic here to handle the failure case, e.g., show a message to the user
      setIsAwaitingBlockchain(false);
      triggerBalanceRefresh(); // Trigger balance refresh
      setTransactionInProgress(false);
      return;
    }

    console.log("Level increased successfully.");

    // Trigger balance refresh and end transaction
    triggerBalanceRefresh(); // Trigger balance refresh
    setTransactionInProgress(false);
    setIsAwaitingBlockchain(false); // Re-enable interactions
  };




  const handleClaimSuccess = () => {
    setTimeout(() => {
      refreshNft();
      setTransactionType(null);
      setIsAwaitingBlockchain(true);
      triggerBalanceRefresh(); // Trigger balance refresh
      setTransactionInProgress(false);
    }, 2000); // 2000 milliseconds = 2 seconds
  };

  const handleError = () => {
    setTransactionInProgress(false);
    refreshNft();
  };

  const handleMintSuccess = () => {
    setTimeout(() => {
      console.log("MINT SUCCESSFUL, awaiting new data...");
      refreshNft();
      showModal("✅ Mint successful!", 1); // Show success message in the modal

      fetchAirdropData();
      setTransactionType(null);
      setIsAwaitingBlockchain(true);
      triggerBalanceRefresh(); // Trigger balance refresh
      setTransactionInProgress(false);
    }, 2000); // 2000 milliseconds
  };

  const refreshNft = useCallback(async () => {
    console.log("Refreshing NFTs...");
    try {
      const allObjects: any[] = [];
      let lastObject = null;
      let hasMore = true;

      while (hasMore) {
        const object = await provider.getOwnedObjects({
          owner: String(account?.address),
          cursor: lastObject?.data?.[lastObject.data.length - 1]?.data?.objectId || null,
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

      console.log("NFT found:", nft?.data);

      setFilteredNft(nft?.data || null);
      if (nft?.data) {
        const fields = nft.data.content.fields;

        if (fields.buildings) {
          setOffice(fields.buildings[0]);
          setFactory(fields.buildings[1]);
          setHouse(fields.buildings[2]);
          setEnter(fields.buildings[3]);
        }
      }

      setIsLoading(false); // Mark loading as complete once NFT is fetched
      setIsAwaitingBlockchain(false); // Re-enable interaction and accumulation process
    } catch (error) {
      console.error("Error refreshing NFTs, switching RPC:", error);

      // Switch to an alternative RPC URL temporarily
      const provider = new SuiClient({
        url: "https://sui-rpc.publicnode.com",
      });

      // Retry the request with the new RPC URL
      try {
        const allObjects: any[] = [];
        let lastObject = null;
        let hasMore = true;

        while (hasMore) {
          const object = await provider.getOwnedObjects({
            owner: String(account?.address),
            cursor: lastObject?.data?.[lastObject.data.length - 1]?.data?.objectId || null,
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

        console.log("NFT found with new RPC:", nft?.data);

        setFilteredNft(nft?.data || null);
        if (nft?.data) {
          const fields = nft.data.content.fields;

          if (fields.buildings) {
            setOffice(fields.buildings[0]);
            setFactory(fields.buildings[1]);
            setHouse(fields.buildings[2]);
            setEnter(fields.buildings[3]);
          }
        }

        setIsLoading(false);
        setIsAwaitingBlockchain(false);
      } catch (error) {
        console.error("Error refreshing NFTs after switching RPC:", error);
        setIsLoading(false);
        setIsAwaitingBlockchain(false);
      }
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

  useEffect(() => {
    refreshNft();
    triggerBalanceRefresh(); // Trigger balance refresh
    fetchGameData();
  }, [account]);

  const handleMapButtonClick = () => {

    setMapUrl("https://bafybeig5ettnunvapmokcki3xjqwzxb3qmvsvj3qmi4mpelcsitpq6z7ui.ipfs.w3s.link/");
    setIsBuildingClickable(true); // Re-enable clickable areas when the map is shown
    setIsMapView(true); // Enable map view
  };

  const containerRef = useRef<HTMLDivElement | null>(null); // To reference the game container

  const [containerSize, setContainerSize] = useState({
    width: 1280,
    height: 720,
  });

  const scaleFactor = useMemo(() => {
    const widthRatio = containerSize.width / originalBackgroundSize.width;
    const heightRatio = containerSize.height / originalBackgroundSize.height;

    // Use the larger ratio to mimic "background-size: cover"
    return Math.max(widthRatio, heightRatio);
  }, [containerSize.width, containerSize.height]);

  // Function to handle resizing and update container size
  const updateContainerSize = () => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setContainerSize({ width, height });
    }
  };



  // Add a resize event listener
  useEffect(() => {
    window.addEventListener("resize", updateContainerSize);
    updateContainerSize(); // Initial size calculation

    return () => {
      window.removeEventListener("resize", updateContainerSize);
    };
  }, []);
  // Adjust top and left positions according to the container size and scale factor
  const adjustedBuildingPositions = useMemo(() => {
    const bgWidth = originalBackgroundSize.width * scaleFactor;
    const bgHeight = originalBackgroundSize.height * scaleFactor;

    const overflowX = (bgWidth - containerSize.width) / 2; // Horizontal overflow in pixels
    const overflowY = (bgHeight - containerSize.height) / 2; // Vertical overflow in pixels

    // Helper function to calculate adjusted positions
    const adjustPosition = (topPercent: number, leftPercent: number) => ({
      top: `${((topPercent / 100) * bgHeight - overflowY) / containerSize.height * 100}%`,
      left: `${((leftPercent / 100) * bgWidth - overflowX) / containerSize.width * 100}%`,
    });

    return {
      house: adjustPosition(34.06, 48.98),
      office: adjustPosition(9.84, 50),
      factory: adjustPosition(9.84, 10),
      entertainment: adjustPosition(33.83, 10.08),
      castle: adjustPosition(50, 28),
    };
  }, [scaleFactor, containerSize]);

  // Add this state to track if a building is hovered
  const [isHovered, setIsHovered] = useState(false);

  // Function to handle hover state for buildings
  const handleMouseEnterBuilding = () => {
    setIsHovered(true);
  };

  const handleMouseLeaveBuilding = () => {
    setIsHovered(false);
  };

  // Play audio on user interaction (e.g., clicking on the game)
  const handlePlaySound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => console.error("Failed to play audio:", err));
    }
  };

  return (

    <>
      {/* Play bird sound when game-container is active and the user interacts */}
      {isGameActive && (
        <>

          <audio ref={audioRef} loop>
            <source src="/ambient.mp3" type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
          <audio ref={clickAudioRef} src="/click.mp3" preload="auto" />




        </>
      )}
      <div
        className={`info-container ${!(filteredNft && connectionStatus === "connected") ? 'blurred' : ''}`} // Add the 'blurred' class if NFT is not minted
      >
        <NftTech
          nft={filteredNft}
          officeLevel={office}
          factoryLevel={factory}
          houseLevel={house}
          enterLevel={enter}
        />

        <Reference nft={filteredNft} showModal={showModal} officeLevel={office}
          factoryLevel={factory}
          houseLevel={house}
          enterLevel={enter} />
      </div>

      <div
        className={`social-container ${!(filteredNft && connectionStatus === "connected") ? 'blurred' : ''}`} // Add the 'blurred' class if NFT is not minted
      >

        <div className="leaderboard">

          <h2>🏆 Leaderboard</h2>


          <p>
            Coming soon...
          </p>
        </div>
      </div>

      <div
        className={`game-container`} // Add the 'blurred' class if NFT is not minted
        ref={containerRef}
        style={{
          backgroundImage: isMapView // If mapUrl is set, use it as the background
            ? `url(${mapUrl})`
            : connectionStatus === "connected" && filteredNft?.content?.fields
              ? `url(${currentBuilding.imageBaseUrl}/${currentLevel}.webp)`
              : `url(${mintBackgroundUrl})`, // Use mint background as fallback

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
            connectionStatus !== "connected" ||
              isLoading ||
              filteredNft === null
              ? "white"
              : "transparent",
          transition: "filter 0.3s ease-in-out", // Smooth transition for blur
        }}
      >
        <Modal
          show={isModalOpen}
          message={modalMessage || ""}
          onClose={handleCloseModal}
          bgColor={bgColor} // Pass the bgColor prop
        />

        {/* Mint Section - Only show if not minted and connected */}
        {connectionStatus === "connected" && !filteredNft && (
          <div className="mint">
            <WalletChecker showModal={showModal} onMintSuccess={handleMintSuccess} />
          </div>
        )}

        {/* Please connect wallet section */}
        {connectionStatus !== "connected" && (
          <div className="pleaseConnect">
            <h2>🔗 Please connect your wallet...</h2>
          </div>
        )}

        <div className={`game-container-wrapper 
  ${(connectionStatus !== "connected" || !filteredNft ? 'blurred' : '')} 
  ${(storedSignature || airdropAmount > 0) ? 'mystic' : ''}`}
        >




          {/* Only render ClaimReward if the user is allowed to claim */}
          {storedSignature && airdropAmount > 0 && (
            <ClaimReward
              mySignature={storedSignature}
              hashedMessage={`Airdrop reward claim for wallet ${account?.address}`}
              amount={airdropAmount}
              showModal={showModal}
              onClaimSuccessful={handleAirdropClaimSuccess} // Handle success
            />
          )}





          {/* Check if the wallet is connected */}
          {connectionStatus === "connected" && (
            <>
              {isLoading ? (
                <p>Loading your NFTs and game data...</p>
              ) : filteredNft && (


                <>


                  <div className="upper-div">
                    <Balances
                      onBalancesUpdate={handleBalancesUpdate}
                      refreshTrigger={refreshBalances}
                    />
                    <button onClick={handleMuteClick} className="mute-button">
                      {isMuted ? "🔇 Unmute" : "🔊 Mute"}
                    </button>


                    {/* New NftSpecs component */}
                    <NftSpecs
                      officeLevel={office}
                      factoryLevel={factory}
                      houseLevel={house}
                      enterLevel={enter}
                      gameData={gameData}
                    />
                  </div>

                  {isMapView && (
                    <>
                      {/* House */}
                      <div
                        className="buildingPos"
                        style={{
                          position: "absolute",
                          top: adjustedBuildingPositions.house.top,
                          left: adjustedBuildingPositions.house.left,
                          width: `${scaleFactor * 512}px`,
                          height: `${scaleFactor * 512}px`,


                        }

                        }
                      >
                        <img
                          src={`${buildings[2].posUrl}/${house}.png`}
                          alt="House"
                          style={{
                            width: '100%',
                            height: '100%',
                          }}

                        />
                        <div
                          className="buildingPos"

                          style={{
                            position: "absolute",
                            top: "30%", // center the clickable area vertically
                            left: "30%", // center the clickable area horizontally
                            width: "40%", // 30% width of the image
                            height: "40%", // 30% height of the image
                            cursor: "pointer",
                            zIndex: 100,

                          }}
                          onClick={() => handleBuildingClick(2)}
                          onMouseEnter={handleMouseEnterBuilding}
                          onMouseLeave={handleMouseLeaveBuilding}
                        />
                      </div>

                      {/* Office */}
                      <div
                        className="buildingPos"

                        style={{
                          position: "absolute",
                          top: adjustedBuildingPositions.office.top,
                          left: adjustedBuildingPositions.office.left,
                          width: `${scaleFactor * 512}px`,
                          height: `${scaleFactor * 512}px`,
                        }}
                      >
                        <img
                          src={`${buildings[0].posUrl}/${office}.png`}
                          alt="Office"
                          style={{
                            width: '100%',
                            height: '100%',
                          }}

                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "30%", // center the clickable area vertically
                            left: "30%", // center the clickable area horizontally
                            width: "40%", // 30% width of the image
                            height: "40%", // 30% height of the image
                            cursor: "pointer",
                            zIndex: 100,

                          }}
                          onClick={() => {
                            handleBuildingClick(0);
                            handlePlaySound()
                          }}
                          onMouseEnter={handleMouseEnterBuilding}
                          onMouseLeave={handleMouseLeaveBuilding}
                        />
                      </div>

                      {/* Factory */}
                      <div
                        className="buildingPos"

                        style={{
                          position: "absolute",
                          top: adjustedBuildingPositions.factory.top,
                          left: adjustedBuildingPositions.factory.left,
                          width: `${scaleFactor * 512}px`,
                          height: `${scaleFactor * 512}px`,
                        }}
                      >
                        <img
                          src={`${buildings[1].posUrl}/${factory}.png`}
                          alt="Factory"
                          style={{
                            width: '100%',
                            height: '100%',
                          }}

                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "30%", // center the clickable area vertically
                            left: "30%", // center the clickable area horizontally
                            width: "40%", // 30% width of the image
                            height: "40%", // 30% height of the image
                            cursor: "pointer",
                            zIndex: 100,

                          }}
                          onClick={() => {
                            handleBuildingClick(1);
                            handlePlaySound()
                          }}
                          onMouseEnter={handleMouseEnterBuilding}
                          onMouseLeave={handleMouseLeaveBuilding}
                        />
                      </div>

                      <div
                        className="castlePos"
                        style={{
                          position: "absolute",
                          top: adjustedBuildingPositions.castle.top,
                          left: adjustedBuildingPositions.castle.left,
                          width: `${scaleFactor * 512}px`,
                          height: `${scaleFactor * 512}px`,

                        }

                        }
                      >

                        <div
                          className="castlePos"

                          style={{
                            position: "absolute",
                            top: "30%", // center the clickable area vertically
                            left: "30%", // center the clickable area horizontally
                            width: "40%", // 30% width of the image
                            height: "40%", // 30% height of the image
                            zIndex: 100,


                          }}
                          onMouseEnter={handleMouseEnterCastle}
                          onMouseLeave={handleMouseLeaveCastle}

                        />

                        {/* "Coming soon..." text */}
                        {isCastleHovered && (
                          <div className="castle-coming-soon-text">
                            <p>🏰 Coming soon...</p>
                          </div>
                        )}


                      </div>

                      {/* Entertainment Complex */}
                      <div
                        className="buildingPos"

                        style={{
                          position: "absolute",
                          top: adjustedBuildingPositions.entertainment.top,
                          left: adjustedBuildingPositions.entertainment.left,
                          width: `${scaleFactor * 512}px`,
                          height: `${scaleFactor * 512}px`,
                        }}
                      >
                        <img
                          src={`${buildings[3].posUrl}/${enter}.png`}
                          alt="Entertainment Complex"
                          style={{
                            width: '100%',
                            height: '100%',
                          }}

                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "30%", // center the clickable area vertically
                            left: "30%", // center the clickable area horizontally
                            width: "40%", // 30% width of the image
                            height: "40%", // 30% height of the image
                            cursor: "pointer",
                            zIndex: 100,
                          }}
                          onClick={() => {
                            handleBuildingClick(3);
                            handlePlaySound()
                          }} onMouseEnter={handleMouseEnterBuilding}
                          onMouseLeave={handleMouseLeaveBuilding}
                        />
                      </div>

                      {/* Add a darken overlay when a building is hovered */}
                      <div className={`darken-overlay ${isHovered ? 'visible' : ''}`}></div>
                      <div className={`darken-overlay-2 ${!hasNftInDb && filteredNft ? 'visible' : ''}`}></div>


                    </>
                  )}



                  {/* Map Button as an image */}
                  {!isMapView && (
                    <button onClick={handleMapButtonClick} className="map-button">
                      🗺️ Show Map
                    </button>
                  )}


                  {!isMapView && (
                    <>
                      <Building
                        nft={filteredNft}
                        currentBuilding={currentBuilding}
                        officeLevel={office}
                        factoryLevel={factory}
                        houseLevel={house}
                        enterLevel={enter}
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
                        preloadedVideoUrl={preloadedVideoUrls[currentBuilding.type]} // Pass the preloaded video URL

                      />
                    </>
                  )}

                  <Accumulation
                    nft={filteredNft}
                    gameData={gameData}
                    isTransactionInProgress={isTransactionInProgress}
                    onAccumulatedSityUpdate={setAccumulatedSity}
                    onCountdownUpdate={setCountdown}
                    showModal={showModal}
                    onClaimSuccess={handleClaimSuccess}
                    onClaimError={handleError}
                    suiBalance={suiBalance}
                    officeLevel={office}
                    factoryLevel={factory}
                    houseLevel={house}
                    enterLevel={enter}
                  />

                  <Population
                    filteredNft={filteredNft}
                    accumulatedSity={accumulatedSity}
                    sityBalance={sityBalance}
                    officeLevel={office}
                    factoryLevel={factory}
                    houseLevel={house}
                    enterLevel={enter}
                  />

                </>

              )

              }
            </>
          )}

        </div>


      </div>

    </>
  );
};

export default Game;