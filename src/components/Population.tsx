import React, { useEffect, useMemo, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

// Debounce utility function
const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

interface PopulationProps {
  filteredNft: any; // The user's filtered NFT object
  accumulatedSity: number; // The accumulated SITY amount
  sityBalance: number; // The current SITY balance
  officeLevel: number; // Level of the residential office
  factoryLevel: number; // Level of the factory
  houseLevel: number; // Level of the house
  enterLevel: number; // Level of the entertainment complex
  castleLevel: number; // Level of the castle
}

const Population: React.FC<PopulationProps> = ({
  filteredNft,
  accumulatedSity,
  sityBalance,
  officeLevel,
  factoryLevel,
  houseLevel,
  enterLevel,
  castleLevel
}) => {
  const account = useCurrentAccount(); // Get the current account
  const [hasUpdated, setHasUpdated] = useState(false); // State to track whether the update has happened

  // Function to format the balance for readability
  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return (balance / 1000000).toFixed(2) + "M";
    } else if (balance >= 1000) {
      return (balance / 1000).toFixed(2) + "k";
    }
    return balance.toFixed(2);
  };

  const extractDomain = (nftName: string) => {
    const match = nftName.match(/^(.*?)'s City$/);
    return match ? match[1] : null;
  };

  // Function to calculate population based on building levels
  const calculatePopulation = () => {
    const basePopulation = 20000;

    const calculateForBuilding = (level: number) => {
      let population = basePopulation;
      for (let i = 0; i < level; i++) {
        population = Math.floor((population * 18) / 10); // Multiply by 1.8
      }
      return population;
    };

    const residentialOfficePopulation = calculateForBuilding(officeLevel);
    const housePopulation = calculateForBuilding(houseLevel);
    const factoryPopulation = calculateForBuilding(factoryLevel);
    const entertainmentPopulation = calculateForBuilding(enterLevel);
    const castlePopulation = calculateForBuilding(castleLevel);
    // Check for suins domain and add population bonus
    const nftName = filteredNft?.content?.fields?.name || "";
    const domain = extractDomain(nftName);
    let domainBonus = 0;
    if (domain && domain.length === 3) {
      domainBonus = 2000000; // Add 2 million if domain length is 3
    } else if (domain && domain.length === 4) {
      domainBonus = 1000000; // Add 1 million if domain length is 4
    }

    return (
      residentialOfficePopulation +
      housePopulation +
      factoryPopulation +
      entertainmentPopulation +
      castlePopulation + domainBonus // Add domain bonus to total population

    );
  };

  // Memoize the population and totalPopulation calculation to prevent recalculations
  const population = useMemo(() => calculatePopulation(), [officeLevel, houseLevel, factoryLevel, enterLevel]);
  const totalPopulation = useMemo(() => population + Number((accumulatedSity + sityBalance) + 100000 * filteredNft.content.fields.extra_data[0]), [population, accumulatedSity, sityBalance, filteredNft]);

  // Function to call the Netlify function to update the population in MongoDB
  const updatePopulation = async () => {
    if (!account?.address) {
      console.error("No account address found");
      return;
    }

    console.log("Updating population for account:", account.address, "with population:", totalPopulation);

    try {
      const response = await fetch("/.netlify/functions/add-population", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: account.address,
          population: totalPopulation,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to update population");
      } else {
        console.log("Population updated successfully");
      }
    } catch (error) {
      console.error("Error updating population:", error);
    }
  };

  // Debounced version of updatePopulation
  const debouncedUpdatePopulation = debounce(updatePopulation, 5000); // Debounce with 5-second delay

  // Trigger updatePopulation only when sityBalance and accumulatedSity are available and it has not updated yet
  useEffect(() => {
    if (sityBalance && accumulatedSity && account?.address && !hasUpdated) {
      console.log("Triggering updatePopulation after sityBalance and accumulatedSity became available");
      debouncedUpdatePopulation(); // Debounced call
      setHasUpdated(true); // Set the flag so it only updates once
    }
  }, [sityBalance, accumulatedSity, account?.address, hasUpdated, debouncedUpdatePopulation]);

  return (
    <div className="population">
      <div className="population-top">
        <h2>
          <img
            src="https://bafybeiahevtcpw4pxgklnglmoayfoer3asgha6ajk3pxbu35g4npwb54ey.ipfs.w3s.link/peop1.webp"
            alt="people-icon"
            className="people-icon"
            style={{
              width: "30px",
              height: "30px",
              marginRight: "5px",
              transform: "translateY(5px)",
            }}
          />
          {`${formatBalance(totalPopulation)}`}
        </h2>
      </div>

      <p>Population</p>

      <button
        onClick={() => {
          const sity = (
            accumulatedSity +
            filteredNft.content.fields.balance / 1000
          ).toFixed(2);
          const tweetText = `I just reached a population of ${formatBalance(
            totalPopulation + parseInt(sity)
          )} on SuiCity with ${formatBalance(
            Number(sityBalance) + parseInt(sity)
          )} $SITY! 🚀 Check out the game now! @SuiCityP2E`;
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            tweetText
          )}&url=https://play.suicityp2e.com`;

          window.open(twitterUrl, "_blank");
        }}
      >
        Share on Twitter
      </button>
    </div>
  );
};

export default Population;
