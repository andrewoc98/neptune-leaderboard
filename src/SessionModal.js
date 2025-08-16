import React, { useState } from 'react';
import './App.css';
import {rowerSession} from "./firebase";

export default function SessionModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        distance: '',
        weights: false,
        intense: false,
        notes:''
    });

    const names = ["Ali G", "Andrew", "Ben", "Devon", "Garrett", "Gavin", "John", "Luke", "Mark", "Matt", "Odhran", "Ryan", "Tommy"];
    const [errors, setErrors] = useState({});

    const validate = () => {
        let newErrors = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.distance) newErrors.distance = 'Distance is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        console.log(formData)
        rowerSession(formData)
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">New Session</h2>

                {/* Name Dropdown */}
                <div className="modal-field">
                    <label className="modal-label">Name</label>
                    <select
                        className="modal-select"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    >
                        <option value="">Select a name</option>
                        {names.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                    {errors.name && <p className="modal-error">{errors.name}</p>}
                </div>

                {/* Distance Input */}
                <div className="modal-field">
                    <label className="modal-label">Distance (m)</label>
                    <input
                        type="number"
                        className="modal-input"
                        value={formData.distance}
                        onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
                    />
                    {errors.distance && <p className="modal-error">{errors.distance}</p>}
                </div>

                {/* Checkboxes */}
                <div className="modal-field">
                    <input
                        type="checkbox"
                        className="modal-checkbox"
                        checked={formData.weights}
                        onChange={(e) => setFormData({ ...formData, weights: e.target.checked })}
                    />
                    <label>Weights session</label>
                </div>
                <div className="modal-field">
                    <input
                        type="checkbox"
                        className="modal-checkbox"
                        checked={formData.intense}
                        onChange={(e) => setFormData({ ...formData, intense: e.target.checked })}
                    />
                    <label>Intense session</label>
                </div>
                <div className="modal-field">
                    <label className="modal-label">Notes</label>
                    <textarea style={{width:'100%', height:'100px'}} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} ></textarea>
                </div>

                {/* Buttons */}
                <div className="modal-footer">
                    <button onClick={onClose} className="modal-button cancel">Cancel</button>
                    <button onClick={handleSubmit} className="modal-button submit">Submit</button>
                </div>
            </div>
        </div>
    );
}