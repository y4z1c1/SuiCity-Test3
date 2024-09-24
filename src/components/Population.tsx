import React, { useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface PopulationProps {
  filteredNft: any; // The user's filtered NFT object
  accumulatedSity: number; // The accumulated SITY amount
  sityBalance: number; // The current SITY balance
  officeLevel: number; // Level of the residential office
  factoryLevel: number; // Level of the factory
  houseLevel: number; // Level of the house
  enterLevel: number; // Level of the entertainment complex
}

const Population: React.FC<PopulationProps> = ({
  filteredNft,
  accumulatedSity,
  sityBalance,
  officeLevel,
  factoryLevel,
  houseLevel,
  enterLevel,
}) => {
  const account = useCurrentAccount(); // Get the current account

  // Function to format the balance for readability
  const formatBalance = (balance: number) => {
    if (balance >= 1000) {
      return (balance / 1000).toFixed(2) + "k";
    }
    return balance.toFixed(2);
  };

  // Function to calculate population based on building levels
  const calculatePopulation = () => {
    const basePopulation = 10000;

    const calculateForBuilding = (level: number) => {
      let population = basePopulation;
      for (let i = 0; i < level; i++) {
        population = Math.floor((population * 14) / 10); // Multiply by 1.4
      }
      return population;
    };

    const residentialOfficePopulation = calculateForBuilding(officeLevel);
    const housePopulation = calculateForBuilding(houseLevel);
    const factoryPopulation = calculateForBuilding(factoryLevel);
    const entertainmentPopulation = calculateForBuilding(enterLevel);

    return (
      residentialOfficePopulation +
      housePopulation +
      factoryPopulation +
      entertainmentPopulation
    );
  };

  // Calculate the total population including accumulated SITY
  const population = calculatePopulation();
  const totalPopulation = population + accumulatedSity + sityBalance;

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

  // Set up the interval to call the function every minute, starting 10 seconds after mount
  useEffect(() => {
    console.log("Setting up population update interval");
    const initialTimeout = setTimeout(() => {
      updatePopulation(); // Initial call after 10 seconds

      // Set the interval to call every minute (60000 ms)
      const intervalId = setInterval(() => {
        updatePopulation();
      }, 60000);

      return () => clearInterval(intervalId); // Clean up the interval on component unmount
    }, 10000);

    return () => clearTimeout(initialTimeout); // Clean up the initial timeout

  }, [account?.address]);


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
