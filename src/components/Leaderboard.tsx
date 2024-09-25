import React, { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

// Define the structure of a leaderboard item
interface LeaderboardItem {
    _id: string;
    walletAddress: string;
    population: number;
    twitterId: string;
    nft: string;
}

const Leaderboard: React.FC = () => {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [rank, setRank] = useState<number | null>(null); // Rank is a number
    const [currentUserData, setCurrentUserData] = useState<LeaderboardItem | null>(null);
    const account = useCurrentAccount();

    const walletAddress = account?.address || "";

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
        return <div className="spinner"></div>
            ;
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
                        <th>Twitter ID</th>
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
                                {user.twitterId}
                            </td>
                            <td>{user.population.toFixed(2)}</td>
                        </tr>
                    ))}

                    {/* Render the current user below the top 50 if their rank is greater than 50 */}
                    {rank && rank > 50 && currentUserData && (
                        <tr className="highlight-row">
                            <td>{rank}.</td>
                            <td>{currentUserData.twitterId}</td>
                            <td>{currentUserData.population.toFixed(2)}</td>
                        </tr>
                    )}
                </tbody>
            </table>


        </div>
    );

};

export default Leaderboard;
