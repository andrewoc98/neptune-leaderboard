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
  const [diffHistory, setDiffHistory] = useState({ dates: [], diffMap: {} });
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
        const type = activeTab === "erg" ? "ergData" : "waterData";
        const key = activeTab === "erg" ? ergSortKey : waterSortKey;

        const { dates, diffMap } = getDiffsOverTime(leaderboard, type, key);
        setDiffHistory({ dates, diffMap });
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
        const change = getDistanceForLastPeriod(timeScale, sessions,multipliers)
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


    const getDiffsOverTime = (history, type, key) => {
        const nameSet = new Set();

        history.forEach(snapshot => {
            if (snapshot[type]) {
                snapshot[type].forEach(row => nameSet.add(row.name));
            }
        });

        const names = Array.from(nameSet);
        const dates = history.map(h => h.date);
        const diffMap = {};

        names.forEach(name => {
            diffMap[name] = history.map(snapshot => {
                const rows = snapshot[type];
                if (!rows) return null;

                const sorted = [...rows].sort((a, b) => {
                    const getValue = (row) => secondsFor(row, key) ?? Infinity;
                    return getValue(a) - getValue(b);
                });

                if (sorted.length === 0) return null;

                const leader = sorted[0];
                const row = sorted.find(r => r.name === name);
                if (!row) return null;

                const leaderSec = secondsFor(leader, key);
                const rowSec = secondsFor(row, key);
                if (leaderSec == null || rowSec == null) return null;

                return +(rowSec - leaderSec).toFixed(1); // numeric seconds difference
            });
        });

        return { dates, diffMap };
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

// helper: convert a row + key into seconds (or null if not available)
    const secondsFor = (row, key) => {
        if (!row) return null;

        // adjustedSplit is computed from split + weight using your util
        if (key === "adjustedSplit") {
            const adj = adjustedErgScore(row.split, row.weight); // should return "m:ss.s"
            return parseSplitTime(adj);
        }

        if (key === "split") {
            return parseSplitTime(row.split);
        }

        if (key === "time") {
            return parseTimeToSeconds(row.time);
        }

        // fallback: if the property is numeric, use it; if it's a time-like string try parse
        const val = row[key];
        if (typeof val === "number") return val;
        if (typeof val === "string") {
            if (val.includes(":")) return parseSplitTime(val);
            const n = parseFloat(val);
            return isNaN(n) ? null : n;
        }

        return null;
    };

// returns delta between the leader (currentList[0]) and the named rower
// e.g. "+1.6s" means that rower is 1.6s behind the leader
    const getDelta = (name, index, currentList, prevList, key) => {
        if (!currentList || currentList.length === 0) return "-";

        const leader = currentList[0];
        const row = currentList.find(r => r.name === name);
        if (!row) return "-";

        const leaderSec = secondsFor(leader, key);
        const rowSec = secondsFor(row, key);

        // invalid / missing data
        if (leaderSec == null || rowSec == null || !isFinite(leaderSec) || !isFinite(rowSec)) return "-";

        const diff = rowSec - leaderSec; // positive => behind leader
        // small tolerance to avoid showing tiny floating jitter
        if (Math.abs(diff) < 0.05) return "-";

        return `${diff > 0 ? "+" : "-"}${Math.abs(diff).toFixed(1)}s`;
    };


    const getDistanceHistory = (name, timescale = "season") => {
        const history = [];
        const now = new Date();

        let cutoff = null;
        if (timescale === "month") {
            cutoff = new Date(now);
            cutoff.setMonth(now.getMonth() - 1);
        } else if (timescale === "week") {
            cutoff = new Date(now);
            cutoff.setDate(now.getDate() - 7);
        } else if (timescale === "season") {
            cutoff = new Date(2025, 8, 1);
        }

        const daily = {};

        sessions.forEach(s => {
            if (s.name !== name || !s.date || s.distance == null) return;

            const d = s.date instanceof Date ? new Date(s.date) : parseDateString(s.date);
            if (!d || isNaN(d)) return; // skip invalid
            d.setHours(0, 0, 0, 0);

            if (cutoff && d < cutoff) return;

            const key = d.getTime();
            const multiplier = multipliers[s.type] || 1;
            daily[key] = (daily[key] || 0) + s.distance * multiplier;
        });

        let cumulative = 0;
        return Object.entries(daily)
            .sort(([a], [b]) => a - b)
            .map(([ts, dist]) => {
                cumulative += dist;
                return { date: new Date(Number(ts)), distance: cumulative };
            });
    };
    const getPrevDistanceHistory = (name, timescale = "season") => {
        if (timescale === "season") {
            return [];
        }

        const now = new Date();
        let start = null;
        let end = null;
        let offsetDays = 0;

        if (timescale === "month") {
            start = new Date(now);
            start.setDate(now.getDate() - 60);

            end = new Date(now);
            end.setDate(now.getDate() - 30);

            offsetDays = 30;
        } else if (timescale === "week") {
            start = new Date(now);
            start.setDate(now.getDate() - 14);

            end = new Date(now);
            end.setDate(now.getDate() - 7);

            offsetDays = 7;
        }

        const daily = {};

        sessions.forEach(s => {
            if (s.name !== name || !s.date || s.distance == null) return;

            const d = s.date instanceof Date ? new Date(s.date) : parseDateString(s.date);
            if (!d || isNaN(d)) return; // skip invalid
            d.setHours(0, 0, 0, 0);

            // filter by range
            if ((start && d < start) || (end && d > end)) return;

            const key = d.getTime();
            const multiplier = multipliers[s.type] || 1;
            daily[key] = (daily[key] || 0) + s.distance * multiplier;
        });

        let cumulative = 0;
        return Object.entries(daily)
            .sort(([a], [b]) => a - b)
            .map(([ts, dist]) => {
                cumulative += dist;

                const shiftedDate = new Date(Number(ts));
                shiftedDate.setDate(shiftedDate.getDate() + offsetDays);

                return { date: shiftedDate, distance: cumulative };
            });
    };



    const parseDateString = (input) => {
        if (!input) return null;

        // Already a JS Date
        if (input instanceof Date) return input;

        // Firestore Timestamp object
        if (typeof input === "object" && "seconds" in input) {
            return new Date(input.seconds * 1000 + Math.floor(input.nanoseconds / 1e6));
        }

        // String case ("September 4, 2025 at 12:00:00 AM UTC+1")
        if (typeof input === "string") {
            const cleaned = input.replace(" at", "");
            const normalized = cleaned.replace("UTC", "GMT"); // JS understands GMT offsets
            const d = new Date(normalized);
            return isNaN(d) ? null : d;
        }

        return null;
    };

    // compute average weekly mileage for an athlete
    const getAverageWeeklyMileage = (name) => {
        if (!sessions || sessions.length === 0) return 0;

        // filter to athlete’s sessions
        const athleteSessions = sessions.filter(s => s.name === name && s.distance != null);
        if (athleteSessions.length === 0) return 0;

        // parse all dates
        const dates = athleteSessions.map(s => parseDateString(s.date)).filter(Boolean);
        if (dates.length === 0) return 0;

        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        // reference start date = Sept 1, 2025
        const septFirst = new Date("2025-09-01T00:00:00Z");

        // pick whichever is later: Sept 1, 2025 OR first session
        const startDate = minDate > septFirst ? minDate : septFirst;

        // filter sessions so we only keep ones on/after startDate
        const validSessions = athleteSessions.filter(s => {
            const d = parseDateString(s.date);
            return d && d >= startDate;
        });

        if (validSessions.length === 0) return 0;

        // recompute max date from filtered sessions
        const filteredDates = validSessions.map(s => parseDateString(s.date));
        const filteredMaxDate = new Date(Math.max(...filteredDates));

        // compute weeks between startDate and last valid session
        const weeks = Math.max(1 / 7, (filteredMaxDate - startDate) / (1000 * 60 * 60 * 24 * 7));

        // sum distance (apply multipliers if needed)
        const totalDistance = validSessions.reduce((sum, s) => {
            const multiplier = multipliers[s.type] || 1;
            return sum + s.distance * multiplier;
        }, 0);

        return Math.round(totalDistance / weeks);
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
              <div className="table-legend">
  <span className="legend-item">
    <span className="legend-box overrate-row"></span> Over Rate Cap
  </span>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th onClick={() => handleErgSort("split")}
                      className={`sortable ${ergSortKey === "split" ? "sorted-column" : ""}`}>
                      Split /500m
                    </th>
                    <th onClick={() => handleErgSort("adjustedSplit")}
                      className={`sortable ${ergSortKey === "adjustedSplit" ? "sorted-column" : ""}`}>
                      Adj. Split /500m
                    </th>
                    <th>Diff</th>
                  </tr>
                </thead>
                <tbody>
                {sortedErg.map((rower, index) => (
                    <tr
                        key={rower.name}
                        onClick={() => handleMouseEnter(rower.name)}
                        className={rower.overRate ? "overrate-row" : ""}
                    >
                        <td>{index + 1}</td>
                        <td>{rower.name}</td>
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
                    <th>Diff</th>
                  </tr>
                </thead>
                <tbody>
                {sortedWater.map((rower, index) => (
                    <tr
                        key={rower.name}
                        onClick={() => handleMouseEnter(rower.name)}
                        className={`${selectedNames.includes(rower.name) ? "gold-row" : ""} ${rower.overRate ? "overrate-row" : ""}`}
                    >
                        <td>{index + 1}</td>
                        <td>{rower.name}</td>
                        <td>{rower.boatClass}</td>
                        <td>{rower.time}</td>
                        <td>
                            {goldMedalPercentage(rower.time, rower.boatClass, rower.distance, gmpSpeeds).toFixed(2)}%
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
                                {timeScale === "season" ? (
                                    getRankIcon(totalDistance)
                                ) : (() => {
                                    if (!changePerRower || !(rower.name in changePerRower)) return "-";

                                    const change = Number(changePerRower[rower.name] || 0);

                                    return (
                                        <>
                                            {Math.abs(change).toLocaleString("en-US")}{" "}
                                            {change > 0 ? "▲" : "▼"}
                                        </>
                                    );
                                })()}
                            </td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>
          </div>
        </div>
      )}
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

                    {/* Athlete Info */}
                    <div className="profile-section">
                        <h3 className="section-title">Athlete Info</h3>
                        <div className="info-grid">
                            <div><b>Sculling Points:</b> {users[hoveredName].scull}</div>
                            <div><b>Sweep Points:</b> {users[hoveredName].sweep.points}</div>
                            <div><b>Sweep Side:</b> {users[hoveredName].sweep.side}</div>
                            <div><b>Champs Eligible:</b> {users[hoveredName].champs ? "Yes" : "No"}</div>
                            <div><b>Avg Weekly Mileage:</b> {getAverageWeeklyMileage(hoveredName).toLocaleString()} m</div>
                        </div>
                    </div>

                    {/* Compare Section */}
                    <div className="profile-section">
                        <h3 className="section-title">Compare With</h3>
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

                    {/* Chart Section */}
                    <div className="profile-section">
                        <h3 className="section-title">Performance</h3>
                        {activeTab === "sessions" ? (
                            (() => {
                                const baseHistory = getDistanceHistory(hoveredName, timeScale);
                                const prevHistory =
                                    timeScale === "season" || compareNames.length > 0
                                        ? []
                                        : getPrevDistanceHistory(hoveredName, timeScale);

                                const compareHistories = compareNames.map(n => ({
                                    name: n,
                                    history: getDistanceHistory(n, timeScale),
                                }));

                                const allDates = [
                                    ...baseHistory.map(p => p.date.getTime()),
                                    ...prevHistory.map(p => p.date.getTime()),
                                    ...compareHistories.flatMap(h =>
                                        h.history.map(p => p.date.getTime())
                                    ),
                                ];
                                const sortedDates = Array.from(new Set(allDates)).sort((a, b) => a - b);

                                const seriesFor = (history) =>
                                    sortedDates.map(ts => {
                                        const point = history.find(p => p.date.getTime() === ts);
                                        return point ? point.distance : null;
                                    });

                                const displayDates = sortedDates.map(ts => {
                                    const d = new Date(ts);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                });

                                const datasets = [
                                    {
                                        label: hoveredName,
                                        data: seriesFor(baseHistory),
                                        borderColor: "#3b82f6",
                                        backgroundColor: "#60a5fa",
                                        spanGaps: true,
                                    },
                                    ...(prevHistory.length > 0
                                        ? [{
                                            label: hoveredName + " (prev)",
                                            data: seriesFor(prevHistory),
                                            borderColor: "#3b82f6",
                                            borderDash: [6, 6],
                                            fill: false,
                                            spanGaps: true,
                                        }]
                                        : []),
                                    ...compareHistories.map((h, i) => ({
                                        label: h.name,
                                        data: seriesFor(h.history),
                                        borderColor: `hsl(${i * 60}, 70%, 50%)`,
                                        spanGaps: true,
                                    })),
                                ];

                                return (
                                    <>
                                        <p>{graphText[timeScale]}</p>
                                        <Line
                                            data={{ labels: displayDates, datasets }}
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
                                                plugins: {
                                                    tooltip: {
                                                        filter: (tooltipItem) =>
                                                            !tooltipItem.dataset.label.includes("(prev)"),
                                                    },
                                                },
                                            }}
                                        />
                                    </>
                                );
                            })()
                        ) : (
                            <Line
                                data={{
                                    labels: diffHistory.dates,
                                    datasets: [
                                        {
                                            label: hoveredName,
                                            data: diffHistory.diffMap[hoveredName],
                                            borderColor: "#3b82f6",
                                            backgroundColor: "#60a5fa",
                                            spanGaps: true,
                                        },
                                        ...compareNames.map((name, idx) => ({
                                            label: name,
                                            data: diffHistory.diffMap[name],
                                            borderColor: `hsl(${(idx * 60) % 360}, 70%, 50%)`,
                                            spanGaps: true,
                                        })),
                                    ],
                                }}
                                height={300}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: true,
                                    scales: {
                                        y: {
                                            reverse: true,
                                            title: { display: true, text: "Gap to Leader (s)", color: "white" },
                                            ticks: { color: "white" },
                                        },
                                        x: { ticks: { color: "white" } },
                                    },
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        )}

    </div>
  );
}
