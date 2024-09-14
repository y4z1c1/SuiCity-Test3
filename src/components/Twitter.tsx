import React, { useState } from "react";

// Replace with your Netlify function URL for the Twitter login
const LOGIN_URL = "/.netlify/functions/twitter-login";
const CALLBACK_URL = "/.netlify/functions/twitter-callback";

const TwitterLogin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Function to initiate Twitter login
  const handleTwitterLogin = async () => {
    try {
      const response = await fetch(LOGIN_URL);
      const data = await response.json();
      const { url, codeVerifier } = data;

      // Save the codeVerifier (this can be done using localStorage or cookies)
      localStorage.setItem("codeVerifier", codeVerifier);

      // Redirect the user to Twitter login page
      window.location.href = url;
    } catch (error) {
      console.error("Error initiating Twitter login:", error);
    }
  };

  // Function to handle the callback and retrieve the access token
  const handleTwitterCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const codeVerifier = localStorage.getItem("codeVerifier");

    if (code && codeVerifier) {
      try {
        const response = await fetch(
          `${CALLBACK_URL}?code=${code}&state=${state}&codeVerifier=${codeVerifier}`
        );
        const data = await response.json();
        if (data.accessToken) {
          setAccessToken(data.accessToken);
          setIsAuthenticated(true);

          // Optionally store the token locally
          localStorage.setItem("twitterAccessToken", data.accessToken);
        }
      } catch (error) {
        console.error("Error handling Twitter callback:", error);
      }
    }
  };

  // Call this on component mount to check if there is a callback from Twitter
  React.useEffect(() => {
    if (window.location.search.includes("code")) {
      handleTwitterCallback();
    }
  }, []);

  return (
    <div className="twitter-login-container">
      {!isAuthenticated ? (
        <button onClick={handleTwitterLogin} className="twitter-login-button">
          Sign in with Twitter
        </button>
      ) : (
        <div>
          <p>Logged in with Twitter!</p>
          <p>Access Token: {accessToken}</p>
        </div>
      )}
    </div>
  );
};

export default TwitterLogin;
