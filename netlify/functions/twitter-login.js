const { TwitterApi } = require("twitter-api-v2");

exports.handler = async (event, context) => {
  const client = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
  });

  // URL to redirect the user for Twitter authentication
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    "https://suitestupgradable.netlify.app/.netlify/functions/twitter-callback",
    { scope: ["tweet.read", "users.read", "offline.access"] }
  );

  // Store the state and codeVerifier in the client (in cookies or local storage)
  return {
    statusCode: 200,
    body: JSON.stringify({ url, state, codeVerifier }),
  };
};
