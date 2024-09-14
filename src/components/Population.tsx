import React from "react";

interface PopulationProps {
  filteredNft: any; // The user's filtered NFT object
  accumulatedSity: number; // The accumulated SITY amount
  sityBalance: number; // The current SITY balance
}

const Population: React.FC<PopulationProps> = ({
  filteredNft,
  accumulatedSity,
  sityBalance,
}) => {
  // Function to format the balance for readability
  const formatBalance = (balance: number) => {
    if (balance >= 1000) {
      return (balance / 1000).toFixed(2) + "k";
    }
    return balance.toFixed(2);
  };

  // Function to calculate population based on building levels
  const calculatePopulation = (nft: any) => {
    const basePopulation = 10000;

    const calculateForBuilding = (level: number) => {
      let population = basePopulation;
      for (let i = 0; i < level; i++) {
        population = Math.floor((population * 14) / 10); // Multiply by 1.4
      }
      return population;
    };

    const residentialOfficePopulation = calculateForBuilding(
      nft.content.fields.residental_office
    );
    const housePopulation = calculateForBuilding(nft.content.fields.house);
    const factoryPopulation = calculateForBuilding(nft.content.fields.factory);
    const entertainmentPopulation = calculateForBuilding(
      nft.content.fields.entertainment_complex
    );

    return (
      residentialOfficePopulation +
      housePopulation +
      factoryPopulation +
      entertainmentPopulation
    );
  };

  // Calculate the total population including accumulated SITY
  const population = calculatePopulation(filteredNft);
  const totalPopulation = population + accumulatedSity;

  return (
    <div className="population">
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
        {`Population: ${formatBalance(totalPopulation)}`}
      </h2>

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
          )}&url=https://suicityp2e.com`;

          window.open(twitterUrl, "_blank");
        }}
      >
        Share it on Twitter
      </button>
    </div>
  );
};

export default Population;
