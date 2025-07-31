import React, { useState } from "react";
import './App.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import leaderboardHistory from "./Data";
import {adjustedErgScore, goldMedalPercentage, getSessionStats, getDistanceForLastPeriod} from "./Util";
import ThreeWaySwitch from "./ThreeWaySwitch";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function LeaderboardApp() {
    const [activeTab, setActiveTab] = useState("erg");
    const [hoveredName, setHoveredName] = useState(null);
    const [ergSortKey, setErgSortKey] = useState("adjustedSplit");
    const [waterSortKey, setWaterSortKey] = useState("goldPercentage");
    const [timeScale, setTimeScale] = useState("total");


    const latest = leaderboardHistory[leaderboardHistory.length - 1];
    const prev = leaderboardHistory.length > 1 ? leaderboardHistory[leaderboardHistory.length - 2] : null;

    const parseTime = (timeStr) => {
        const parts = timeStr.split(":");
        if (parts.length === 2) {
            const [min, sec] = parts;
            return parseFloat(min) * 60 + parseFloat(sec);
        }
        return parseFloat(timeStr); // fallback if already number
    };

    const getRankingsOverTime = (history, type, key) => {
        const nameSet = new Set();
        history.forEach(snapshot => {
            if (snapshot[type]) {
                snapshot[type].forEach(row => nameSet.add(row.name));
            }
        });

        const names = Array.from(nameSet);
        const dates = history.map(h => h.date);
        const rankMap = {};

        names.forEach(name => {
            rankMap[name] = history.map(snapshot => {
                const rows = snapshot[type];
                if (!rows) return null;

                const sorted = [...rows].sort((a, b) => {
                    const aVal = typeof a[key] === "string" ? parseTime(a[key]) : a[key];
                    const bVal = typeof b[key] === "string" ? parseTime(b[key]) : b[key];

                    // Ascending for time-based (split/adjustedSplit/time), descending otherwise
                    const sortAsc = ["split", "adjustedSplit", "time"].includes(key);
                    return sortAsc ? aVal - bVal : bVal - aVal;
                });

                const index = sorted.findIndex(r => r.name === name);
                return index >= 0 ? index + 1 : null;
            });
        });

        return { dates, rankMap };
    };

    const parseSplitTime = (timeStr) => {
        if (!timeStr || typeof timeStr !== "string") return Infinity;
        const [min, sec] = timeStr.split(":");
        return parseInt(min, 10) * 60 + parseFloat(sec);
    };

    const sortedErg = [...latest.ergData].sort((a, b) => {
        return parseSplitTime(a[ergSortKey]) - parseSplitTime(b[ergSortKey]);
    });


    const handleErgSort = (key) => setErgSortKey(key);
    ;
    const handleWaterSort = (key) => setWaterSortKey(key);

    const parseTimeToSeconds = (timeStr) => {
        const [minutes, rest] = timeStr.split(":");
        const seconds = parseFloat(rest);
        return parseInt(minutes, 10) * 60 + seconds;
    };

    const sortedWater = [...latest.waterData].sort((a, b) => {
        if (waterSortKey === "goldPercentage") {
            return b.goldPercentage - a.goldPercentage;
        } else if (waterSortKey === "time") {
            return parseTimeToSeconds(a.time) - parseTimeToSeconds(b.time); // ascending
        }
        return 0;
    });

    const handleSettingChange = (newSetting) => {
        setTimeScale(newSetting.toLowerCase());
    };



    const { dates, rankMap } = getRankingsOverTime(leaderboardHistory, activeTab === 'erg' ? 'ergData' : 'waterData', activeTab === 'erg' ? 'adjustedSplit' : 'goldPercentage');

    const getDelta = (name, index, currentList, prevList, key, sortAsc = true) => {
        if (!prevList) return "-";
        const sortedPrev = [...prevList].sort((a, b) => sortAsc ? a[key] - b[key] : b[key] - a[key]);
        const prevIndex = sortedPrev.findIndex(r => r.name === name);
        if (prevIndex === -1) return "-";
        const diff = prevIndex - index;
        return diff === 0 ? "-" : diff > 0 ? `↑ ${diff}` : `↓ ${-diff}`;
    };
    const changePerRower = getDistanceForLastPeriod(timeScale)
    return (
        <div className="container">
            <h1 className="title">Neptune Boat Club Leaderboard</h1>
            <div className="tabs">
                <button className={`tab-button ${activeTab === "erg" ? "active" : ""}`} onClick={() => setActiveTab("erg")}>Erg Scores</button>
                <button className={`tab-button ${activeTab === "water" ? "active" : ""}`} onClick={() => setActiveTab("water")}>On the Water</button>
                <button className={`tab-button ${activeTab === "sessions" ? "active" : ""}`} onClick={() => setActiveTab("sessions")}>Sessions</button>
            </div>
            {activeTab === "erg" && (
                <div className="table-container">
                    <p style={ {textAlign: "center"}}><b>This Week Session:</b> 10*500m 1 min rest</p> <p style={ {textAlign: "center"}}> <b>Next Week Session:</b> 8*500m 1 min rest </p>

                    <table>
                        <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Weight (kg)</th>
                            <th
                                onClick={() => handleErgSort("split")}
                                className={`sortable ${ergSortKey === "split" ? "sorted-column" : ""}`}
                            >
                                Split /500m
                            </th>
                            <th
                                onClick={() => handleErgSort("adjustedSplit")}
                                className={`sortable ${ergSortKey === "adjustedSplit" ? "sorted-column" : ""}`}
                            >
                                Adj. Split /500m
                            </th>
                            <th>Change</th>

                        </tr>
                        </thead>
                        <tbody>
                        {sortedErg.map((rower, index) => (
                            <tr
                                key={rower.name}
                                onMouseEnter={() => setHoveredName(rower.name)}
                                onMouseLeave={() => setHoveredName(null)}
                            >

                                <td>{index + 1}</td>
                                <td>{rower.name}</td>
                                <td>{rower.weight}</td>
                                <td>{rower.split}</td>
                                <td>{adjustedErgScore(rower.split, rower.weight)}</td>
                                <td>{getDelta(
                                    rower.name,
                                    index,
                                    sortedErg,
                                    prev?.ergData?.map(row => ({
                                        ...row,
                                        split: parseSplitTime(row.split),
                                        adjustedSplit: parseSplitTime(row.adjustedSplit)
                                    })),
                                    ergSortKey,
                                    true
                                )
                                }</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "water" && (
                <div className="table-container">
                    <p style={ {textAlign: "center"}}><b>This Week Session:</b> 1*2km</p> <p style={ {textAlign: "center"}}> <b>Next Week Session:</b> 6*1km</p>
                    <table>
                        <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Boat Class</th>
                            <th
                                onClick={() => handleWaterSort("time")}
                                className={`sortable ${waterSortKey === "time" ? "sorted-column" : ""}`}
                            >
                                Time
                            </th>
                            <th
                                onClick={() => handleWaterSort("goldPercentage")}
                                className={`sortable ${waterSortKey === "goldPercentage" ? "sorted-column" : ""}`}
                            >
                                Gold Medal %
                            </th>
                            <th>Change</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedWater.map((rower, index) => (
                            <tr key={rower.name} onMouseEnter={() => setHoveredName(rower.name)} onMouseLeave={() => setHoveredName(null)}>
                                <td>{index + 1}</td>
                                <td>{rower.name}</td>
                                <td>{rower.boatClass}</td>
                                <td>{rower.time}</td>
                                <td>{goldMedalPercentage(rower.time,rower.boatClass,rower.distance)}</td>
                                <td>{getDelta(
                                        rower.name,
                                    index,
                                    sortedWater,
                                    prev?.waterData?.map(row => ({
                                    ...row,
                                    time: parseTimeToSeconds(row.time)
                                })),
                                    waterSortKey,
                                    waterSortKey !== "goldPercentage"
                                    )}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
            {activeTab === "sessions" && (
                <div className="table-container">
                        <div style={{ alignItems: 'right', padding:'6px'}}>
                            <ThreeWaySwitch onChange={handleSettingChange}/>
                        </div>
                    <table>
                        <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Steady %</th>
                            <th>Intensity %</th>
                            <th>Distance (m)</th>
                            <th>Change</th>
                        </tr>
                        </thead>
                        <tbody>
                        {getSessionStats(timeScale).map((rower, index) => {
                            const { totalDistance, totalSessions, steadyCount, intensityCount } = rower;
                            const steadyPercent = totalSessions > 0 ? ((steadyCount / totalSessions) * 100).toFixed(1) + "%" : "-";
                            const intensityPercent = totalSessions > 0 ? ((intensityCount / totalSessions) * 100).toFixed(1) + "%" : "-";
                            return (
                                <tr key={rower.name}>
                                    <td>{index + 1}</td>
                                    <td>{rower.name}</td>
                                    <td>{steadyPercent}</td>
                                    <td>{intensityPercent}</td>
                                    <td>{totalDistance}</td>
                                    <td>
                                    {changePerRower[rower.name] != null && changePerRower[rower.name] !== 0 ? (
                                        <>
                                            {totalDistance - changePerRower[rower.name]}{" "}
                                            {totalDistance - changePerRower[rower.name] > 0 ? "▲" : "▼"}
                                        </>
                                    ) : (
                                        "-"
                                    )}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            {hoveredName && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close-button" onClick={() => setHoveredName(null)}>&times;</span>
                        <h2>{hoveredName}'s Rank</h2>
                        <Line
                            data={{
                                labels: dates,
                                datasets: [
                                    {
                                        label: "Rank",
                                        data: rankMap[hoveredName],
                                        borderColor: "#004d99",
                                        backgroundColor: "#e6b800",

                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        min: 1,
                                        max: (leaderboardHistory[(leaderboardHistory.length-1)].ergData.length > leaderboardHistory[(leaderboardHistory.length-1)].waterData.length
                                            ? (leaderboardHistory.ergData.length[(leaderboardHistory.length-1)] > 5 ? leaderboardHistory[(leaderboardHistory.length-1)].ergData.length : 5)
                                            : (leaderboardHistory[(leaderboardHistory.length-1)].waterData.length > 5 ? leaderboardHistory[(leaderboardHistory.length-1)].waterData.length : 5)),
                                        reverse: true,
                                        ticks: {
                                            stepSize: 1,
                                            precision: 0,
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}