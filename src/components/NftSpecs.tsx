import React, { useState } from "react";

interface NftSpecsProps {
  officeLevel: number;
  factoryLevel: number;
  houseLevel: number;
  enterLevel: number;
  castleLevel: number;
  gameData: any;
}

const NftSpecs: React.FC<NftSpecsProps> = ({
  officeLevel,
  factoryLevel,
  houseLevel,
  enterLevel,
  castleLevel,
  gameData,
}) => {
  // Single state to toggle the visibility of the whole content
  const [isOpen, setIsOpen] = useState(false);

  const accumulationSpeed = Number(gameData.accumulation_speeds[officeLevel]) / 1000;
  const factoryBonus = gameData.factory_bonuses[factoryLevel];
  const amenityPoints = Number(houseLevel) + Number(enterLevel);
  const castlePowers = gameData.castle_powers[castleLevel];

  return (
    <div className="nft-specs">
      {/* Header with arrow to toggle the content */}

      {/* Conditional rendering of content with animation */}
      <div className={`content ${isOpen ? "open" : "closed"}`}>
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

        <p>War Power:</p>
        <h2>
          <img
            src="https://bafkreiflzltftnwnnetui2mmmj74vo4cuqwk3ryqi36sgrp3xhxhbx6v3u.ipfs.w3s.link/"
            alt="sword-icon"
            className="sword-icon"
            style={{
              width: "30px",
              height: "30px",
              marginRight: "5px",
            }}
          />
          {`${castlePowers}`}
        </h2>
      </div>
      <div
        className="toggle-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{isOpen ? "▲" : "▼"}</span> {/* Arrow changes based on open/close */}
      </div>
    </div>
  );
};

export default NftSpecs;
