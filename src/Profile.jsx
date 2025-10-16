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
import "./profile.css";
import CustomGraphTooltip from "./CustomGraphTooltip";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { database } from "./firebase"; // ✅ external Firebase config

export default function Profile({ user, sessions }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [hoveredText, setHoveredText] = useState("");
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [showTooltip, setShowTooltip] = useState(false);
    const [selectedType, setSelectedType] = useState("Erg");
    const [selectedMetric, setSelectedMetric] = useState("Split");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);

    const itemsPerPage = 5;

    if (!user) {
        return (
            <div className="profile-empty">
                <p>Please sign in to view your profile.</p>
            </div>
        );
    }

    // Filter only user's sessions
    const filteredArray = sessions.filter((entry) => entry.name === user.username);

    // Sort + paginate
    const sortedArray = [...filteredArray].sort(
        (a, b) => b.date.seconds - a.date.seconds
    );
    const totalPages = Math.ceil(sortedArray.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSessions = sortedArray.slice(startIndex, startIndex + itemsPerPage);

    // Format timestamp to readable date
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

    // --- Chart Data ---
    const chartData = useMemo(() => {
        return filteredArray
            .filter((entry) => {
                if (entry.type !== selectedType) return false;
                if (selectedMetric !== "Intensity" && entry.intense) return false;
                if (selectedMetric === "Intensity" && !entry.intense) return false;
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
                    case "Intensity":
                        if (entry.split) {
                            const [min, sec] = entry.split.split(":");
                            value = parseFloat(min) * 60 + parseFloat(sec);
                        }
                        break;
                    case "Distance":
                        value = parseFloat(entry.distance) || 0;
                        break;
                    default:
                        value = 0;
                }

                return { id: entry.id, date, formattedDate, value };
            })
            .filter((d) => d.value !== null)
            .filter((d) => {
                if (startDate && d.date < new Date(startDate)) return false;
                if (endDate && d.date > new Date(endDate)) return false;
                return true;
            })
            .sort((a, b) => a.date - b.date);
    }, [filteredArray, selectedType, selectedMetric, startDate, endDate]);

    // Format Y-axis labels
    const formatYAxisLabel = (val) => {
        if ((selectedMetric === "Split" || selectedMetric === "Intensity") && !isNaN(val)) {
            const min = Math.floor(val / 60);
            const sec = (val % 60).toFixed(1).padStart(4, "0");
            return `${min}:${sec}`;
        }
        return val;
    };

    // Hover Tooltip
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

    // Modal Logic
    const openModal = (entry) => {
        setSelectedEntry({ ...entry });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedEntry(null);
    };

    const handleModalChange = (field, value) => {
        setSelectedEntry((prev) => ({ ...prev, [field]: value }));
    };

    const formatDateForInput = (timestamp) => {
        if (timestamp?.seconds) {
            const date = new Date(timestamp.seconds * 1000);
            return date.toISOString().split("T")[0];
        }
        return "";
    };

    // Update Session
    const updateUserSession = async (entry) => {
        try {
            const ref = doc(database, "sessions", entry.id);
            await updateDoc(ref, {
                split: entry.split || "",
                notes: entry.notes || "",
                intense: !!entry.intense,
                date:
                    entry.date instanceof Date
                        ? entry.date
                        : new Date(entry.date.seconds * 1000),
            });
            return true;
        } catch (error) {
            console.error("Error updating session:", error);
            return false;
        }
    };

    // Delete Session
    const deleteUserSession = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this session? This action cannot be undone."
        );
        if (!confirmDelete) return false;

        try {
            const ref = doc(database, "sessions", id);
            await deleteDoc(ref);
            return true;
        } catch (error) {
            console.error("Error deleting session:", error);
            return false;
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-header">
                <h1 className="profile-title">Welcome, {user.username}</h1>
            </div>

            {/* --- Filters --- */}
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

                <div className="control-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="control-group">
                    <label>End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
            </div>

            {/* --- Chart --- */}
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
                                        display={selectedMetric}
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

            {/* --- Table --- */}
            {paginatedSessions.length === 0 ? (
                <p className="profile-empty">No sessions found.</p>
            ) : (
                <div className="profile-table-wrapper">
                    <table className="profile-table">
                        <thead>
                        <tr>
                            <th>Type</th>
                            <th>Distance</th>
                            <th>Date</th>
                            <th>Notes</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedSessions.map((entry) => (
                            <tr
                                key={entry.id}
                                onClick={() => openModal(entry)} // ✅ click to edit
                                className="clickable-row"
                            >
                                <td>{entry.type}</td>
                                <td>{entry.distance || "-"}</td>
                                <td>{formatDate(entry.date)}</td>
                                <td>{entry.notes || "-"}</td>
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

            {/* Hover Tooltip */}
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

            {/* --- Modal --- */}
            {modalOpen && selectedEntry && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Edit Session</h2>

                        <div className="modal-body">
                            <div className="modal-field">
                                <label>Split</label>
                                <input
                                    type="text"
                                    value={selectedEntry.split || ""}
                                    placeholder="mm:ss"
                                    onChange={(e) =>
                                        handleModalChange("split", e.target.value)
                                    }
                                />
                            </div>

                            <div className="modal-field">
                                <label>Notes</label>
                                <textarea
                                    value={selectedEntry.notes || ""}
                                    onChange={(e) =>
                                        handleModalChange("notes", e.target.value)
                                    }
                                />
                            </div>

                            <div className="modal-field">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={formatDateForInput(selectedEntry.date)}
                                    onChange={(e) =>
                                        handleModalChange("date", new Date(e.target.value))
                                    }
                                />
                            </div>

                            <div className="modal-field checkbox-field">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={selectedEntry.intense || false}
                                        onChange={(e) =>
                                            handleModalChange("intense", e.target.checked)
                                        }
                                    />
                                    Intense session
                                </label>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-button cancel" onClick={closeModal}>
                                Cancel
                            </button>
                            <button
                                className="modal-button submit"
                                onClick={async () => {
                                    const success = await deleteUserSession(selectedEntry.id);
                                    if (success) {
                                        closeModal();
                                        window.location.reload();
                                    }
                                }}
                            >
                                Delete
                            </button>
                            <button
                                className="modal-button submit"
                                onClick={async () => {
                                    const success = await updateUserSession(selectedEntry);
                                    if (success) {
                                        closeModal();
                                        window.location.reload();
                                    }
                                }}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
