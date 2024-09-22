import React from "react";

interface NftSpecsProps {
  officeLevel: number; // Level of the residential office
  factoryLevel: number; // Level of the factory
  houseLevel: number; // Level of the house
  enterLevel: number; // Level of the entertainment complex  gameData: any; // Game data, including bonuses and accumulation speeds
  gameData: any; // Game data, including bonuses and accumulation speeds
}

const NftSpecs: React.FC<NftSpecsProps> = ({
  officeLevel,
  factoryLevel,
  houseLevel,
  enterLevel,
  gameData,
}) => {
  const accumulationSpeed =
    Number(gameData.accumulation_speeds[officeLevel]) / 1000;

  const factoryBonus = gameData.factory_bonuses[factoryLevel];

  const amenityPoints = Number(houseLevel) + Number(enterLevel);

  return (
    <div className="nft-specs">
      <p>Accumulation Speed: </p>
      <h2>
        <img
          src="https://bafybeiahevtcpw4pxgklnglmoayfoer3asgha6ajk3pxbu35g4npwb54ey.ipfs.w3s.link/acc1.webp"
          alt="acc-icon"
          className="acc-icon"
          style={{
            width: "30px",
            height: "30px",
            marginRight: "3px",
          }}
        />
        {`${accumulationSpeed} $SITY/h`}
      </h2>

      <p>Factory Bonus:</p>
      <h2>
        <img
          src="https://bafybeiahevtcpw4pxgklnglmoayfoer3asgha6ajk3pxbu35g4npwb54ey.ipfs.w3s.link/gear1.webp"
          alt="gear-icon"
          className="gear-icon"
          style={{
            width: "30px",
            height: "30px",
            marginRight: "5px",
          }}
        />
        {`${factoryBonus}%`}
      </h2>

      <p>Amenity Points:</p>
      <h2>
        <img
          src="https://bafybeiahevtcpw4pxgklnglmoayfoer3asgha6ajk3pxbu35g4npwb54ey.ipfs.w3s.link/star1.webp"
          alt="star-icon"
          className="star-icon"
          style={{
            width: "30px",
            height: "30px",
            marginRight: "5px",
          }}
        />
        {`${amenityPoints}`}
      </h2>
    </div>
  );
};

export default NftSpecs;
