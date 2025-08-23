import { useState } from "react";
import "./LeadboardModal.css"
import { saveLeaderBoardtoDB } from "./firebase";
import { formatDate } from "./Util";
import {Kayak} from 'lucide-react'
import { ToastContainer, toast } from "react-toastify";

export default function WaterLeaderBoardModal() {
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState([{ name: "", boatClass: "", time: "", distance: "" }]);
    const [date, setDate] = useState()
    const [errors, setErrors] = useState([]);

    const handleRowChange = (index, field, value) => {
        const updated = [...rows];
        updated[index][field] = value;
        setRows(updated);
    };

    const addRow = () => {
        setRows([...rows, { name: "", boatClass: "", time: "", distance: "" }]);
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
            if (!row.boatClass) {
                msg.boatClass = "Boat class is required.";
            }
            if (!row.time.match(/^\d+:\d{2}(\.\d)?$/)) {
                msg.time = "Time must be in format mm:ss.s";
            }
            if (!row.distance || Number(row.distance) <= 0) {
                msg.distance = "Distance must be a positive number.";
            }
            return msg;
        });
        setErrors(newErrors);
        return newErrors.every(err => Object.keys(err).length === 0);
    };

    const handleSubmit = () => {
        if (!validate() || !date) {
            return; // stop submission if errors exist
        }
        saveLeaderBoardtoDB({ date: date, waterData: rows }) // Replace with DB post
        setOpen(false);
        setRows([{ name: "", boatClass: "", time: "", distance: "" }])
        setErrors([])
        toast.success("Leaderboard Uploaded");
    };

    return (
        <>
            <button className="btn" onClick={() => setOpen(true)}><Kayak/></button>
            {open && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Water Leaderboard</h2>
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
                                            <option value="John Giles">John Giles</option>
                                            <option value="Luke Keating">Luke Keating</option>
                                            <option value="Mark Connolly">Mark Connolly</option>
                                            <option value="Matt Malone">Matt Malone</option>
                                            <option value="Odhran Hegarty">Odhran Hegarty</option>
                                            <option value="Ryan Farrell">Ryan Farrell</option>
                                            <option value="Tommy Gillick">Tommy Gillick</option>
                                        </select>
                                        {errors[index]?.name && <p className="error">{errors[index].name}</p>}
                                    </div>

                                    <div className="field">
                                        <label>Boat Class</label>
                                        <select
                                            value={row.boatClass}
                                            onChange={(e) => handleRowChange(index, "boatClass", e.target.value)}
                                        >
                                            <option value="">Select boat class</option>
                                            <option value="1x">1x</option>
                                            <option value="2x">2x</option>
                                            <option value="4x-">4x-</option>
                                            <option value="4x+">4x+</option>
                                            <option value="2-">2-</option>
                                            <option value="4-">4-</option>
                                            <option value="4+">4+</option>
                                            <option value="8+">8+</option>
                                        </select>
                                        {errors[index]?.boatClass && <p className="error">{errors[index].boatClass}</p>}
                                    </div>

                                    <div className="field">
                                        <label>Time</label>
                                        <input
                                            type="text"
                                            value={row.time}
                                            onChange={(e) => handleRowChange(index, "time", e.target.value)}
                                            placeholder="mm:ss.s"
                                        />
                                        {errors[index]?.time && <p className="error">{errors[index].time}</p>}
                                    </div>

                                    <div className="field">
                                        <label>Distance</label>
                                        <input
                                            type="number"
                                            value={row.distance}
                                            onChange={(e) => handleRowChange(index, "distance", e.target.value)}
                                            placeholder="Distance (m)"
                                        />
                                        {errors[index]?.distance && <p className="error">{errors[index].distance}</p>}
                                    </div>

                                    <div className="row-actions">
                                        <button className="btn btn-danger" onClick={() => removeRow(index)}>Remove</button>
                                    </div>
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
            <ToastContainer position="top-right" autoClose={3000} />
        </>
    );
}
