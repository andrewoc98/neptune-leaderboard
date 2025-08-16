import { useState } from "react";
import "./LeadboardModal.css"
import {saveLeaderBoardtoDB} from "./firebase";

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
            if(!row.weight){
                msg.weight = "Weight is required"
            }
            return msg;
        });
        setErrors(newErrors);
        return newErrors.every(err => Object.keys(err).length === 0);
    };

    const handleSubmit = () => {
        if (!validate()) {
            return; // stop if invalid
        }
        console.log(rows);
        saveLeaderBoardtoDB({date:date,waterData:rows}) // Replace with DB post
        setOpen(false);
        setRows([{ name: "", weight: "", split: "" }]);
        setErrors([])
    };

    return (
        <>
            <button className="btn" onClick={() => setOpen(true)}>Create Erg Score Leaderboard</button>
            {open && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Create Leaderboard</h2>
                        </div>

                        <div className="modal-body">
                            <input type={'date'} onChange={(e)=>setDate(e.target.value.replaceAll('-','/'))}/>
                            {rows.map((row, index) => (
                                <div key={index} className="row">
                                    <div className="field">
                                        <label>Name</label>
                                        <select
                                            value={row.name}
                                            onChange={(e) => handleRowChange(index, "name", e.target.value)}
                                        >
                                            <option value="">Select name</option>
                                            <option value="Andrew">Andrew</option>
                                            <option value="Matt">Matt</option>
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
