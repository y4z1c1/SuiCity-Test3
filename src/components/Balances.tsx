import React, { useCallback, useEffect, useState } from "react";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface BalancesProps {
  sityBalance: number; // The current SITY balance
  onBalancesUpdate: (suiBalance: number) => void; // Callback to pass balances back to Game
  refreshTrigger: boolean; // Use this prop to trigger refresh
}

const Balances: React.FC<BalancesProps> = ({
  sityBalance,
  onBalancesUpdate,
  refreshTrigger,
}) => {
  const account = useCurrentAccount();
  const [suiBalance, setSuiBalance] = useState<number>(0);

  const provider = new SuiClient({
    url: getFullnodeUrl("mainnet"),
  });

  const fetchBalances = useCallback(async () => {
    if (!account?.address) return;

    try {
      const [suiResponse] = await Promise.all([

        provider.getBalance({ owner: String(account?.address) }),
      ]);



      const fetchedSuiBalance =
        parseInt(suiResponse.totalBalance) / Number(MIST_PER_SUI);

      // Update state
      setSuiBalance(fetchedSuiBalance);

      // Pass the balances back to Game.tsx
      onBalancesUpdate(fetchedSuiBalance);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  }, [account?.address, onBalancesUpdate]);

  useEffect(() => {
    fetchBalances();
  }, [account?.address, fetchBalances, refreshTrigger]);

  // Function to format the balance for readability
  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return (balance / 1000000).toFixed(2) + "M";
    } else if (balance >= 1000) {
      return (balance / 1000).toFixed(2) + "k";
    }
    return balance.toFixed(2);
  };

  return (
    <div className="balance-columns">
      <div className="balance-bar">
        <img
          src="https://assets.staticimg.com/cms/media/8uGGQmvkfODw7cnx3GuekBb404A2bTYUcTjBklHja.png"
          alt="SUI logo"
          className="balance-bar-icon"
        />
        <div className="balance-bar-track">
          <div
            className="balance-bar-fill balance-bar-fill-sui"
            style={{ width: `${suiBalance}%` }}
          ></div>
          <div
            className="balance-amount"
            style={{
              color: suiBalance < 0.01 ? "red" : "inherit", // Text will turn red if balance is below 0.005
            }}
          >{`${formatBalance(suiBalance)}  $SUI`}</div>
        </div>
      </div>
      <div className="balance-bar">
        <img
          src="https://bafybeig4236djyafwvxzkb3km7o3xa25lsfg55bxvyrwbxyemlzjnjjpsi.ipfs.w3s.link/sity%20logo.png"
          alt="SITY logo"
          className="balance-bar-icon"
        />
        <div className="balance-bar-track">
          <div
            className="balance-bar-fill balance-bar-fill-sity"
            style={{ width: `${sityBalance / 20000}%` }}
          ></div>
          <div className="balance-amount">{`${formatBalance(
            sityBalance
          )}  $SITY`}</div>
        </div>
      </div>
    </div>
  );
};

export default Balances;
