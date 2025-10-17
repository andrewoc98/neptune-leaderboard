import React, { useState } from 'react';
import './modal.css';
import { rowerSession, addTagToFirebase } from "./firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SessionModal({ isOpen, onClose, users, tags }) {
    const [formData, setFormData] = useState({
        names: [],
        distance: '',
        weights: false,
        intense: false,
        notes: '',
        type: 'Erg',
        date: new Date(),
        split: '',
        tags: []
    });

    const [errors, setErrors] = useState({});
    const [tagInput, setTagInput] = useState('');
    const [filteredTags, setFilteredTags] = useState([]);

    const names = Object.keys(users).filter((key) => key !== "id");
    const workoutTypes = ['Erg', 'Water', 'Bike', 'Run', 'Other'];

    // ---- Validation ----
    const validate = () => {
        let newErrors = {};
        if (!formData.names.length) newErrors.names = 'At least one name is required';
        if (!formData.distance && !formData.weights) newErrors.distance = 'Distance is required';
        if (formData.weights) setFormData(prev => ({ ...prev, distance: 0, type: 'Other' }));
        setFormData(prev => ({ ...prev, distance: Number(prev.distance) }));
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ---- Submit ----
    const handleSubmit = () => {
        if (!validate()) return;

        formData.names.forEach((name) => {
            const sessionData = { ...formData, name };
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
            date: new Date(),
            split: '',
            tags: []
        });
        onClose();
    };

    // ---- Tags ----
    const handleTagChange = (e) => {
        const input = e.target.value.toLowerCase();
        setTagInput(input);
        if (input.trim().length > 0) {
            const filtered = tags.filter(
                (t) => t.toLowerCase().includes(input) && !formData.tags.includes(t)
            );
            setFilteredTags(filtered);
        } else {
            setFilteredTags([]);
        }
    };

    const handleAddTag = async (tag) => {
        const trimmed = tag.trim().toLowerCase(); // ✅ always lowercase
        if (!trimmed) return;

        const isNewTag = !tags.map(t => t.toLowerCase()).includes(trimmed);

        // ✅ Add to form
        if (!formData.tags.includes(trimmed)) {
            setFormData({ ...formData, tags: [...formData.tags, trimmed] });
        }

        // ✅ Save new tags to Firebase
        if (isNewTag) {
            await addTagToFirebase(trimmed);
            toast.info(`New tag "${trimmed}" added to Firebase`);
            tags.push(trimmed); // make immediately available locally
        }

        setTagInput('');
        setFilteredTags([]);
    };

    const handleRemoveTag = (tag) => {
        setFormData({
            ...formData,
            tags: formData.tags.filter((t) => t !== tag),
        });
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (tagInput) handleAddTag(tagInput);
        }
    };

    const formatDateForInput = (date) => date.toISOString().split('T')[0];

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="modal-title">New Session</h2>
                <div className="modal-body">

                    {/* Crew Members */}
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

                    {/* Distance / Split / Type */}
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
                                    {workoutTypes.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {/* Checkboxes */}
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

                    {/* Date */}
                    <div className="modal-field">
                        <input
                            className="modal-input"
                            type="date"
                            value={formatDateForInput(formData.date)}
                            onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
                        />
                    </div>

                    {/* ✅ Tags Section */}
                    <div className="modal-field">
                        <label className="modal-label">Tags</label>
                        <div className="dropdown-container tag-input-wrapper">
                            <input
                                type="text"
                                className="modal-input"
                                value={tagInput}
                                onChange={handleTagChange}
                                onKeyDown={handleTagKeyDown}
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
                            {formData.tags.map((tag) => (
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

                    {/* Notes */}
                    <div className="modal-field">
                        <label className="modal-label">Notes</label>
                        <textarea
                            className="modal-textarea"
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            value={formData.notes}
                        />
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button onClick={onClose} className="modal-button cancel">Cancel</button>
                        <button onClick={handleSubmit} className="modal-button submit">Submit</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
