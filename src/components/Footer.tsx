import React, { useState } from "react";
import "../assets/styles/Footer.css";

const Footer: React.FC = () => {
  const [feedback, setFeedback] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "feedback") setFeedback(value);
    if (name === "walletAddress") setWalletAddress(value);
  };

  return (
    <footer className="footer" id="footer">
      <p className="warn">
        This is a test version of the game, and many features, mechanics, and
        visual elements are still under development. Please note that everything
        is subject to change as we continue to refine and improve the
        experience. Expect updates, modifications, and potential resets as we
        work towards the final version."
      </p>

      <form
        name="feedback"
        method="POST"
        data-netlify="true"
        netlify-honeypot="bot-field"
        className="feedback-form"
      >
        <input type="hidden" name="form-name" value="feedback" />
        <p>
          <label>
            Feedback
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
            Wallet Address
            <input
              type="text"
              name="walletAddress"
              value={walletAddress}
              onChange={handleChange}
              required
            />
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
              href="https://discord.com/invite/Aeth26cr25 "
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
