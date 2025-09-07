import { useState } from "react";
import "./LeadboardModal.css"
import { saveLeaderBoardtoDB } from "./firebase";
import { BicepsFlexed } from 'lucide-react'
import { ToastContainer, toast } from "react-toastify";
import { formatDate } from "./Util";

export default function LeaderboardModal() {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState([{ name: "", weight: "", split: "" }]);
    const [errors, setErrors] = useState([]);
    const [date, setDate] = useState("")

    const handleRowChange = (index, field, value) => {
        const updated = [...rows];
        updated[index][field] = value;
        setRows(updated);
    };

    const addRow = () => {
        setRows([...rows, { name: "", weight: "", split: "" }]);
    };

    const removeRow = (index) => {
        setRows(rows.filter((_, i) => i !== index));
    };

    const validate = () => {
        const newErrors = rows.map((row) => {
            let msg = {};
            if (!row.name) {
                msg.name = "Name is required.";
            }
            if (!row.split.match(/^\d+:\d{2}(\.\d)?$/)) {
                msg.split = "Split must be in format mm:ss.s";
            }
            if (!row.weight) {
                msg.weight = "Weight is required"
            }
            return msg;
        });
        setErrors(newErrors);
        return newErrors.every(err => Object.keys(err).length === 0);
    };

    const handleSubmit = () => {
        if (!validate() || !date) {
            return; // stop if invalid
        }
        console.log(rows);
        saveLeaderBoardtoDB({ date: date, ergData: rows }) // Replace with DB post
        setOpen(false);
        setRows([{ name: "", weight: "", split: "" }]);
        setErrors([])
        toast.success("Leaderboard Uploaded");
    };

    return (
        <>
            <button className="btn" onClick={() => setOpen(true)}><BicepsFlexed /></button>
            {open && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Erg Leaderboard</h2>
                        </div>

                        <div className="modal-body">
                            <input className="modal-input" type={'date'} onChange={(e) => setDate(formatDate(e.target.value.replaceAll('-', '/')))} />
                            {rows.map((row, index) => (
                                <div key={index} className="row">
                                    <div className="field">
                                        <label>Name</label>
                                        <select
                                            value={row.name}
                                            onChange={(e) => handleRowChange(index, "name", e.target.value)}
                                        >
                                            <option value="">Select name</option>
                                            <option value="Alex Gillick">Alex Gillick</option>
                                            <option value="Andrew O'Connor">Andrew O'Connor</option>
                                            <option value="Ben Brennan">Ben Brennan</option>
                                            <option value="Devon Goldrick">Devon Goldrick</option>
                                            <option value="Gavin O'Dwyer">Gavin O'Dwyer</option>
                                            <option value="Jack Darmody">Jack Darmody</option>
                                            <option value="John Giles">John Giles</option>
                                            <option value="Luke Keating">Luke Keating</option>
                                            <option value="Mark Connolly">Mark Connolly</option>
                                            <option value="Matt Malone">Matt Malone</option>
                                            <option value="Odhran Hegarty">Odhran Hegarty</option>
                                            <option value="Ryan Farrell">Ryan Farrell</option>
                                            <option value="Tommy Gillick">Tommy Gillick</option>
                                        </select>
                                        {errors[index]?.name && (
                                            <p className="error">{errors[index].name}</p>
                                        )}
                                    </div>

                                    <div className="field">
                                        <label>Weight</label>
                                        <input
                                            type="number"
                                            value={row.weight}
                                            onChange={(e) => handleRowChange(index, "weight", e.target.value)}
                                            placeholder="Weight"
                                        />
                                    </div>

                                    <div className="field">
                                        <label>Split</label>
                                        <input
                                            type="text"
                                            value={row.split}
                                            onChange={(e) => handleRowChange(index, "split", e.target.value)}
                                            placeholder="Split (mm:ss.s)"
                                        />
                                        {errors[index]?.split && (
                                            <p className="error">{errors[index].split}</p>
                                        )}
                                    </div>

                                    <button className="btn btn-danger" onClick={() => removeRow(index)}>Remove</button>
                                </div>
                            ))}

                            <button className="btn btn-outline" onClick={addRow}>+ Add Row</button>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-outline" onClick={() => setOpen(false)}>Cancel</button>
                            <button className="btn" onClick={handleSubmit}>Save Leaderboard</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
