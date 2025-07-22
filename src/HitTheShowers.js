import React from 'react';
import leaderboardHistory from "./Data";
function HitTheShowers() {
    return (
        <div
            style={{
                marginTop: "2em",
                padding: "1.5em",
                border: "2px solid #249bff",
                borderRadius: "12px",
                backgroundColor: "#eef1ff",
                color: "#249bff",
                maxWidth: "600px",
                marginLeft: "auto",
                marginRight: "auto",
                textAlign: "center",
            }}
        >
            <h3>🚿 Hit The Showers — Week of {leaderboardHistory[(leaderboardHistory.length-1)].date}</h3>
            <ul>
                Andrew O'Connor
            </ul>
            <blockquote style={{ fontFamily: "'Bangers'", fontSize: "1.4em" }}>
                MAN HIT THE SHOWS
            </blockquote>
        </div>
    );
}


export default HitTheShowers;