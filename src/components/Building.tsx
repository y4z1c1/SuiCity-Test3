import React, { useState } from "react";
import Upgrade from "./Upgrade";
import ClaimFactoryBonus from "./ClaimFactoryBonus";

interface BuildingProps {
  currentBuilding: any; // Information about the current building (type, field, etc.)
  filteredNft: any; // The user's filtered NFT object
  gameData: any; // Game data, including bonuses and accumulation speeds
  factoryBonusCountdown: number | null; // Countdown timer for factory bonus
  suiBalance: number; // User's SUI balance
  sityBalance: number; // User's SITY balance
  isTouchDevice: boolean; // Boolean to check if the user is on a touch device
  isTransactionInProgress: boolean; // Whether a transaction is in progress
  onClaimSuccess: () => void; // Callback on successful claim
  onClaimError: () => void; // Callback on claim error
  onUpgradeError: () => void; // Callback on upgrade error
  onUpgradeSuccess: () => void; // Callback on successful upgrade
  showModal: (message: string, bgColor: 0 | 1 | 2) => void; // Modal for showing feedback messages
  onUpgradeClick: (buildingType: number) => void; // Callback for when an upgrade is clicked
  onClaimClick: () => void; // Callback for when a claim is clicked
  buildingIndex: number; // Index of the current building
}

const Building: React.FC<BuildingProps> = ({
  currentBuilding,
  filteredNft,
  gameData,
  factoryBonusCountdown,
  suiBalance,
  sityBalance,
  isTouchDevice,
  onClaimSuccess,
  onClaimError,
  onUpgradeError,
  onUpgradeSuccess,
  showModal,
  onUpgradeClick,
  onClaimClick,
  buildingIndex,
}) => {
  const [isUpgradeInfoExpanded, setIsUpgradeInfoExpanded] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const handleUpgradeHover = () => {
    setIsUpgradeInfoExpanded(true);
  };

  const handleUpgradeLeave = () => {
    setIsUpgradeInfoExpanded(false);
  };

  const handleUpgradeClick = () => {
    if (isTouchDevice) {
      if (!isMobileExpanded) {
        setIsMobileExpanded(true);
        setIsUpgradeInfoExpanded(true);
      } else {
        setIsMobileExpanded(false);
        setIsUpgradeInfoExpanded(false);
        onUpgradeClick(buildingIndex);
      }
    } else {
      setIsUpgradeInfoExpanded(false);
      onUpgradeClick(buildingIndex);
    }
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div
      className={`buildingType ${
        isTouchDevice
          ? isMobileExpanded &&
            filteredNft.content.fields[currentBuilding.field] < 7
            ? "expanded"
            : "collapsed"
          : isUpgradeInfoExpanded &&
            filteredNft.content.fields[currentBuilding.field] < 7
          ? "expanded"
          : "collapsed"
      }`}
      onMouseEnter={
        !isTouchDevice && filteredNft.content.fields[currentBuilding.field] < 7
          ? handleUpgradeHover
          : undefined
      }
      onMouseLeave={
        !isTouchDevice && filteredNft.content.fields[currentBuilding.field] < 7
          ? handleUpgradeLeave
          : undefined
      }
      onClick={handleUpgradeClick}
    >
      <h2>{`${currentBuilding.type} Level: ${
        filteredNft.content.fields[currentBuilding.field]
      }`}</h2>

      {isUpgradeInfoExpanded && (
        <div className="additional-info">
          <p style={{ fontSize: "12px" }}>
            Upgrading will not only improve your building’s functionality but
            will also change the metadata, appearance, and rarity of your NFT,
            thanks to the power of dynamic NFTs.
          </p>
          {/* Building Images */}
          <div className="building-images">
            <div className="building-image">
              <img
                src={`${currentBuilding.buildingUrl}/${
                  filteredNft.content.fields[currentBuilding.field]
                }.webp`}
                alt="Current Level"
                className="building-image-zoom"
              />
              <p className="level-text current-level">{`Level ${
                filteredNft.content.fields[currentBuilding.field]
              }`}</p>
            </div>

            {/* Arrow Between Images */}
            <div className="level-arrow">
              <p>➔</p>
            </div>

            <div className="building-image">
              <img
                src={`${currentBuilding.buildingUrl}/${
                  parseInt(filteredNft.content.fields[currentBuilding.field]) +
                  1
                }.webp`}
                alt="Next Level"
                className="building-image-zoom"
              />
              <p className="level-text next-level">{`Level ${
                parseInt(filteredNft.content.fields[currentBuilding.field]) + 1
              }`}</p>
            </div>
          </div>

          {/* Upgrade Benefit Text */}
          <div className="upgrade-benefit">
            {currentBuilding.type === "R. Office" && (
              <>
                <p style={{ color: "gray", fontSize: "14px" }}>
                  Accumulation Speed:
                </p>
                <p
                  className="benefit-value"
                  style={{ color: "gray", fontSize: "16px" }}
                >
                  {`${
                    gameData.accumulation_speeds[
                      filteredNft.content.fields[currentBuilding.field]
                    ] / 1000
                  } $SITY/hour`}
                </p>

                <p
                  style={{
                    color: "green",
                    fontSize: "18px",
                    marginTop: "10px",
                  }}
                >
                  Accumulation Speed (Next Level):
                </p>
                <p
                  className="benefit-value next-level"
                  style={{
                    color: "green",
                    fontSize: "20px",
                    fontWeight: "bold",
                  }}
                >
                  {`${
                    gameData.accumulation_speeds[
                      parseInt(
                        filteredNft.content.fields[currentBuilding.field]
                      ) + 1
                    ] / 1000
                  } $SITY/hour`}
                </p>
              </>
            )}

            {currentBuilding.type === "Factory" && (
              <>
                <p style={{ color: "gray", fontSize: "14px" }}>
                  Factory Bonus:
                </p>
                <p
                  className="benefit-value"
                  style={{ color: "gray", fontSize: "16px" }}
                >
                  {`${
                    gameData.factory_bonuses[
                      filteredNft.content.fields[currentBuilding.field]
                    ]
                  }%`}
                </p>

                <p
                  style={{
                    color: "green",
                    fontSize: "18px",
                    marginTop: "10px",
                  }}
                >
                  Factory Bonus (Next Level):
                </p>
                <p
                  className="benefit-value next-level"
                  style={{
                    color: "green",
                    fontSize: "20px",
                    fontWeight: "bold",
                  }}
                >
                  {`${
                    gameData.factory_bonuses[
                      parseInt(
                        filteredNft.content.fields[currentBuilding.field]
                      ) + 1
                    ]
                  }%`}
                </p>
              </>
            )}

            {(currentBuilding.type === "House" ||
              currentBuilding.type === "E. Complex") && (
              <>
                <p style={{ color: "gray", fontSize: "14px" }}>
                  Amenity Points:
                </p>
                <p
                  className="benefit-value"
                  style={{ color: "gray", fontSize: "16px" }}
                >
                  {filteredNft.content.fields[currentBuilding.field]}
                </p>

                <p
                  style={{
                    color: "green",
                    fontSize: "18px",
                    marginTop: "10px",
                  }}
                >
                  Amenity Points (Next Level):
                </p>
                <p
                  className="benefit-value next-level"
                  style={{
                    color: "green",
                    fontSize: "20px",
                    fontWeight: "bold",
                  }}
                >
                  {parseInt(filteredNft.content.fields[currentBuilding.field]) +
                    1}
                </p>
              </>
            )}
            <a
              target="_blank"
              className="details"
              href="https://docs.suicityp2e.com/"
            >
              more details
            </a>
          </div>
        </div>
      )}

      {/* Factory-specific bonus logic */}
      {currentBuilding.type === "Factory" ? (
        <div>
          {factoryBonusCountdown !== null && factoryBonusCountdown > 0 ? (
            <p>{`${formatTime(factoryBonusCountdown)}`}</p>
          ) : (
            <ClaimFactoryBonus
              nft={filteredNft}
              onClick={onClaimClick}
              onClaimSuccess={onClaimSuccess}
              onError={onClaimError}
              showModal={showModal}
              suiBalance={suiBalance}
            />
          )}
        </div>
      ) : null}

      <Upgrade
        nft={filteredNft}
        buildingType={buildingIndex}
        onUpgradeSuccess={onUpgradeSuccess}
        onClick={() => onUpgradeClick(buildingIndex)}
        onError={onUpgradeError}
        gameData={gameData}
        showModal={showModal}
        suiBalance={suiBalance}
        sityBalance={sityBalance}
        isTouchDevice={isTouchDevice}
      />
    </div>
  );
};

export default Building;
