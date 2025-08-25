import React, { useEffect, useState } from "react";
import { getMultipliers, updateMultipliers } from "./firebase";
import "./modal.css"; // import your CSS

const MultiplierModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [multipliers, setMultipliers] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            (async () => {
                setLoading(true);
                const data = await getMultipliers();
                setMultipliers(data);
                setLoading(false);
            })();
        }
    }, [isOpen]);

    const handleChange = (key, value) => {
        setMultipliers((prev) => ({
            ...prev,
            [key]: parseFloat(value) || 0,
        }));
    };

    const handleSubmit = async () => {
        await updateMultipliers(multipliers);
        setIsOpen(false);
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                className="btn"
                style={{fontWeight:"1000"
                }}
                onClick={() => setIsOpen(true)}
            >
                .0X
            </button>
            {isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Edit Multipliers</h2>
                        <div className="modal-body">
                            {loading ? (
                                <p>Loading...</p>
                            ) : (
                                Object.keys(multipliers).map((key) => (
                                    <div className="modal-field" key={key}>
                                        <label className="modal-label">{key}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="modal-input"
                                            value={multipliers[key]}
                                            onChange={(e) => handleChange(key, e.target.value)}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="modal-button cancel"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </button>
                            <button className="modal-button submit" onClick={handleSubmit}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MultiplierModal;
