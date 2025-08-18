import React, { useEffect, useState } from "react";
import './App.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { loadLeaderboardHistory, rowerSession } from "./firebase";
import { adjustedErgScore, goldMedalPercentage, getSessionStats, getDistanceForLastPeriod } from "./Util";
import ThreeWaySwitch from "./ThreeWaySwitch";
import template from "./Data";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function LeaderboardApp({ setOpenModal }) {
      const [activeTab, setActiveTab] = useState("erg");
    const [hoveredName, setHoveredName] = useState(null);
    const [ergSortKey, setErgSortKey] = useState("adjustedSplit");
    const [waterSortKey, setWaterSortKey] = useState("goldPercentage");
    const [timeScale, setTimeScale] = useState("total");
    const [data, setData] = useState([])
    const [leaderboardHistory,setLeaderboardHistory] = useState(template)
    const [flash, setFlash] = useState(false);
    const [hoverTimeout, setHoverTimeout] = useState(null);

    const handleMouseEnter = (name) => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setHoveredName(name);
    };

    const handleMouseLeave = () => {
    setHoverTimeout(setTimeout(() => setHoveredName(null), 1000));
    };


    const handleClick = () => {
        setFlash(true);
        handleOpen();
        onSubmitSession?.();
        setTimeout(() => setFlash(false), 300); // Remove flash after transition
    };

    const handleOpen = () => {
        setOpenModal(true)
    }

    const onSubmitSession = (entry) =>{
        rowerSession(entry)
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const stats = await getSessionStats(timeScale);
                setData(stats);
            } catch (error) {
                console.error("Error fetching session stats:", error);
            }
        };

        const fetchLeaderBoard = async ()  => {
            try {
                const lb = await loadLeaderboardHistory();
                setLeaderboardHistory(lb)
            } catch (error) {
                console.error("Error leaderboard:", error);
            }
        }

        fetchData();
        fetchLeaderBoard();
    }, [timeScale]);

    // === New helpers to always pick latest non-empty snapshot per type ===
    const findLatestWithData = (history, type) => {
        for (let i = history.length - 1; i >= 0; i--) {
            if (history[i][type] && history[i][type].length > 0) {
                return history[i];
            }
        }
        return null;
    };

    const findPrevWithData = (history, type, latest) => {
        const latestIndex = history.indexOf(latest);
        if (latestIndex <= 0) return null;
        for (let i = latestIndex - 1; i >= 0; i--) {
            if (history[i][type] && history[i][type].length > 0) {
                return history[i];
            }
        }
        return null;
    };

    const latestErg = findLatestWithData(leaderboardHistory, "ergData");
    const latestWater = findLatestWithData(leaderboardHistory, "waterData");
    const prevErg = latestErg ? findPrevWithData(leaderboardHistory, "ergData", latestErg) : null;
    const prevWater = latestWater ? findPrevWithData(leaderboardHistory, "waterData", latestWater) : null;

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

                    // Ascending for time-based, descending otherwise
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

    const sortedErg = [...(latestErg?.ergData || [])].sort((a, b) => {
        return parseSplitTime(a[ergSortKey]) - parseSplitTime(b[ergSortKey]);
    });

    const handleErgSort = (key) => setErgSortKey(key);
    const handleWaterSort = (key) => setWaterSortKey(key);

    const parseTimeToSeconds = (timeStr) => {
        const [minutes, rest] = timeStr.split(":");
        const seconds = parseFloat(rest);
        return parseInt(minutes, 10) * 60 + seconds;
    };

    const sortedWater = [...(latestWater?.waterData || [])].sort((a, b) => {
        if (waterSortKey === "goldPercentage") {
            return b.goldPercentage - a.goldPercentage;
        } else if (waterSortKey === "time") {
            return parseTimeToSeconds(a.time) - parseTimeToSeconds(b.time);
        }
        return 0;
    });

    const handleSettingChange = (newSetting) => {
        setTimeScale(newSetting.toLowerCase());
    };

    const { dates, rankMap } = getRankingsOverTime(
        leaderboardHistory,
        activeTab === 'erg' ? 'ergData' : 'waterData',
        activeTab === 'erg' ? 'adjustedSplit' : 'goldPercentage'
    );

    const getDelta = (name, index, currentList, prevList, key, sortAsc = true) => {
        if (!prevList) return "-";
        const sortedPrev = [...prevList].sort((a, b) => sortAsc ? a[key] - b[key] : b[key] - a[key]);
        const prevIndex = sortedPrev.findIndex(r => r.name === name);
        if (prevIndex === -1) return "-";
        const diff = prevIndex - index;
        return diff === 0 ? "-" : diff > 0 ? `↑ ${diff}` : `↓ ${-diff}`;
    };

    const changePerRower = getDistanceForLastPeriod(timeScale);


  return (
    <div className="container">{/*TODO align to the left on mobile*/}
      <h1 className="title">Neptune Boat Club Leaderboard</h1>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-button ${activeTab === "erg" ? "active" : ""}`} onClick={() => setActiveTab("erg")}>Erg Scores</button>
        <button className={`tab-button ${activeTab === "water" ? "active" : ""}`} onClick={() => setActiveTab("water")}>On the Water</button>
        <button className={`tab-button ${activeTab === "sessions" ? "active" : ""}`} onClick={() => setActiveTab("sessions")}>Sessions</button>
      </div>

      {/* Erg Table */}
      {activeTab === "erg" && latestErg && (
        <div className="table-container">{/*TODO align to the left on mobile*/}
          <p style={{ textAlign: "center", marginBottom: "0.5rem", color:"dimgray" }}>
            <b>This Week Session:</b> 10×500m (1 min rest) {/*TODO Make this customizable*/}
          </p>
          <p style={{ textAlign: "center", marginBottom: "1rem", color:"dimgray" }}>
            <b>Next Week Session:</b> 8×500m (1 min rest) {/*TODO Make this customizable*/}
          </p>
          <table>
            <table>
  <thead>
    <tr>
      <th>Rank</th>
      <th>Name</th>
      <th>Weight (kg)</th>
      <th onClick={() => handleErgSort("split")}
          className={`sortable ${ergSortKey === "split" ? "sorted-column" : ""}`}>
        Split /500m
      </th>
      <th onClick={() => handleErgSort("adjustedSplit")}
          className={`sortable ${ergSortKey === "adjustedSplit" ? "sorted-column" : ""}`}>
        Adj. Split /500m
      </th>
      <th>Change</th>
    </tr>
  </thead>
  <tbody>
    {sortedErg.map((rower, index) => (
      <tr key={rower.name}
        onMouseEnter={() => handleMouseEnter(rower.name)}
        onMouseLeave={handleMouseLeave}>
        <td>{index + 1}</td>
        <td>{rower.name}</td>
        <td>{rower.weight}</td>
        <td>{rower.split}</td>
        <td>{adjustedErgScore(rower.split, rower.weight)}</td>
        <td>{getDelta(
          rower.name,
          index,
          sortedErg,
          prevErg?.ergData?.map(row => ({
            ...row,
            split: parseSplitTime(row.split),
            adjustedSplit: parseSplitTime(row.adjustedSplit)
          })),
          ergSortKey,
          true
        )}</td>
      </tr>
    ))}
  </tbody>
</table>

          </table>
        </div>
      )}

      {/* Water Table */}
      {activeTab === "water" && latestWater && (
        <div className="table-container">{/*TODO align to the left on mobile*/}
          <p style={{ textAlign: "center", marginBottom: "0.5rem", color:"dimgray"}}>
            <b>This Week Session:</b> 1×2km {/*TODO Make this customizable*/}
          </p>
          <p style={{ textAlign: "center", marginBottom: "1rem",color:"dimgray" }}>
            <b>Next Week Session:</b> 6×1km {/*TODO Make this customizable*/}
          </p>
          <table>
            <table>
  <thead>
    <tr>
      <th>Rank</th>
      <th>Name</th>
      <th>Boat Class</th>
      <th onClick={() => handleWaterSort("time")}
          className={`sortable ${waterSortKey === "time" ? "sorted-column" : ""}`}>
        Time
      </th>
      <th onClick={() => handleWaterSort("goldPercentage")}
          className={`sortable ${waterSortKey === "goldPercentage" ? "sorted-column" : ""}`}>
        Gold Medal %
      </th>
      <th>Change</th>
    </tr>
  </thead>
  <tbody>
    {sortedWater.map((rower, index) => (
      <tr key={rower.name}
        onMouseEnter={() => handleMouseEnter(rower.name)}
        onMouseLeave={handleMouseLeave}>
        <td>{index + 1}</td>
        <td>{rower.name}</td>
        <td>{rower.boatClass}</td>
        <td>{rower.time}</td>
        <td>{goldMedalPercentage(rower.time,rower.boatClass,rower.distance)}</td>
        <td>{getDelta(
          rower.name,
          index,
          sortedWater,
          prevWater?.waterData?.map(row => ({
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

          </table>
        </div>
      )}

      {/* Sessions Table */}
      {activeTab === "sessions" && (
        <div className="table-container">
          <div style={{ display: 'flex', justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <ThreeWaySwitch onChange={handleSettingChange} />
            <button
              className={`session-button ${flash ? "flash" : ""}`}
              onClick={handleClick}
            >
              Submit Session
            </button>
          </div>
          <table>
           <table>
  <thead>
    <tr>
      <th>Rank</th>
      <th>Name</th>
      <th>Steady %</th>
      <th>Intensity %</th>
      <th>Weights %</th>
      <th>Distance (m)</th>
      <th>Change</th>
    </tr>
  </thead>
  <tbody>
    {data.map((rower, index) => {
      const { totalDistance, totalSessions, steadyCount, intensityCount, weightsCount } = rower;
      const steadyPercent = totalSessions > 0 ? ((steadyCount / totalSessions) * 100).toFixed(1) + "%" : "-";
      const intensityPercent = totalSessions > 0 ? ((intensityCount / totalSessions) * 100).toFixed(1) + "%" : "-";
      const weightsPercent = totalSessions > 0 ? ((weightsCount / totalSessions) * 100).toFixed(1) + "%" : "-";
      return (
        <tr key={rower.name}>
          <td>{index + 1}</td>
          <td>{rower.name}</td>
          <td>{steadyPercent}</td>
          <td>{intensityPercent}</td>
          <td>{weightsPercent}</td>
          <td>{totalDistance}</td>
          <td>
            {changePerRower[rower.name] != null && changePerRower[rower.name] !== 0 ? (
              <>
                {totalDistance - changePerRower[rower.name] !== 0
                  ? totalDistance - changePerRower[rower.name]
                  : ""}
                {" "}
                {totalDistance - changePerRower[rower.name] === 0
                  ? "-"
                  : totalDistance - changePerRower[rower.name] > 0
                    ? "▲"
                    : "▼"}
              </>
            ) : (
              "-"
            )}
          </td>
        </tr>
      );
    })}
  </tbody>
</table>

          </table>
        </div>
      )}

      {/* Modal with Chart */}
      {hoveredName && (
        <div
            className="modal"
            onMouseEnter={() => {
                if (hoverTimeout) clearTimeout(hoverTimeout);
            }}
            onMouseLeave={handleMouseLeave}
            >

          <div className="modal-content">
            <span className="close-button" onClick={() => setHoveredName(null)}>&times;</span>
            <h2 style={{ marginBottom: "1rem" }}>{hoveredName}'s Progress</h2>
            <Line
            data={{
                labels: dates,
                datasets: [
                {
                    label: "Rank",
                    data: rankMap[hoveredName],
                    borderColor: "#3b82f6",
                    backgroundColor: "#60a5fa",
                },
                ],
            }}
            height={300} // set fixed height
            options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                y: {
                    min: 1,
                    max: Math.max(
                    (latestErg?.ergData?.length || 0),
                    (latestWater?.waterData?.length || 0),
                    5
                    ),
                    reverse: true,
                    ticks: { stepSize: 1, precision: 0 },
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
