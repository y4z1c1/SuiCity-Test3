import React from "react";

interface NftSpecsProps {
  nft: any;
  officeLevel: number;
  factoryLevel: number;
  houseLevel: number;
  enterLevel: number;
}

const NftSpecs: React.FC<NftSpecsProps> = ({ nft, officeLevel, factoryLevel, houseLevel, enterLevel }) => {

  const formatLastClaimedDate = (timestamp: string | number) => {


    let parsedTimestamp = timestamp;

    // Check if timestamp is a string and needs to be converted
    if (typeof timestamp === 'string') {
      parsedTimestamp = parseInt(timestamp, 10); // Convert string to number
    }


    // If the parsed timestamp is not a valid number, return a fallback message
    if (isNaN(Number(parsedTimestamp))) {
      return "Invalid Date";
    }

    const date = new Date(parsedTimestamp);

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    };

    return date.toLocaleDateString(undefined, options);
  };

  return (
    <>
      <div className="nft-info">
        {nft ? <h2>{nft.content.fields.name}</h2> : null}

        {nft && nft.content.fields.last_claimed ? (
          <p>
            Last Sity Claim: <strong>{formatLastClaimedDate(nft.content.fields.last_claimed)}</strong>
          </p>
        ) : (
          <p>Last Sity Claim: No data available</p>
        )}

        {nft && nft.content.fields.last_claimed ? (
          <p>
            Last Factory Bonus Claim: <strong>{formatLastClaimedDate(nft.content.fields.last_daily_bonus)}</strong>
          </p>
        ) : (
          <p>Last Factory Bonus Claim: No data available</p>
        )}

        <p>Residential Office Level: <strong>{officeLevel}</strong></p>
        <p>Factory Level: <strong>{factoryLevel}</strong></p>
        <p>House Level: <strong>{houseLevel}</strong></p>
        <p>Entertainment Complex Level: <strong>{enterLevel}</strong></p>

        {nft && nft.objectId ? (
          <a
            href={`https://suiscan.xyz/mainnet/object/${nft.objectId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Object ID: <strong>{nft.objectId.slice(0, 12)}...{nft.objectId.slice(-12)}</strong>
          </a>
        ) : (
          <p>Object ID: No data available</p>
        )}
      </div>

    </>
  );
};

export default NftSpecs;
