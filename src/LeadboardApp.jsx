import React, { useEffect, useState } from "react";
import './App.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { getWaterWorkouts, getErgWorkouts, loadLeaderboardHistory, rowerSession } from "./firebase";
import { adjustedErgScore, goldMedalPercentage, getSessionStats, getDistanceForLastPeriod, getRankIcon } from "./Util";
import ThreeWaySwitch from "./ThreeWaySwitch";
import {points} from "./Points"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function LeaderboardApp({ setOpenModal }) {
  const [activeTab, setActiveTab] = useState("erg");
  const [hoveredName, setHoveredName] = useState(null);
  const [ergSortKey, setErgSortKey] = useState("adjustedSplit");
  const [waterSortKey, setWaterSortKey] = useState("goldPercentage");
  const [timeScale, setTimeScale] = useState("total");
  const [data, setData] = useState([])
  const [leaderboardHistory, setLeaderboardHistory] = useState([])
  const [flash, setFlash] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [changePerRower, setChangePerRower] = useState([])
  const [rankHistory, setRankHistory] = useState({ dates: [], rankMap: {} });
  const [ergWorkouts, setErgWorkouts] = useState({
    currentWeek: 'TBD',
    nextWeek: 'TBD'
  })
  const [waterWorkouts, setWaterWorkouts] = useState({
    currentWeek: 'TBD',
    nextWeek: 'TBD'
  })
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

  const onSubmitSession = (entry) => {
    rowerSession(entry)
  }

  useEffect(() => {
    if (leaderboardHistory.length === 0) return;

    const { dates, rankMap } = getRankingsOverTime(
      leaderboardHistory,
      activeTab === "erg" ? "ergData" : "waterData",
      activeTab === "erg" ? ergSortKey : waterSortKey
    );

    setRankHistory({ dates, rankMap });
  }, [leaderboardHistory, activeTab, ergSortKey, waterSortKey]);

  useEffect(() => {
    const fetchErgWorkouts = async () => {
      try {
        const workouts = await getErgWorkouts()
        setErgWorkouts(workouts)
      } catch (error) {
        console.error("Error fetching workouts stats:", error);
      }
    }

    const fetchWaterWorkouts = async () => {
      try {
        const workouts = await getWaterWorkouts()
        setWaterWorkouts(workouts)
      } catch (error) {
        console.error("Error fetching workouts stats:", error);
      }
    }

    const fetchLeaderBoard = async () => {
      try {
        const lb = await loadLeaderboardHistory();
        setLeaderboardHistory(lb)
      } catch (error) {
        console.error("Error leaderboard:", error);
      }
    }
    fetchLeaderBoard();
    fetchErgWorkouts();
    fetchWaterWorkouts();
  }, [])

  useEffect(() => {



    const fetchData = async () => {
      try {
        const stats = await getSessionStats(timeScale);
        setData(stats);
      } catch (error) {
        console.error("Error fetching session stats:", error);
      }
    };

    const fetchChange = async () => {
      try {
        const change = await getDistanceForLastPeriod(timeScale)
        setChangePerRower(change);
      } catch (error) {
        console.error("Error fetching change:", error);
      }
    }

    fetchData();
    fetchChange();
  }, [timeScale]);

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
        const getValue = (row) => {
          if (key === "adjustedSplit") {
            return parseSplitTime(adjustedErgScore(row.split, row.weight));
          } else if (key === "split") {
            return parseSplitTime(row.split);
          } else if (key === "time") {
            return parseSplitTime(row.time);
          } else if (key === "goldPercentage") {
            return goldMedalPercentage(row.time, row.boatClass, row.distance);
          }
          return row[key] ?? 0;
        };

        // Ascending for time-based splits
        const sortAsc = ["split", "adjustedSplit", "time"].includes(key);
        return sortAsc ? getValue(a) - getValue(b) : getValue(b) - getValue(a);
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
    const getValue = (rower, key) => {
      if (key === "adjustedSplit") {
        return parseSplitTime(adjustedErgScore(rower.split, rower.weight));
      } else if (key === "split") {
        return parseSplitTime(rower.split);
      }
      return Infinity; // fallback
    };

    return getValue(a, ergSortKey) - getValue(b, ergSortKey);
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
      return goldMedalPercentage(b.time, b.boatClass, b.distance) -
        goldMedalPercentage(a.time, a.boatClass, a.distance);
    } else if (waterSortKey === "time") {
      return parseTimeToSeconds(a.time) - parseTimeToSeconds(b.time);
    }
    return 0;
  });


  const handleSettingChange = (newSetting) => {
    setTimeScale(newSetting.toLowerCase());
  };

  const getDelta = (name, index, currentList, prevList, key, sortAsc = true) => {
    if (!prevList) return "-";
    const sortedPrev = [...prevList].sort((a, b) => sortAsc ? a[key] - b[key] : b[key] - a[key]);
    const prevIndex = sortedPrev.findIndex(r => r.name === name);
    if (prevIndex === -1) return "-";
    const diff = prevIndex - index;
    return diff === 0 ? "-" : diff > 0 ? `↑ ${diff}` : `↓ ${-diff}`;
  };


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
        <div className="table-container" style={{ width: "90%" }}>{/*TODO align to the left on mobile*/}
          <div className="table-section">
            <div className="table-description">
              <p style={{ textAlign: "center", marginBottom: "0.5rem", color: "white" }}>
                <b>This Week Session:</b> {ergWorkouts.currentWeek}
              </p>
              <p style={{ textAlign: "center", marginBottom: "1rem", color: "white" }}>
                <b>Next Week Session:</b> {ergWorkouts.nextWeek}
              </p>
            </div>
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
                      onClick={() => handleMouseEnter(rower.name)}>
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
        </div>
      )}

      {/* Water Table */}
      {activeTab === "water" && latestWater && (
        <div className="table-container" style={{ width: "90%" }}>{/*TODO align to the left on mobile*/}
          <div className="table-section">
            <div className="table-description">
              <p style={{ textAlign: "center", marginBottom: "0.5rem", color: "white" }}>
                <b>This Week Session:</b> {waterWorkouts.currentWeek}
              </p>
              <p style={{ textAlign: "center", marginBottom: "1rem", color: "white" }}>
                <b>Next Week Session:</b> {waterWorkouts.nextWeek}
              </p>
            </div>
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
                      onClick={() => handleMouseEnter(rower.name)}>
                      <td>{index + 1}</td>
                      <td>{rower.name}</td>
                      <td>{rower.boatClass}</td>
                      <td>{rower.time}</td>
                      <td>{goldMedalPercentage(rower.time, rower.boatClass, rower.distance).toFixed(2)}%</td>
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
        </div>
      )}

      {/* Sessions Table */}
      {activeTab === "sessions" && (
        <div className="table-container sessions-table" style={{ width: "90%" }}>{/*TODO align to the left on mobile*/}
          <div className="table-section">
            <div className="table-description">
              <div style={{ display: 'flex', justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <ThreeWaySwitch onChange={handleSettingChange} />
                <button
                  className={`session-button ${flash ? "flash" : ""}`}
                  onClick={handleClick}
                >
                  Submit Session
                </button>
              </div>
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
                    <th className="end-tab">
                      {timeScale === "total" ? "Level" : "Change"}
                    </th>
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
                        <td>{totalDistance.toLocaleString('en-US')}</td>
                        <td>
                          {timeScale === 'total' ? (
                            getRankIcon(totalDistance)
                          ) : changePerRower[rower.name] != null && changePerRower[rower.name] !== 0 ? (
                            <>
                              {totalDistance - changePerRower[rower.name] !== 0
                                ? (Math.abs(totalDistance - changePerRower[rower.name]).toLocaleString('en-US'))
                                : ""}
                              {" "}
                              {totalDistance - changePerRower[rower.name] === 0
                                ? "-"
                                : totalDistance - changePerRower[rower.name] > 0
                                  ? " ▲"
                                  : " ▼"}
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
        </div>
      )}

      {/* Modal with Chart */}
      {hoveredName && (
        <div className="modal">
          <div className="modal-content">
            <span
              className="close-button"
              style={{ color: "white" }}
              onClick={() => setHoveredName(null)}
            >
              &times;
            </span>
            <h2 style={{ marginBottom: "1rem" }}>{hoveredName}'s Profile</h2>
            <p><b>Sculling Points: </b> {points[hoveredName].scull}</p>
            <p><b>Sweep Points: </b> {points[hoveredName].sweep}</p>
            <Line
              data={{
                labels: rankHistory.dates,
                datasets: [
                  {
                    label: "Rank",
                    data: rankHistory.rankMap[hoveredName],
                    borderColor: "#3b82f6",
                    backgroundColor: "#60a5fa",
                    spanGaps: true,   // 👈 connects missing entries
                  },
                ],
              }}
              height={"300%"} // set fixed height
              options={{
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                  y: {
                    min: 1,
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
