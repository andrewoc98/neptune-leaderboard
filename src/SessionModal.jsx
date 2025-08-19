import React, { useState } from 'react';
import './modal.css';
import {rowerSession} from "./firebase";

export default function SessionModal({ isOpen, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: '',
        distance: '',
        weights: false,
        intense: false,
        notes:''
    });

    const names = ["Alex","Andrew","Ben","Devon", "Gav", "John", "Luke", "Mark","Matt", "Odhran","Ryan","Tommy"];
    const [errors, setErrors] = useState({});

    const validate = () => {
        let newErrors = {};
        if (!formData.name || formData === "" ) newErrors.name = 'Name is required';
        if (!formData.distance && !formData.weights) newErrors.distance = 'Distance is required';
        if(formData.weights){
            formData.distance = 0
        }
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
                {!formData.weights &&
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
}
                {/* Checkboxes */}
                <div className="modal-field checkbox-field">
                <label className="checkbox-label">
                    <input
                    type="checkbox"
                    checked={formData.weights}
                    onChange={(e) => setFormData({ ...formData, weights: e.target.checked })}
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
                    placeholder="Date dd/mm/yyyy"
                    onChange={(e) => setFormData({...formData, date: e.target.value.replaceAll('-','/')})}
                
                />
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