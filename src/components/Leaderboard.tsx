import React, { useEffect, useState } from "react";

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

    // Fetch the leaderboard data from the backend
    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const response = await fetch("/.netlify/functions/get-leaderboard"); // Adjust this URL to your backend API endpoint

            if (!response.ok) {
                throw new Error("Failed to fetch leaderboard");
            }

            const data = await response.json();
            setLeaderboardData(data); // Set the leaderboard data from the API
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

    // Call the fetchLeaderboard function when the component mounts
    useEffect(() => {
        fetchLeaderboard();
    }, []);

    // If loading, show a loading message
    if (loading) {
        return <div>Loading leaderboard...</div>;
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
                        <tr key={user._id}>
                            <td>
                                {/* Add medals for the top 3 users */}
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                            </td>
                            <td style={{ color: "white", fontWeight: "300" }}>
                                {user.twitterId}
                            </td>
                            <td>{user.population.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Leaderboard;
