// src/components/ConnectStravaButton.jsx
import React from "react";
import StravaIcon from "./StravaIcon";

const ConnectStravaButton = () => {
    const CLIENT_ID = "174999"; // replace with your actual client ID
    const REDIRECT_URI = "https://neptuneleaderboard.netlify.app/strava/callback";
    const SCOPE = "activity:read_all";

    const handleConnect = () => {
        const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
            REDIRECT_URI
        )}&approval_prompt=auto&scope=${SCOPE}`;

        // Redirect the user to Strava's authorization page
        window.location.href = stravaAuthUrl;
    };

    return (
        <button
            onClick={handleConnect}
            style={{
                backgroundColor: "transparent",
                padding:0
            }}
        >
            <StravaIcon/>
        </button>
    );
};

export default ConnectStravaButton;
