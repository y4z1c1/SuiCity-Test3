import React, { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

// Define the structure of a leaderboard item
interface LeaderboardItem {
    _id: string;
    walletAddress: string;
    population: number;
    nft: string;
    nftName: string; // Add nftName to the interface
}

const Leaderboard: React.FC = () => {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [rank, setRank] = useState<number | null>(null); // Rank is a number
    const [currentUserData, setCurrentUserData] = useState<LeaderboardItem | null>(null);
    const account = useCurrentAccount();

    const walletAddress = account?.address || "";
    const formatBalance = (balance: number) => {
        if (balance >= 1000000) {
            return (balance / 1000000).toFixed(2) + "M";
        } else if (balance >= 1000) {
            return (balance / 1000).toFixed(2) + "k";
        }
        return balance.toFixed(2);
    };

    // Fetch the leaderboard data from the backend
    const fetchLeaderboard = async (walletAddress: string) => {
        try {
            setLoading(true);

            // Append the wallet address as a query parameter
            const response = await fetch(`/.netlify/functions/get-leaderboard?walletAddress=${encodeURIComponent(walletAddress)}`);

            if (!response.ok) {
                throw new Error("Failed to fetch leaderboard");
            }

            const data = await response.json();
            // Extract topUsers and currentUser from the response
            const { topUsers, currentUser } = data;

            console.log(topUsers);

            // Set the leaderboard data and user's rank
            setLeaderboardData(topUsers);
            setRank(currentUser.rank);
            setCurrentUserData(currentUser); // Store current user data

        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An error occurred while fetching leaderboard data.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (walletAddress) {
            fetchLeaderboard(walletAddress); // Only fetch leaderboard if walletAddress is available
        }
    }, [walletAddress]);

    // If loading, show a loading message
    if (loading) {
        return <div className="spinner"></div>;
    }

    // If there's an error, display the error message
    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="leaderboard-content">
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>NFT Name</th> {/* Changed from Twitter ID to NFT Name */}
                        <th>Population</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboardData.map((user, index) => (
                        <tr
                            key={user._id}
                            className={user.walletAddress === currentUserData?.walletAddress ? "highlight-row" : ""}
                        >
                            <td>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                            </td>
                            <td style={user.walletAddress === currentUserData?.walletAddress ? { color: "black", fontWeight: "500" } : { color: "white", fontWeight: "300" }}>
                                {user.nftName} {/* Display nftName instead of twitterId */}
                            </td>
                            <td>{formatBalance(user.population)}</td>
                        </tr>
                    ))}

                    {/* Render the current user below the top 50 if their rank is greater than 50 */}
                    {rank && rank > 50 && currentUserData && (
                        <tr className="highlight-row">
                            <td>{rank}.</td>
                            <td>{currentUserData.nftName}</td> {/* Display current user's nftName */}
                            <td>{formatBalance(currentUserData.population)}</td>
                        </tr>
                    )}

                    {/* If rank is 0, display a message asking the user to refresh the page */}
                    {rank === 0 && (
                        <tr>
                            <td className="refresh-message">Please refresh the page.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Leaderboard;
