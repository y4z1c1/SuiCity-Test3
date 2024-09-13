import React, { useState } from "react";
import "../assets/styles/Footer.css";

const Footer: React.FC = () => {
  const [feedback, setFeedback] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [error, setError] = useState("");

  // Regular expression for validating SUI address
  const isValidWalletAddress = (address: string): boolean => {
    const regex = /^0x[a-fA-F0-9]{64}$/; // 66 characters including "0x"
    return regex.test(address);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "feedback") setFeedback(value);
    if (name === "walletAddress") setWalletAddress(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValidWalletAddress(walletAddress)) {
      setError("Invalid wallet address format. Please check and try again.");
      return;
    }
    setError("");

    // Clear form fields
    setFeedback("");
    setWalletAddress("");

    // Handle form submission programmatically
    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch(e.currentTarget.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      // Redirect or show a success message
      window.location.href = "/pages/success";
    } catch (error) {
      console.error("There was a problem with the form submission:", error);
      setError(
        "An error occurred while submitting the form. Please try again."
      );
    }
  };

  return (
    <footer className="footer" id="footer">
      <p className="warn">
        This is a test version of the game, and many features, mechanics, and
        visual elements are still under development. Please note that everything
        is subject to change as we continue to refine and improve the
        experience. Expect updates, modifications, and potential resets as we
        work towards the final version.
      </p>

      <form
        name="getFeedback"
        action="/pages/success" // Custom success page path
        method="POST"
        data-netlify="true"
        data-netlify-honeypot="bot-field"
        className="feedback-form"
        onSubmit={handleSubmit}
      >
        <input type="hidden" name="form-name" value="getFeedback" />
        <p>
          <label>
            <h2>Give Us Some Feedback</h2>
            <textarea
              name="feedback"
              value={feedback}
              onChange={handleChange}
              required
            />
          </label>
        </p>
        <p>
          <label>
            <h2>Your Wallet Address</h2>
            <input
              type="text"
              name="walletAddress"
              value={walletAddress}
              onChange={handleChange}
              required
            />
            {error && <p className="error-message">{error}</p>}
          </label>
        </p>
        <p>
          <button type="submit">Submit Feedback</button>
        </p>
      </form>
      <div>
        <ul className="footer-links">
          <li>
            <a
              href="https://twitter.com/suicityp2e"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter Link for SuiCityP2E"
            >
              Twitter
            </a>
          </li>
          <li>
            <a
              href="https://discord.com/invite/Aeth26cr25"
              target="_blank"
              aria-label="Discord Link for SuiCityP2E"
            >
              Discord
            </a>
          </li>
          <li>
            <a href="mailto:suicity.p2e@gmail.com" aria-label="Mail SuiCityP2E">
              Mail
            </a>
          </li>
          <li>
            <a
              href="https://zealy.io/cw/suicityp2e/questboard"
              target="_blank"
              aria-label="Zealy Link for SuiCityP2E"
            >
              Zealy
            </a>
          </li>
          <li>
            <a
              href="https://linktr.ee/suicityp2e"
              target="_blank"
              aria-label="Linktree Link for SuiCityP2E"
            >
              Linktree
            </a>
          </li>
        </ul>
      </div>
      <div>
        <p className="footer-reserved">SuiCity © 2024. All rights reserved.</p>
      </div>
      <div></div>
    </footer>
  );
};

export default Footer;
