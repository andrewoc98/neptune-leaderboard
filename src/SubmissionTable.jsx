import React, { useEffect, useState } from "react";
import "./SubmissionTable.css";
import "./LeadboardModal.css";
import { listenToUnApprovedSessions, approveSession, rejectSession } from "./firebase";

export default function ExerciseTable() {
    const [data, setData] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);

    useEffect(() => {
        const unsubscribe = listenToUnApprovedSessions((sessions) => {
            console.log(sessions);

            const converted = sessions.map(s => {
                let dateVal;

                if (s.date instanceof Date) {
                    dateVal = s.date;

                } else if (s.date?.toDate) {
                    dateVal = s.date.toDate(); // Firestore Timestamp

                } else if (typeof s.date === "string") {
                    // Handle dd/mm/yyyy strings
                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(s.date)) {
                        const [day, month, year] = s.date.split("/").map(Number);
                        dateVal = new Date(year, month - 1, day);
                    } else {
                        // Fallback: try to parse as ISO or other standard
                        dateVal = new Date(s.date);
                    }

                } else {
                    dateVal = new Date(); // fallback
                }

                return {
                    ...s,
                    date: dateVal
                };
            });

            setData(converted);
        });

        return () => unsubscribe();
    }, []);


    const handleApprove = async (entry) => {
        if (!entry.date || !(entry.date instanceof Date)) {
            entry.date = new Date(); // default to now
        }
        const success = await approveSession(entry);
        if (success) {
            setData(prev =>
                prev.map(item => item.id === entry.id ? { ...item, approved: true } : item)
            );
            closeModal();
        }
    };

    const handleReject = async (entry) => {
        const confirmed = window.confirm("Are you sure you want to unapprove this session?");
        if (!confirmed) return;

        const success = await rejectSession(entry);
        if (success) {
            setData(prev => prev.filter(item => item.id !== entry.id));
            closeModal();
        }
    };

    const openModal = (entry) => {
        setSelectedEntry({ ...entry });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedEntry(null);
    };

    const handleModalChange = (field, value) => {
        setSelectedEntry(prev => ({ ...prev, [field]: value }));
    };

    // Convert Date object to YYYY-MM-DD for input
    const formatDateForInput = (date) => date.toISOString().split("T")[0];

    return (
        <>
            <div className="table-container">
                <table className="exercise-table">
                    <thead>
                    <tr>
                        <th>Name</th>
                        <th>Distance(m)</th>
                        <th>Weights</th>
                        <th>Intense</th>
                        <th>Type</th>
                        <th>Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map(row =>
                            !row.approved && (
                                <tr key={row.id} onClick={() => openModal(row)}>
                                    <td>{row.name}</td>
                                    <td>{Number(row.distance).toLocaleString('en-US')}</td>
                                    <td>{row.weights ? "✔" : "✖"}</td>
                                    <td>{row.intense ? "✔" : "✖"}</td>
                                    <td>{row.type}</td>
                                    <td>{row.date.toLocaleDateString("en-GB")}</td>
                                </tr>
                            )
                    )}
                    </tbody>
                </table>

                {modalOpen && selectedEntry && (
                    <div className="modal-overlay" style={{ height: '100%' }}>
                        <div className="modal-content">
                            <button
                                onClick={closeModal}
                                style={{
                                    position: "absolute",
                                    top: "1rem",
                                    right: "1rem",
                                    background: "transparent",
                                    border: "none",
                                    fontSize: "1.5rem",
                                    color: "#f8f9fa",
                                    cursor: "pointer",
                                }}
                            >
                                ×
                            </button>

                            <h2 className="modal-title">Edit Session</h2>

                            <div className="modal-body">
                                <div className="modal-field">
                                    <label className="modal-label">Name</label>
                                    <select
                                        className="modal-select"
                                        value={selectedEntry.name}
                                        onChange={(e) => handleModalChange("name", e.target.value)}
                                    >
                                        {[
                                            "Alex Gillick","Andrew O'Connor","Ben Brennan","Devon Goldrick",
                                            "Gavin O'Dwyer","John Giles","Jack Darmody","Luke Keating",
                                            "Mark Connolly","Matt Malone","Odhran Hegarty","Ryan Farrell",
                                            "Tommy Gillick",
                                        ].map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="modal-field">
                                    <label className="modal-label">Type</label>
                                    <select
                                        className="modal-select"
                                        value={selectedEntry.type}
                                        onChange={(e) => handleModalChange("type", e.target.value)}
                                    >
                                        {["Erg","Water","Bike","Run","Other"].map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="modal-field">
                                    <label className="modal-label">Distance (m)</label>
                                    <input
                                        type="number"
                                        className="modal-input"
                                        value={selectedEntry.distance}
                                        onChange={(e) => handleModalChange("distance", Number(e.target.value))}
                                    />
                                </div>

                                <div className="modal-field">
                                    <label className="modal-label">Split</label>
                                    <input
                                        type="text"
                                        className="modal-input"
                                        value={selectedEntry.split}
                                        placeholder="Split mm:ss (Optional)"
                                        onChange={(e) => handleModalChange("split", e.target.value)}
                                    />
                                </div>

                                <div className="modal-field checkbox-field">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={selectedEntry.weights}
                                            onChange={(e) => handleModalChange("weights", e.target.checked)}
                                        />
                                        Weights
                                    </label>
                                </div>

                                <div className="modal-field checkbox-field">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={selectedEntry.intense}
                                            onChange={(e) => handleModalChange("intense", e.target.checked)}
                                        />
                                        Intense session
                                    </label>
                                </div>

                                <div className="modal-field">
                                    <label className="modal-label">Notes</label>
                                    <textarea
                                        className="modal-textarea"
                                        value={selectedEntry.notes}
                                        onChange={(e) => handleModalChange("notes", e.target.value)}
                                    />
                                </div>

                                <div className="modal-field">
                                    <label className="modal-label">Date</label>
                                    <input
                                        type="date"
                                        className="modal-input"
                                        value={formatDateForInput(selectedEntry.date)}
                                        onChange={(e) => handleModalChange("date", new Date(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="modal-button cancel"
                                    onClick={() => handleReject(selectedEntry)}
                                >
                                    Reject
                                </button>
                                <button
                                    className="modal-button submit"
                                    onClick={() => handleApprove(selectedEntry)}
                                >
                                    Approve
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
