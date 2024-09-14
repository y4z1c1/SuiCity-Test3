import React, { useEffect, useState, useRef, useCallback } from "react";
import Claim from "./Claim"; // Import the Claim component

interface AccumulationProps {
  nft: any; // NFT object containing levels and timestamps
  gameData: any; // Game data containing accumulation speeds and bonuses
  isTransactionInProgress: boolean; // Indicates if a transaction is in progress
  onAccumulatedSityUpdate: (sity: number) => void; // Callback to update accumulated SITY
  onCountdownUpdate: (countdown: number) => void; // Callback to update countdown timer
  showModal: (message: string, bgColor: 0 | 1 | 2) => void; // Modal handler for success/error messages
  onClaimSuccess: () => void; // Callback when claim is successful
  onClaimError: () => void; // Callback when claim fails
  suiBalance: number; // Pass the user's SUI balance
}

const Accumulation: React.FC<AccumulationProps> = ({
  nft,
  gameData,
  isTransactionInProgress,
  onAccumulatedSityUpdate,
  onCountdownUpdate,
  showModal,
  onClaimSuccess,
  onClaimError,
  suiBalance,
}) => {
  const [accumulatedSity, setAccumulatedSity] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const accumulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to calculate accumulated SITY based on NFT data and game speeds
  const calculateAccumulatedSity = useCallback(() => {
    if (!nft || !gameData) return 0;

    const lastAccumulatedTimestamp = nft.content.fields?.last_accumulated || 0;
    const residentialOfficeLevel = nft.content.fields?.residental_office || 0;

    const currentTime = Date.now();
    const elapsedTime = currentTime - lastAccumulatedTimestamp;

    const accumulationPerHour =
      gameData.accumulation_speeds[residentialOfficeLevel];

    const accumulatedSityMs =
      elapsedTime * accumulationPerHour * gameData.speed;
    const accumulatedSity = accumulatedSityMs / 3600000;

    return accumulatedSity / 1000;
  }, [nft, gameData]);

  // Function to calculate the countdown timer based on house and entertainment levels
  const calculateCountdown = useCallback(() => {
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
  }, [nft]);

  // Function to calculate the maximum accumulation period based on house and entertainment levels
  const calculateMaxAccumulation = (
    houseLevel: number,
    entertainmentLevel: number
  ): number => {
    const totalLevel =
      parseInt(houseLevel.toString()) + parseInt(entertainmentLevel.toString());

    if (totalLevel === 0) {
      return (3 * 3600 * 1000) / gameData.speed;
    } else if (totalLevel <= 7) {
      return ((3 + totalLevel) * 3600 * 1000) / gameData.speed;
    }

    return ((10 + 2 * (totalLevel - 7)) * 3600 * 1000) / gameData.speed;
  };

  // Function to start accumulation and countdown intervals
  const startAccumulationAndCountdown = useCallback(() => {
    if (!nft || isTransactionInProgress) return;

    if (accumulationIntervalRef.current)
      clearInterval(accumulationIntervalRef.current);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);

    // Start accumulation interval
    accumulationIntervalRef.current = setInterval(() => {
      const newAccumulatedSity = calculateAccumulatedSity();
      setAccumulatedSity(newAccumulatedSity);
      onAccumulatedSityUpdate(newAccumulatedSity);
    }, 100); // Update every second

    // Start countdown interval
    countdownIntervalRef.current = setInterval(() => {
      const newCountdown = calculateCountdown();
      setCountdown(newCountdown);
      onCountdownUpdate(newCountdown);
    }, 1000); // Update every second
  }, [
    nft,
    isTransactionInProgress,
    calculateAccumulatedSity,
    calculateCountdown,
    onAccumulatedSityUpdate,
    onCountdownUpdate,
  ]);

  useEffect(() => {
    startAccumulationAndCountdown();

    return () => {
      if (accumulationIntervalRef.current)
        clearInterval(accumulationIntervalRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, [startAccumulationAndCountdown]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Define the onClick handler to be passed to Claim
  const handleClick = () => {
    console.log("Claim button clicked");
  };

  return (
    <div className="accumulated">
      <h2>
        <img
          src="https://bafybeiahevtcpw4pxgklnglmoayfoer3asgha6ajk3pxbu35g4npwb54ey.ipfs.w3s.link/coins1.webp"
          alt="coin-icon"
          className="coin-icon"
          style={{
            width: "30px",
            height: "30px",
            marginRight: "5px",
            borderRadius: "50%",
            transform: "translateY(5px)",
          }}
        />
        {`${accumulatedSity.toFixed(2)} $SITY`}
      </h2>
      <p>{countdown ? formatTime(countdown) : "Full"}</p>
      <Claim
        nft={nft}
        onClaimSuccess={onClaimSuccess}
        onClick={handleClick} // Pass the click handler
        onError={onClaimError}
        showModal={showModal} // Pass showModal as a prop here
        suiBalance={suiBalance} // Pass the SUI balance
      />
    </div>
  );
};

export default Accumulation;
