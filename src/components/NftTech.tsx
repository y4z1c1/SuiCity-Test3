import React from "react";

interface NftSpecsProps {
  nft: any;
  officeLevel: number;
  factoryLevel: number;
  houseLevel: number;
  enterLevel: number;
  castleLevel: number;
  onShowChangeName: () => void; // Add a callback to show the Change Name section
}

const NftSpecs: React.FC<NftSpecsProps> = ({
  nft,
  officeLevel,
  factoryLevel,
  houseLevel,
  enterLevel,
  castleLevel,
  onShowChangeName, // Add the callback here
}) => {
  const formatLastClaimedDate = (timestamp: string | number) => {
    let parsedTimestamp = timestamp;

    // Check if timestamp is a string and needs to be converted
    if (typeof timestamp === "string") {
      parsedTimestamp = parseInt(timestamp, 10); // Convert string to number
    }

    // If the parsed timestamp is not a valid number, return a fallback message
    if (isNaN(Number(parsedTimestamp))) {
      return "Invalid Date";
    }

    const date = new Date(parsedTimestamp);

    // Array of month abbreviations
    const monthAbbreviations = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Manually format the date as Day MonthAbbreviation Year
    const formattedDate = `${String(date.getDate()).padStart(2, "0")} ${monthAbbreviations[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`;

    // Manually format the time as HH:MM
    const formattedTime = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    // Return the formatted date with a comma and then the formatted time
    return `${formattedDate}, ${formattedTime}`;
  };





  return (
    <>
      <div className="nft-info">
        {nft ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <h2>{nft.content.fields.name}</h2>
            <span onClick={onShowChangeName} className="rainbow-glow">
              ✍️
            </span>
          </div>
        ) : null}

        {nft && nft.content.fields.last_claimed ? (
          <p>
            Last Sity Claim:{" "}
            <strong>
              {formatLastClaimedDate(nft.content.fields.last_claimed)}
            </strong>
          </p>
        ) : (
          <p>Last Sity Claim: No data available</p>
        )}

        {nft && nft.content.fields.last_claimed ? (
          <p>
            Last Factory Bonus Claim:{" "}
            <strong>
              {formatLastClaimedDate(nft.content.fields.last_daily_bonus)}
            </strong>
          </p>
        ) : (
          <p>Last Factory Bonus Claim: No data available</p>
        )}

        <p>
          Residential Office Level: <strong>{officeLevel}</strong>
        </p>
        <p>
          Factory Level: <strong>{factoryLevel}</strong>
        </p>
        <p>
          House Level: <strong>{houseLevel}</strong>
        </p>
        <p>
          Entertainment Complex Level: <strong>{enterLevel}</strong>
        </p>
        <p>
          Castle Level: <strong>{castleLevel}</strong>
        </p>

        {nft && nft.objectId ? (
          <a
            href={`https://suiscan.xyz/mainnet/object/${nft.objectId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Object ID:{" "}
            <strong>
              {nft.objectId.slice(0, 12)}...
              {nft.objectId.slice(-12)}
            </strong>
          </a>
        ) : (
          <p>Object ID: No data available</p>
        )}
      </div>
    </>
  );
};

export default NftSpecs;
