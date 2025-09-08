import React, { useEffect, useState } from "react";
import './App.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import {getWorkouts} from "./firebase";
import {
    adjustedErgScore, goldMedalPercentage, getSessionStats, getDistanceForLastPeriod, getRankIcon,
    selectIndividuals
} from "./Util";
import ThreeWaySwitch from "./ThreeWaySwitch";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function LeaderboardApp({sessions, multipliers, workouts, users, leaderboard, setOpenModal, gmpSpeeds }) {
  const [boatSelection, setBoatSelection] = useState({
      level:null,
      boat:null
  })
  const [selectedNames, setSelectedNames] = useState([])
    const [gmp, setGmp] = useState(0)
  const [activeTab, setActiveTab] = useState("sessions");
  const [hoveredName, setHoveredName] = useState(null);
  const [ergSortKey, setErgSortKey] = useState("adjustedSplit");
  const [waterSortKey, setWaterSortKey] = useState("goldPercentage");
  const [timeScale, setTimeScale] = useState("season");
  const [data, setData] = useState([])

  const [flash, setFlash] = useState(false);
  const [changePerRower, setChangePerRower] = useState([])
  const [rankHistory, setRankHistory] = useState({ dates: [], rankMap: {} });
    const [compareNames, setCompareNames] = useState([]);

  const [pieces, setPieces] = useState({erg:{
    currentWeek: 'TBD',
    nextWeek: 'TBD'
  },
    water:{
        currentWeek: 'TBD',
            nextWeek: 'TBD'
    }
  })

    const graphText = {
      "season":"Distance done over the season",
        "month": "Distance done over the current rolling month",
        "week": "Distance done over the past 7 days"
    }
  const handleMouseEnter = (name) => {
    setHoveredName(name);
  };

  const handleClick = () => {
    setFlash(true);
    handleOpen();
    setTimeout(() => setFlash(false), 300); // Remove flash after transition
  };

  const handleOpen = () => {
    setOpenModal(true)
  }

    const handleLevelChange = (e) => {
        const level = e.target.value;
        setBoatSelection((prev) => ({
            ...prev,
            level,
            // set numeric value based on selection
            numericValue: level === "Inter" ? 700 : 250
        }));
    };

    const handleBoatChange = (e) => {
        const boat = e.target.value;
        setBoatSelection((prev) => ({
            ...prev,
            boat
        }));
    };


    useEffect(() =>{
        const type = boatSelection.boat?.includes("x") ? "scull" : "sweep";
        const numIndividuals = (() => {
            const firstChar = boatSelection.boat?.[0]; // get first char safely
            const num = Number(firstChar);             // try to cast to number
            return isNaN(num) ? 0 : num;               // if NaN, return 0
        })();
        const result = selectIndividuals(findLatestWithData(leaderboard, "waterData") ,users,numIndividuals, Number(boatSelection.level), type, gmpSpeeds)
        setSelectedNames(result[1])
        setGmp(result[0])
  },[boatSelection])

  useEffect(() => {
    if (leaderboard.length === 0) return;
    const { dates, rankMap } = getRankingsOverTime(
      leaderboard,
      activeTab === "erg" ? "ergData" : "waterData",
      activeTab === "erg" ? ergSortKey : waterSortKey
    );

    setRankHistory({ dates, rankMap });
  }, [leaderboard, activeTab, ergSortKey, waterSortKey]);

  useEffect(() => {
    const fetchWorkouts = () => {
        try {
            const w = getWorkouts(workouts)
            setPieces(w)
        } catch (error) {
            console.error("Error fetching workouts stats:", error);
        }
    }
    fetchWorkouts();
  }, [workouts])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = getSessionStats(timeScale, multipliers, sessions);
        setData(stats);
      } catch (error) {
        console.error("Error fetching session stats:", error);
      }
    };

    const fetchChange = async () => {
      try {
        const change = getDistanceForLastPeriod(timeScale, sessions)
        setChangePerRower(change);
      } catch (error) {
        console.error("Error fetching change:", error);
      }
    }

    fetchData();
    fetchChange();
  }, [timeScale, multipliers, sessions]);

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

  const latestErg = findLatestWithData(leaderboard, "ergData");
  const latestWater = findLatestWithData(leaderboard, "waterData");
  const prevErg = latestErg ? findPrevWithData(leaderboard, "ergData", latestErg) : null;
  const prevWater = latestWater ? findPrevWithData(leaderboard, "waterData", latestWater) : null;

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
  console.log(history)
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
            return goldMedalPercentage(row.time, row.boatClass, row.distance, gmpSpeeds);
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
      return goldMedalPercentage(b.time, b.boatClass, b.distance, gmpSpeeds) -
        goldMedalPercentage(a.time, a.boatClass, a.distance, gmpSpeeds);
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

    const getDistanceHistory = (name, timescale = "season") => {
        const history = {};
        const now = new Date();

        // define cutoff based on timescale
        let cutoff = null;
        if (timescale === "month") {
            cutoff = new Date(now);
            cutoff.setMonth(now.getMonth() - 1); // exactly one month back
        } else if (timescale === "week") {
            cutoff = new Date(now);
            cutoff.setDate(now.getDate() - 7); // exactly 7 days back
        }
        // "season" = no cutoff (all data)

        sessions.forEach(s => {
            if (!s.name || !s.date || s.distance == null) return;
            if (s.name === name) {
                const [day, month, year] = s.date.split("/").map(Number);
                const d = new Date(year, month - 1, day);

                // skip if before cutoff
                if (cutoff && d < cutoff) return;

                const dayKey = d.toISOString().split("T")[0];
                const distanceNum = Number(s.distance);
                const multiplier = multipliers[s.type] || 1;

                if (!isNaN(distanceNum)) {
                    history[dayKey] = (history[dayKey] || 0) + distanceNum * multiplier;
                }
            }
        });

        // sort dates
        const dates = Object.keys(history).sort((a, b) => new Date(a) - new Date(b));
        const rawDistances = dates.map(d => history[d]);

        // compute cumulative distances
        const cumulativeDistances = rawDistances.reduce((acc, cur, i) => {
            acc.push(cur + (i > 0 ? acc[i - 1] : 0));
            return acc;
        }, []);

        return { dates, distances: cumulativeDistances };
    };


    return (
    <div className="container">
      <h1 className="title">Neptune Boat Club Leaderboard</h1>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-button ${activeTab === "sessions" ? "active" : ""}`} onClick={() => setActiveTab("sessions")}>Sessions</button>
        <button className={`tab-button ${activeTab === "erg" ? "active" : ""}`} onClick={() => setActiveTab("erg")}>Erg Scores</button>
        <button className={`tab-button ${activeTab === "water" ? "active" : ""}`} onClick={() => setActiveTab("water")}>On the Water</button>
      </div>

      {/* Erg Table */}
      {activeTab === "erg" && (
        <div className="table-container" style={{ width: "90%" }}>
          <div className="table-section">
            <div className="table-description">
              <p style={{ textAlign: "center", marginBottom: "0.5rem", color: "white" }}>
                <b>This Week Session:</b> {pieces.erg.currentWeek}
              </p>
              <p style={{ textAlign: "center", marginBottom: "1rem", color: "white" }}>
                <b>Next Week Session:</b> {pieces.erg.nextWeek}
              </p>
            </div>
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
          </div>
        </div>
      )}

      {/* Water Table */}
      {activeTab === "water" && (
        <div className="table-container" style={{ width: "90%" }}>{/*TODO align to the left on mobile*/}
          <div className="table-section">
              <div className='table-description'>
                  { !gmp && (
                  <p style={{color:'white', marginBottom:'1 rem'}}>Select a Boat class and a level to preform seat selection</p>
                  )}
                  {(gmp>0) && (
                      <p style={{color:'white'}}>Gold medal percentage scaled to champs   {boatSelection.level === "700"
                          ? (gmp* 1.07).toFixed(2)
                          : boatSelection.level === "250"
                              ? (gmp * 1.11).toFixed(2)
                              : gmp
                      }%</p>
                  )
                  }
                  <select className= "modal-select" value={boatSelection.level || ""} onChange={handleLevelChange}>
                      <option value="" disabled>Select Level</option>
                      <option value="700">Inter</option>
                      <option value="250">Club</option>
                  </select>

                  {/* Boat Dropdown */}
                  <select className= "modal-select" value={boatSelection.boat || ""} onChange={handleBoatChange}>
                      <option value="" disabled>Select Boat</option>
                      <option value="1x">1x</option>
                      <option value="2x">2x</option>
                      <option value="2">2-</option>
                      <option value="4x">4x</option>
                      <option value="4">4-</option>
                      <option value="8">8+</option>
                  </select>
              </div>
            <div className="table-description">
              <p style={{ textAlign: "center", marginBottom: "0.5rem", color: "white" }}>
                <b>This Week Session:</b> {pieces.water.currentWeek}
              </p>
              <p style={{ textAlign: "center", marginBottom: "1rem", color: "white" }}>
                <b>Next Week Session:</b> {pieces.water.nextWeek}
              </p>
            </div>
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
                      <tr
                          key={rower.name}
                          onClick={() => handleMouseEnter(rower.name)}
                          className={selectedNames.includes(rower.name) ? "gold-row" : ""}
                      >
                          <td>{index + 1}</td>
                          <td>{rower.name}</td>
                          <td>{rower.boatClass}</td>
                          <td>{rower.time}</td>
                          <td>
                              {goldMedalPercentage(rower.time, rower.boatClass, rower.distance).toFixed(2)}%
                          </td>
                          <td>
                              {getDelta(
                                  rower.name,
                                  index,
                                  sortedWater,
                                  prevWater?.waterData?.map(row => ({
                                      ...row,
                                      time: parseTimeToSeconds(row.time)
                                  })),
                                  waterSortKey,
                                  waterSortKey !== "goldPercentage"
                              )}
                          </td>
                      </tr>
                  ))}
                  </tbody>
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
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Steady %</th>
                    <th>Intensity %</th>
                    <th>Weights %</th>
                    <th>Distance (m)</th>
                    <th className="end-tab">
                      {timeScale === "season" ? "Level" : "Change"}
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
                        <tr
                            key={rower.name}
                            onClick={() => setHoveredName(rower.name)} // open modal
                        >
                        <td>{index + 1}</td>
                        <td>{rower.name}</td>
                        <td>{steadyPercent}</td>
                        <td>{intensityPercent}</td>
                        <td>{weightsPercent}</td>
                        <td>{totalDistance.toLocaleString('en-US')}</td>
                        <td>
                          {timeScale === 'season' ? (
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
          </div>
        </div>
      )}

      {/* Modal with Chart */}
        {/* Modal with Chart */}
        {hoveredName && (
            <div className="modal">
                <div className="modal-content">
      <span
          className="close-button"
          style={{ color: "white" }}
          onClick={() => {
              setHoveredName(null);
              setCompareNames([]); // reset comparisons when closing
          }}
      >
        &times;
      </span>
                    <h2 style={{ marginBottom: "1rem" }}>{hoveredName}'s Profile</h2>

                    {/* Athlete info */}
                    <p><b>Sculling Points: </b> {users[hoveredName].scull}</p>
                    <p><b>Sweep Points: </b> {users[hoveredName].sweep.points}</p>
                    <p><b>Sweep Side: </b> {users[hoveredName].sweep.side}</p>
                    <p><b>Available for Champs: </b> {users[hoveredName].champs ? "Yes" : "No"}</p>
                    <div style={{ marginBottom: "1rem" }}>
                        <label style={{ color: "white" }}>Compare with: </label>
                        <select
                            className="modal-select"
                            onChange={(e) => {
                                const name = e.target.value;
                                if (name && !compareNames.includes(name)) {
                                    setCompareNames([...compareNames, name]);
                                }
                                e.target.value = ""; // reset select
                            }}
                        >
                            <option value="">Select rower</option>
                            {data
                                .map(r => r.name)
                                .filter(n => n !== hoveredName && !compareNames.includes(n))
                                .map(n => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                        </select>

                        {/* Selected names displayed as chips */}
                        <div className="selected-names">
                            {compareNames.map(n => (
                                <div key={n} className="chip">
                                    {n}
                                    <button
                                        className="remove-chip"
                                        onClick={() => setCompareNames(compareNames.filter(c => c !== n))}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chart */}
                    {activeTab === "sessions" ? (
                        (() => {
                            const baseHistory = getDistanceHistory(hoveredName, timeScale);
                            const compareHistories = compareNames.map(name => ({
                                name,
                                ...getDistanceHistory(name,timeScale)
                            }));

                            const allDates = [...new Set([
                                ...baseHistory.dates,
                                ...compareHistories.flatMap(h => h.dates),
                            ])].sort();

                            const datasets = [
                                {
                                    label: hoveredName,
                                    data: allDates.map(d => baseHistory.distances[baseHistory.dates.indexOf(d)] ?? null),
                                    borderColor: "#3b82f6",
                                    backgroundColor: "#60a5fa",
                                    spanGaps: true,
                                },
                                ...compareHistories.map((h, idx) => ({
                                    label: h.name,
                                    data: allDates.map(d => h.distances[h.dates.indexOf(d)] ?? null),
                                    borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
                                    spanGaps: true,
                                }))
                            ];

                            return (
                                <>
                                    <p>{graphText[timeScale]}</p>
                                <Line
                                    data={{ labels: allDates, datasets }}
                                    height={300}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: true,
                                        scales: {
                                            y: {
                                                ticks: { color: "white" },
                                                title: { display: true, text: "Distance (m)", color: "white" },
                                            },
                                            x: { ticks: { color: "white" } },
                                        },
                                    }}
                                />
                                </>
                            );
                        })()
                    ) : (
                        <Line
                            data={{
                                labels: rankHistory.dates,
                                datasets: [
                                    {
                                        label: "Rank",
                                        data: rankHistory.rankMap[hoveredName],
                                        borderColor: "#3b82f6",
                                        backgroundColor: "#60a5fa",
                                        spanGaps: true,
                                    },
                                ],
                            }}
                            height={"300%"}
                            options={{
                                responsive: true,
                                maintainAspectRatio: true,
                                scales: {
                                    y: {
                                        min: 1,
                                        reverse: true,
                                        ticks: { stepSize: 1, precision: 0 ,color:"white" },
                                        grace: "20%",
                                    },
                                    x: { ticks: { color:"white" } }
                                },
                            }}
                        />
                    )}
                </div>
            </div>
        )}
    </div>
  );
}
