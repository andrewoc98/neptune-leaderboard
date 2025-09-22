import React, { useState, useEffect } from "react";

function FilterModal({ isOpen, onClose, filters, onSubmit, onReset, users }) {
    const [localFilters, setLocalFilters] = useState(filters);

    const workoutTypes = ['Erg', 'Water', 'Bike', 'Run', 'Other'];

    useEffect(() => {
        if (isOpen) setLocalFilters(filters);
    }, [isOpen, filters]);

    if (!isOpen) return null;

    // Get names dynamically from the users object
    const nameOptions = Object.keys(users).filter((key) => key !== "id");

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 className="modal-title">Filter Options</h3>

                <div className="modal-body">
                    {/* --- Name Dropdown --- */}
                    <div className="modal-field">
                        <label className="modal-label">Name</label>
                        <select
                            className="modal-select"
                            value={localFilters.name}
                            onChange={(e) =>
                                setLocalFilters({ ...localFilters, name: e.target.value })
                            }
                        >
                            <option value="">All</option>
                            {nameOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* --- Workout Type Dropdown --- */}
                    <div className="modal-field">
                        <label className="modal-label">Workout Type</label>
                        <select
                            className="modal-select"
                            value={localFilters.type}
                            onChange={(e) =>
                                setLocalFilters({ ...localFilters, type: e.target.value })
                            }
                        >
                            <option value="">All</option>
                            {workoutTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* --- Sort By --- */}
                    <div className="modal-field">
                        <label className="modal-label">Sort By</label>
                        <select
                            className="modal-select"
                            value={localFilters.sortBy}
                            onChange={(e) =>
                                setLocalFilters({ ...localFilters, sortBy: e.target.value })
                            }
                        >
                            <option value="">None</option>
                            <option value="distance">Distance</option>
                            <option value="date">Date</option>
                        </select>
                    </div>

                    {/* --- Sort Order --- */}
                    <div className="modal-field">
                        <label className="modal-label">Order</label>
                        <select
                            className="modal-select"
                            value={localFilters.order}
                            onChange={(e) =>
                                setLocalFilters({ ...localFilters, order: e.target.value })
                            }
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>

                    {/* --- Intense Checkbox --- */}
                    <div className="modal-field">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="modal-checkbox"
                                checked={localFilters.intense === true}
                                onChange={(e) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        intense: e.target.checked ? true : "",
                                    })
                                }
                            />
                            Intense only
                        </label>
                    </div>

                    {/* --- Weights Checkbox --- */}
                    <div className="modal-field">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                className="modal-checkbox"
                                checked={localFilters.weights === true}
                                onChange={(e) =>
                                    setLocalFilters({
                                        ...localFilters,
                                        weights: e.target.checked ? true : "",
                                    })
                                }
                            />
                            Weights only
                        </label>
                    </div>
                </div>

                {/* --- Footer --- */}
                <div className="modal-footer">
                    <button className="modal-button cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="modal-button submit"
                        onClick={() => {
                            onSubmit(localFilters);
                            onClose();
                        }}
                    >
                        Submit
                    </button>
                    <button
                        className="modal-button cancel"
                        onClick={() => {
                            onReset();
                            onClose();
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FilterModal;
