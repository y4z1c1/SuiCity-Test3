import React, { useState } from "react";
import "../assets/styles/Footer.css";

const Footer: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState("");


  // Regular expression for validating SUI address
  const isValidWalletAddress = (address: string): boolean => {
    const regex = /^0x[a-fA-F0-9]{64}$/; // 66 characters including "0x"
    return regex.test(address);
  };


  return (
    <footer className="footer" id="footer">

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
