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
import { database, addTagToFirebase } from "./firebase";

export default function Profile({ user, sessions: initialSessions, tags }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedType, setSelectedType] = useState("Erg");
    const [selectedMetric, setSelectedMetric] = useState("Split");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedTagFilter, setSelectedTagFilter] = useState("");
    const [sessions, setSessions] = useState(initialSessions);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [tagInput, setTagInput] = useState("");
    const [filteredTags, setFilteredTags] = useState([]);

    const itemsPerPage = 5;

    if (!user) {
        return (
            <div className="profile-empty">
                <p>Please sign in to view your profile.</p>
            </div>
        );
    }

    // Filter user's sessions
    const filteredArray = sessions.filter(
        (entry) =>
            entry.name === user.username &&
            (selectedTagFilter ? entry.tags?.includes(selectedTagFilter) : true)
    );

    // Sort + paginate
    const sortedArray = [...filteredArray].sort(
        (a, b) => b.date.seconds - a.date.seconds
    );
    const totalPages = Math.ceil(sortedArray.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSessions = sortedArray.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    // Format timestamp
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

    // Chart Data
    const chartData = useMemo(() => {
        return filteredArray
            .filter((entry) => {
                if (entry.type !== selectedType) return false;
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

    const formatYAxisLabel = (val) => {
        if (selectedMetric === "Split" && !isNaN(val)) {
            const min = Math.floor(val / 60);
            const sec = (val % 60).toFixed(1).padStart(4, "0");
            return `${min}:${sec}`;
        }
        return val;
    };

    // Modal
    const openModal = (entry) => {
        setSelectedEntry({ ...entry });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedEntry(null);
    };

    const handleModalChange = (field, value) => {
        setSelectedEntry((prev) => {
            const updated = { ...prev, [field]: value };

            // ✅ Update session in table live for tags and other fields
            if (field === "tags") {
                setSessions((prevSessions) =>
                    prevSessions.map((s) => (s.id === updated.id ? updated : s))
                );
            }

            return updated;
        });
    };

    const formatDateForInput = (timestamp) => {
        if (timestamp?.seconds) {
            const date = new Date(timestamp.seconds * 1000);
            return date.toISOString().split("T")[0];
        } else if (timestamp instanceof Date) {
            return timestamp.toISOString().split("T")[0];
        }
        return "";
    };

    // Tag handlers
    const handleTagChange = (e) => {
        const input = e.target.value.toLowerCase();
        setTagInput(input);
        if (input.trim().length > 0) {
            const filtered = tags.filter(
                (t) => t.toLowerCase().includes(input) && !selectedEntry.tags?.includes(t)
            );
            setFilteredTags(filtered);
        } else {
            setFilteredTags([]);
        }
    };

    const handleAddTag = async (tag) => {
        const trimmed = tag.trim().toLowerCase();
        if (!trimmed) return;

        const isNew = !tags.map((t) => t.toLowerCase()).includes(trimmed);
        const updatedTags = [...(selectedEntry.tags || []), trimmed];

        // Update modal and table immediately
        handleModalChange("tags", updatedTags);

        setTagInput("");
        setFilteredTags([]);

        if (isNew) await addTagToFirebase(trimmed);
    };

    const handleRemoveTag = (tag) => {
        const updatedTags = selectedEntry.tags.filter((t) => t !== tag);

        // Update modal and table immediately
        handleModalChange("tags", updatedTags);
    };

    // Update / Delete with local state update
    const updateUserSession = async (entry) => {
        try {
            const ref = doc(database, "sessionHistory", entry.id);
            await updateDoc(ref, {
                split: entry.split || "",
                notes: entry.notes || "",
                intense: !!entry.intense,
                tags: entry.tags || [],
                date: entry.date instanceof Date ? entry.date : new Date(entry.date.seconds * 1000),
            });

            setSessions((prev) =>
                prev.map((s) => (s.id === entry.id ? { ...s, ...entry } : s))
            );
            return true;
        } catch (error) {
            console.error("Error updating session:", error);
            return false;
        }
    };

    const deleteUserSession = async (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this session?"
        );
        if (!confirmDelete) return false;

        try {
            const ref = doc(database, "sessionHistory", id);
            await deleteDoc(ref);
            setSessions((prev) => prev.filter((s) => s.id !== id));
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

            {/* Filters */}
            <div className="profile-controls">
                <div className="control-group">
                    <label>Type</label>
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
                    </select>
                </div>

                <div className="control-group">
                    <label>Tag</label>
                    <select
                        value={selectedTagFilter}
                        onChange={(e) => setSelectedTagFilter(e.target.value)}
                    >
                        <option value="">All Tags</option>
                        {tags.map((t) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
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

            {/* Chart */}
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
                                reversed={["Split"].includes(selectedMetric)}
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

            {/* Table */}
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
                            <th>Tags</th>
                            <th>Notes</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedSessions.map((entry) => (
                            <tr
                                key={entry.id}
                                onClick={() => openModal(entry)}
                                className="clickable-row"
                            >
                                <td>{entry.type}</td>
                                <td>{entry.distance || "-"}</td>
                                <td>{formatDate(entry.date)}</td>
                                <td>{entry.tags?.join(", ") || "-"}</td>
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

            {/* Modal */}
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
                                    onChange={(e) => handleModalChange("split", e.target.value)}
                                />
                            </div>

                            <div className="modal-field">
                                <label>Notes</label>
                                <textarea
                                    value={selectedEntry.notes || ""}
                                    onChange={(e) => handleModalChange("notes", e.target.value)}
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

                            {/* Tags */}
                            <div className="modal-field">
                                <label>Tags</label>
                                <div className="dropdown-container tag-input-wrapper">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={handleTagChange}
                                        onKeyDown={(e) => {
                                            const key = e.key?.toLowerCase();
                                            if (key === "enter" || key === "return" || key === "go") {
                                                handleAddTag(tagInput);
                                            }}}
                                        placeholder="Search or add a tag"
                                    />
                                    {filteredTags.length > 0 && (
                                        <ul className="tag-suggestions">
                                            {filteredTags.map((t) => (
                                                <li key={t} onClick={() => handleAddTag(t)}>
                                                    {t}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div className="selected-names">
                                    {(selectedEntry.tags || []).map((tag) => (
                                        <span key={tag} className="chip">
                      {tag}
                                            <button
                                                type="button"
                                                className="remove-chip"
                                                onClick={() => handleRemoveTag(tag)}
                                            >
                        ×
                      </button>
                    </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-button cancel" onClick={closeModal}>
                                Cancel
                            </button>
                            <button
                                className="modal-button cancel"
                                onClick={async () => {
                                    const success = await deleteUserSession(selectedEntry.id);
                                    if (success) closeModal();
                                }}
                            >
                                Delete
                            </button>
                            <button
                                className="modal-button submit"
                                onClick={async () => {
                                    const success = await updateUserSession(selectedEntry);
                                    if (success) closeModal();
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
