import React, { useEffect, useState } from "react";
import "./SubmissionTable.css";
import "./LeadboardModal.css"; // import modal styles
import { formatDate, listenToUnApprovedSessions } from "./Util";
import { approveSession, rejectSession } from "./firebase";
import { ToastContainer, toast } from "react-toastify";

export default function ExerciseTable() {
    const [data, setData] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);

    useEffect(() => {
        const unsubscribe = listenToUnApprovedSessions((sessions) => {
            setData(sessions);
        });

        return () => unsubscribe(); // clean up listener on unmount
    }, []);

    const handleApprove = async (entry) => {
        console.log(entry)
        if(!entry.date || entry.date === '') {
            entry.date = fromInputDate(`${new Date().getFullYear()}-${(new Date().getMonth()+1)}-${String(new Date().getDate()).padStart(2,0)}`)
            console.log('Catch ran '+entry.date)
        }
        const success = await approveSession(entry);
        if (success) {
            setData((prev) =>
                prev.map((item) =>
                    item.id === entry.id ? { ...item, approved: true } : item
                )
            );
            closeModal();
        }
    };

    const handleReject = async (entry) => {
        const confirmed = window.confirm("Are you sure you want to unapprove this session?");
        if(!confirmed){
            return
        }
        const success = await rejectSession(entry);
        if (success) {
            setData((prev) => prev.filter((item) => item.id !== entry.id));
            closeModal();
        }
    };
    // Convert from "dd/mm/yyyy" → "yyyy-mm-dd" (for input display)
    const toInputDate = (dateStr) => {
        if (!dateStr) return "";
        const [dd, mm, yyyy] = dateStr.split("/");
        return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    };

    // Convert from "yyyy-mm-dd" → "dd/mm/yyyy" (for saving)
    const fromInputDate = (dateStr) => {
        if (!dateStr) return "";
        const [yyyy, mm, dd] = dateStr.split("-");
        return `${dd}/${mm}/${yyyy}`;
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
        setSelectedEntry((prev) => ({ ...prev, [field]: value }));
    };

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
                            <th>Notes</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(
                            (row) =>
                                !row.approved && (
                                    <tr key={row.id} onClick={() => openModal(row)}>
                                        <td>{row.name}</td>
                                        <td>{Number(row.distance).toLocaleString('en-US')}</td>
                                        <td>{row.weights ? "✔" : "✖"}</td>
                                        <td>{row.intense ? "✔" : "✖"}</td>
                                        <td>{row.type}</td>
                                        <td>{row.notes}</td>
                                        <td>{row.date}</td>
                                    </tr>
                                )
                        )}
                    </tbody>
                </table>

                {/* Modal */}
                {modalOpen && selectedEntry && (
                    <div className="modal-overlay" style={{height:'100%'}}>
                        <div className="modal-content">
                            {/* Close (X) button */}
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
                                            "Alex Gillick",
                                            "Andrew O'Connor",
                                            "Ben Brennan",
                                            "Devon Goldrick",
                                            "Gavin O'Dwyer",
                                            "John Giles",
                                            "Luke Keating",
                                            "Mark Connolly",
                                            "Matt Malone",
                                            "Odhran Hegarty",
                                            "Ryan Farrell",
                                            "Tommy Gillick",
                                        ].map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
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
                                        {[
                                            "Erg",
                                            "Water",
                                            "Bike",
                                            "Run",
                                            "Other"
                                        ].map((name) => (
                                            <option key={name} value={name}>
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="modal-field">
                                    <label className="modal-label">Distance (m)</label>
                                    <input
                                        type="number"
                                        className="modal-input"
                                        value={selectedEntry.distance}
                                        onChange={(e) =>
                                            handleModalChange("distance", Number(e.target.value))
                                        }
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
                                        value={toInputDate(selectedEntry.date)}
                                        onChange={(e) =>
                                            handleModalChange("date", fromInputDate(e.target.value))
                                        }
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
