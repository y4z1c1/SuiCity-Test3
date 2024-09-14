const { TwitterApi } = require("twitter-api-v2");

exports.handler = async (event, context) => {
  const client = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  });

  const urlParams = new URLSearchParams(event.queryStringParameters);
  const code = urlParams.get("code");
  const state = urlParams.get("state");

  // Verify the state and codeVerifier
  const codeVerifier = YOUR_CODE_VERIFIER_STORAGE; // Retrieve this from your storage

  try {
    const {
      client: loggedClient,
      accessToken,
      refreshToken,
      expiresIn,
    } = await client.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri:
        "https://suitestupgradable.netlify.app/.netlify/functions/twitter-callback",
    });

    // Here you can return a JWT or simply redirect the user back to your app
    return {
      statusCode: 200,
      body: JSON.stringify({ accessToken, refreshToken, expiresIn }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to authenticate with Twitter" }),
    };
  }
};
