import React, { useState } from 'react';
import './modal.css';
import { rowerSession } from "./firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SessionModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        names: [],
        distance: '',
        weights: false,
        intense: false,
        notes: '',
        type: 'Erg',
        date: new Date(), // store as Date object
        split: ''
    });

    const names = [
        "Alex Gillick", "Andrew O'Connor", "Ben Brennan", "Devon Goldrick",
        "Gavin O'Dwyer", "Jack Darmody","John Giles", "Luke Keating", "Mark Connolly",
        "Matt Malone", "Odhran Hegarty", "Ryan Farrell", "Tommy Gillick"
    ];

    const [errors, setErrors] = useState({});
    const workoutTypes = ['Erg', 'Water', 'Bike', 'Run', 'Other'];

    const validate = () => {
        let newErrors = {};
        if (!formData.names.length) newErrors.names = 'At least one name is required';
        if (!formData.distance && !formData.weights) newErrors.distance = 'Distance is required';

        if (formData.weights) {
            setFormData(prev => ({ ...prev, distance: 0, type: 'Other' }));
        }

        setFormData(prev => ({ ...prev, distance: Number(prev.distance) }));
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        formData.names.forEach((name) => {
            const sessionData = { ...formData, name }; // clone per rower
            rowerSession(sessionData);
        });

        toast.success("Sessions have been submitted for review", { toastId: "session-submit" });

        setFormData({
            names: [],
            distance: '',
            weights: false,
            intense: false,
            notes: '',
            type: 'Erg',
            date: new Date(), // reset to current date
            split: ''
        });

        onClose();
    };

    // Convert Date object to YYYY-MM-DD for <input type="date">
    const formatDateForInput = (date) => date.toISOString().split('T')[0];

    return (
        <>
            {isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">New Session</h2>
                        <div className="modal-body">
                            <div className="modal-field">
                                <label className="modal-label">Crew Members</label>
                                <div className="dropdown-container">
                                    <select
                                        className="modal-select"
                                        onChange={(e) => {
                                            const selected = e.target.value;
                                            if (selected && !formData.names.includes(selected)) {
                                                setFormData({ ...formData, names: [...formData.names, selected] });
                                            }
                                        }}
                                        value=""
                                    >
                                        <option value="">Add a rower</option>
                                        {names.map((n) => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>

                                <div className="selected-names">
                                    {formData.names.map((n) => (
                                        <span key={n} className="chip">
                                            {n}
                                            <button
                                                type="button"
                                                className="remove-chip"
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        names: formData.names.filter((name) => name !== n),
                                                    })
                                                }
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                {errors.names && <p className="modal-error">{errors.names}</p>}
                            </div>

                            {!formData.weights && (
                                <>
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

                                    <div className="modal-field">
                                        <label className="modal-label">Split</label>
                                        <input
                                            type="text"
                                            className="modal-input"
                                            value={formData.split}
                                            placeholder="Split mm:ss (Optional)"
                                            onChange={(e) => setFormData({ ...formData, split: e.target.value })}
                                        />
                                    </div>

                                    <div className="modal-field">
                                        <label className="modal-label">Type</label>
                                        <select
                                            className="modal-select"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            {workoutTypes.map(element => (
                                                <option key={element} value={element}>{element}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="modal-field checkbox-field">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.weights}
                                        onChange={(e) => setFormData({ ...formData, type: "Other", weights: e.target.checked })}
                                    />
                                    Weights session
                                </label>
                            </div>

                            <div className="modal-field checkbox-field">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.intense}
                                        onChange={(e) => setFormData({ ...formData, intense: e.target.checked })}
                                    />
                                    Intense session
                                </label>
                            </div>

                            <div className="modal-field">
                                <input
                                    className='modal-input'
                                    type="date"
                                    value={formatDateForInput(formData.date)}
                                    onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                                />
                                {errors.date && <p className="modal-error">{errors.date}</p>}
                            </div>

                            <div className="modal-field">
                                <label className="modal-label">Notes</label>
                                <textarea
                                    style={{ width: '100%', height: '100px' }}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    value={formData.notes}
                                />
                            </div>

                            <div className="modal-footer">
                                <button onClick={onClose} className="modal-button cancel">Cancel</button>
                                <button onClick={handleSubmit} className="modal-button submit">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
