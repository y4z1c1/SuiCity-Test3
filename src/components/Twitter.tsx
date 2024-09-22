import React, { useEffect, useState } from "react";
import { useSignPersonalMessage, useCurrentAccount } from "@mysten/dapp-kit";
import ClaimReward from "./ClaimReward"; // Import the ClaimReward component
import ClaimReference from "./ClaimReference";

const Twitter = ({
  nft, // New prop to accept NFT
}: {
  nft: any; // NFT passed as a string
}) => {
  const [screenName, setScreenName] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [hasLikedTweet, setHasLikedTweet] = useState<boolean>(false); // Track if the tweet is liked
  const [bindingStatus, setBindingStatus] = useState<string>("Not Bound"); // Track binding status
  const [boundWallet, setBoundWallet] = useState<string | null>(null); // Track the wallet if already bound
  const [isAlreadyBound, setIsAlreadyBound] = useState<boolean>(false); // To track if Twitter is bound
  const [loading, setLoading] = useState<boolean>(true); // Loading state
  const [claimSignature, setClaimSignature] = useState<string | null>(null); // Signature from the backend for claiming
  const [claimAmount, setClaimAmount] = useState<number>(0); // Amount of SITY to claim
  const { mutate: signPersonalMessage } = useSignPersonalMessage(); // Hook to sign message
  const currentAccount = useCurrentAccount(); // Get current wallet address
  const [hasFollowed, setHasFollowed] = useState<boolean>(false); // Track if the user has followed
  const [hashedMessageBytes, setHashedMessageBytes] = useState<string | null>(
    null
  ); // Hashed message from backend
  const [refNumber, setRefNumber] = useState<number | null>(null); // State for reference number

  const tweetId = "1834908891349406060"; // Replace with the ID of the tweet you want to check
  const tweetLink = `https://twitter.com/i/web/status/${tweetId}`; // Link to the tweet https://twitter.com/i/web/status/1834908891349406060
  const [usedRefs, setUsedRefs] = useState<string[]>([]);
  const [newUsedRefs, setNewUsedRefs] = useState<string[]>([]);

  // Function to check if the user liked the tweet
  const checkIfLiked = async () => {
    console.log("Calling checkIfLiked function...");
    try {
      const response = await fetch("/.netlify/functions/check-like", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`, // Send the user's Twitter access token
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Response from check-like:", data);

      if (data.isLiked) {
        console.log("Tweet is liked.");
        setHasLikedTweet(true); // User has liked the tweet
      } else {
        console.log("Tweet is not liked.");
        setHasLikedTweet(false); // Tweet not liked
      }
    } catch (error) {
      console.error("Error checking if the tweet is liked:", error);
    }
  };

  // Function to handle the bind (sign message)
  const handleBind = async () => {
    if (!currentAccount?.address) {
      console.error("No wallet address found.");
      return;
    }

    if (!screenName) {
      console.error("No Twitter account found.");
      return;
    }

    const message = `Binding Twitter ID ${screenName} to wallet ${currentAccount.address}`;
    console.log("Binding message:", message);

    // Set binding status to in-progress
    setBindingStatus("Binding in Progress...");

    // Sign the message
    signPersonalMessage(
      {
        message: new TextEncoder().encode(message),
      },
      {
        onSuccess: async (result) => {
          console.log("Signature:", result.signature);

          // Send the signature and message to the backend
          await fetch("/.netlify/functions/bind-twitter", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              twitterId: screenName,
              walletAddress: currentAccount.address,
              message,
              signature: result.signature,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("Bind Twitter response:", data);
              if (data.success) {
                console.log("Binding successful:", data);
                setIsAlreadyBound(true); // Mark as bound after successful binding
                setBindingStatus("Bound Successfully");
                checkIfLiked(); // Check if the user has liked the tweet after binding
              } else {
                console.error("Binding error:", data.error);
                setBindingStatus("Binding Failed");
              }
            });
        },
        onError: (error) => {
          console.error("Error signing the message:", error);
          setBindingStatus("Binding Failed");
        },
      }
    );
  };

  const handleSignClaim = async () => {
    // if (!hasLikedTweet) {
    //   console.log("User must like the tweet before claiming rewards.");
    //   return;
    // }

    try {
      const response = await fetch("/.netlify/functions/sign-claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitterId: screenName,
          walletAddress: currentAccount?.address,
        }),
      });

      const data = await response.json();
      setClaimSignature(data.hexSign); // Set the signature for the claim
      setHashedMessageBytes(data.message); // Set the hashed message for the claim
      setClaimAmount(data.amount); // Set the claim amount
    } catch (error) {
      console.error("Error signing the claim:", error);
    }
  };

  const checkIfAlreadyBound = async (twitterId: string) => {
    console.log("Checking if Twitter account is already bound...");
    try {
      const response = await fetch(
        `/.netlify/functions/check-binding?twitterId=${twitterId}`
      );
      const data = await response.json();
      console.log("Check binding response:", data);

      if (data.isBound) {
        console.log("Twitter account is already bound.");
        setIsAlreadyBound(true);
        setBindingStatus("Already Bound");
        setBoundWallet(data.walletAddress); // Set the bound wallet address
      }
    } catch (error) {
      console.error("Error checking binding:", error);
    } finally {
      setLoading(false); // Set loading to false after the check is done
    }
  };

  const handleLogout = () => {
    console.log("Logging out...");

    // Clear stored access token and other data from localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("has_followed");

    // Clear relevant state values
    setAccessToken(null);
    setScreenName(null);
    setHasFollowed(false);
  };

  useEffect(() => {
    console.log("Extracting access token and screen name from URL...");

    // Extract access_token and screen_name from URL and store it in localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("access_token");
    const screenNameFromUrl = urlParams.get("screen_name");

    if (tokenFromUrl) {
      console.log("Access token found:", tokenFromUrl);
      localStorage.setItem("access_token", tokenFromUrl);
      setAccessToken(tokenFromUrl);
    }
    if (screenNameFromUrl) {
      console.log("Screen name found:", screenNameFromUrl);
      setScreenName(screenNameFromUrl);
      checkIfAlreadyBound(screenNameFromUrl); // Check if already bound to a wallet
    }

    const tokenFromStorage = localStorage.getItem("access_token");
    const storedScreenName =
      screenNameFromUrl || localStorage.getItem("screen_name");

    if (tokenFromStorage) {
      setAccessToken(tokenFromStorage);
    }

    if (storedScreenName) {
      setScreenName(storedScreenName);
    }

    const followed = localStorage.getItem("has_followed") === "true";
    setHasFollowed(followed);
  }, []);

  const fetchRefNumber = async () => {
    if (!currentAccount?.address) {
      console.error("No wallet address found.");
      return;
    }

    try {
      const response = await fetch("/.netlify/functions/get-ref-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: currentAccount.address }),
      });

      const data = await response.json();
      if (data.refNumber) {
        setRefNumber(data.refNumber); // Set the reference number in state
      } else {
        console.error("Reference number not found:", data.error);
      }
    } catch (error) {
      console.error("Error fetching reference number:", error);
    }
  };
  // Fetch usedRefs and newRefs from backend
  const fetchUsedRefs = async () => {
    if (!currentAccount?.address) {
      console.error("No wallet address found.");
      return;
    }

    try {
      const response = await fetch("/.netlify/functions/get-used-refs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: currentAccount.address }),
      });

      const data = await response.json();
      if (data.usedRefs) {
        setUsedRefs(data.usedRefs); // Store all used references
      }
      if (data.newRefs) {
        setNewUsedRefs(data.newRefs); // Notify user of new references
      } else {
        console.error("No new references:", data.error);
      }
    } catch (error) {
      console.error("Error fetching used refs:", error);
    }
  };

  useEffect(() => {
    if (isAlreadyBound) {
      fetchUsedRefs(); // Fetch the references when bound
    }
  }, [isAlreadyBound]);

  return (
    <div className="twitter">
      {!accessToken ? (
        <button
          onClick={() => (window.location.href = "/.netlify/functions/login")}
        >
          Login with Twitter
        </button>
      ) : (
        <>
          <p>Logged in as {screenName ? `@${screenName}` : "Unknown User"}</p>

          {/* Follow Button */}
          {hasFollowed ? (
            <button disabled>✅ Followed</button>
          ) : (
            !loading && // Wait until the loading is done
            !isAlreadyBound && (
              <button onClick={handleBind}>Bind Twitter to Wallet</button>
            )
          )}

          <button onClick={handleLogout} style={{ marginLeft: "10px" }}>
            Log Out
          </button>

          <p>Binding Status: {bindingStatus}</p>
          {/* Generate Reference Code Button */}
          <button onClick={fetchRefNumber}>Generate Reference Code</button>
          {refNumber && (
            <p>
              Your Reference Code: <strong>{refNumber}</strong>
            </p>
          )}
          {currentAccount && (
            <ClaimReference
              nft={nft}
              currentAccount={currentAccount}
              onClaimSuccessful={() => console.log("Claim was successful!")}
              showModal={(message, bgColor) => console.log(message, bgColor)}
            />
          )}

          {isAlreadyBound && boundWallet && (
            <p>
              This Twitter account is already bound to wallet:{" "}
              {boundWallet.slice(0, 5) + "..." + boundWallet.slice(-5)}
              {/* Display the fetched reference number if available */}
              {newUsedRefs.length > 0 && (
                <div>
                  <h3>New users who used your reference code:</h3>
                  <ul>
                    {newUsedRefs.map((ref, index) => (
                      <li key={index}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
              {usedRefs.length > 0 && (
                <div>
                  <h3>All users who used your reference code:</h3>
                  <ul>
                    {usedRefs.map((ref, index) => (
                      <li key={index}>{ref}</li>
                    ))}
                  </ul>
                </div>
              )}
            </p>
          )}

          {isAlreadyBound && (
            <div>
              <button onClick={handleSignClaim}>
                Check if Tweet is Liked & Get Signature
              </button>
              {/* <button onClick={checkIfLiked}>Check if Tweet is Liked</button> */}
            </div>
          )}
          {claimSignature && hashedMessageBytes && (
            <ClaimReward
              mySignature={claimSignature}
              hashedMessage={hashedMessageBytes} // Pass the hashed message
              amount={claimAmount}
              onClaimSuccessful={() => console.log("Claim successful!")}
              showModal={(message, bgColor) =>
                alert(`${message} - Background: ${bgColor}`)
              }
            />
          )}
        </>
      )}
    </div>
  );
};

export default Twitter;
