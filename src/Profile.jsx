import React, { useState, useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import "./Profile.css";
import CustomGraphTooltip from "./CustomGraphTooltip";

export default function Profile({ user, sessions }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [hoveredText, setHoveredText] = useState("");
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [showTooltip, setShowTooltip] = useState(false);
    const [selectedType, setSelectedType] = useState("Erg");
    const [selectedMetric, setSelectedMetric] = useState("Split");
    const itemsPerPage = 5;

    if (!user) {
        return (
            <div className="profile-empty">
                <p>Please sign in to view your profile.</p>
            </div>
        );
    }

    // Filter only sessions for current user
    const filteredArray = sessions.filter((entry) => entry.name === user.username);

    // Sort + paginate
    const sortedArray = [...filteredArray].sort(
        (a, b) => b.date.seconds - a.date.seconds
    );
    const totalPages = Math.ceil(sortedArray.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSessions = sortedArray.slice(startIndex, startIndex + itemsPerPage);

    const formatDate = (timestamp) => {
        if (!timestamp?.seconds) return "N/A";
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // --- 🔥 Chart Data Preparation ---
    const chartData = useMemo(() => {
        return filteredArray
            .filter((entry) => {
                // Always respect selected type
                if (entry.type !== selectedType) return false;

                // Only show intense sessions if metric is "Intensity"
                if (selectedMetric !== "Intensity" && entry.intense) return false;

                // Only show non-intense when metric is not "Intensity"
                if (selectedMetric === "Intensity" && !entry.intense) return false;

                // For "Split", skip entries with no split
                if (selectedMetric === "Split" && !entry.split) return false;

                return true;
            })
            .map((entry) => {
                const date = new Date(entry.date.seconds * 1000);
                const formattedDate = date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                });

                let value = null;

                switch (selectedMetric) {
                    case "Split":
                        if (entry.split) {
                            const [min, sec] = entry.split.split(":");
                            value = parseFloat(min) * 60 + parseFloat(sec);
                        }
                        break;

                    case "Intensity":
                        // 👇 Show split value for intense sessions
                        if (entry.split) {
                            const [min, sec] = entry.split.split(":");
                            value = parseFloat(min) * 60 + parseFloat(sec);
                        }
                        break;

                    case "Distance":
                        value = parseFloat(entry.distance) || 0;
                        break;

                    case "Approved":
                        value = entry.approved ? 1 : 0;
                        break;

                    case "Weights":
                        value = entry.weights ? 1 : 0;
                        break;

                    default:
                        value = 0;
                }

                return { id: entry.id, date, formattedDate, value };
            })
            .filter((d) => d.value !== null)
            .sort((a, b) => a.date - b.date);
    }, [filteredArray, selectedType, selectedMetric]);

    // --- Format Y-axis label ---
    const formatYAxisLabel = (val) => {
        if ((selectedMetric === "Split" || selectedMetric === "Intensity") && !isNaN(val)) {
            const min = Math.floor(val / 60);
            const sec = (val % 60).toFixed(1).padStart(4, "0");
            return `${min}:${sec}`;
        }
        return val;
    };

    // --- Tooltip handlers for table ---
    const handleMouseEnter = (e, text) => {
        const rect = e.target.getBoundingClientRect();
        setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
        setHoveredText(text);
        setShowTooltip(true);
    };
    const handleMouseLeave = () => {
        setShowTooltip(false);
        setHoveredText("");
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1 className="profile-title">Welcome, {user.username}</h1>
            </div>

            {/* --- Filter Controls --- */}
            <div className="profile-controls">
                <div className="control-group">
                    <label>Session Type</label>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="Erg">Erg</option>
                        <option value="Run">Run</option>
                        <option value="Bike">Bike</option>
                        <option value="Water">Water</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className="control-group">
                    <label>Metric</label>
                    <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value)}
                    >
                        <option value="Split">Split</option>
                        <option value="Distance">Distance</option>
                        <option value="Intensity">Intensity</option>
                    </select>
                </div>
            </div>

            {/* --- Chart Section --- */}
            {chartData.length > 0 ? (
                <div className="profile-card">
                    <h2 className="profile-section-title">
                        {selectedType} – {selectedMetric} over Time
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="formattedDate" />
                            <YAxis
                                domain={["auto", "auto"]}
                                tickFormatter={formatYAxisLabel}
                                width={70}
                                reversed={["Split", "Intensity"].includes(selectedMetric)}
                            />
                            <Tooltip
                                content={
                                    <CustomGraphTooltip
                                        formatSplitLabel={formatYAxisLabel}
                                    />
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#4ade80"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <p className="profile-empty">No data for this selection.</p>
            )}

            {/* --- Table Section (unchanged) --- */}
            {paginatedSessions.length === 0 ? (
                <p className="profile-empty">No sessions found.</p>
            ) : (
                <div className="profile-table-wrapper">
                    <table className="profile-table">
                        <thead>
                        <tr>
                            <th>Type</th>
                            <th>Notes</th>
                            <th>Date</th>
                            <th>Distance</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedSessions.map((entry) => (
                            <tr key={entry.id}>
                                <td
                                    onMouseEnter={(e) => handleMouseEnter(e, entry.type)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {entry.type}
                                </td>
                                <td
                                    onMouseEnter={(e) =>
                                        handleMouseEnter(e, entry.notes || "-")
                                    }
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {entry.notes || "-"}
                                </td>
                                <td
                                    onMouseEnter={(e) =>
                                        handleMouseEnter(e, formatDate(entry.date))
                                    }
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {formatDate(entry.date)}
                                </td>
                                <td
                                    onMouseEnter={(e) =>
                                        handleMouseEnter(e, entry.distance || "-")
                                    }
                                    onMouseLeave={handleMouseLeave}
                                >
                                    {entry.distance || "-"}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className="profile-pagination">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Prev
                            </button>
                            <span>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() =>
                                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                                }
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Hover Tooltip for Table */}
            {showTooltip && (
                <div
                    className="profile-tooltip"
                    style={{
                        left: tooltipPosition.x,
                        top: tooltipPosition.y,
                    }}
                >
                    {hoveredText}
                </div>
            )}
        </div>
    );
}
