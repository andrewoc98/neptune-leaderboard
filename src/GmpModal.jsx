import React, { useState, useEffect } from "react";
import { Gauge } from "lucide-react";
import { saveSpeedsToFirestore } from "./firebase"; // adjust import path as needed

export default function GmpModal({ gmpSpeeds }) {
    const [isOpen, setIsOpen] = useState(false);
    const [speeds, setSpeeds] = useState({});
    const [selectedKey, setSelectedKey] = useState("1x");
    const [distance, setDistance] = useState(2000);
    const [minutes, setMinutes] = useState(0);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!isOpen) return; // Only load speeds when modal opens
        setSpeeds(gmpSpeeds);
    }, [isOpen, gmpSpeeds]);

    useEffect(() => {
        if (!speeds[selectedKey]) return;
        const totalSeconds = distance / speeds[selectedKey];
        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds - min * 60;
        setMinutes(min);
        setSeconds(parseFloat(sec.toFixed(1)));
    }, [selectedKey, speeds, distance]);

    const updateSpeedFromTime = (min, sec) => {
        let totalSeconds = min * 60 + sec;
        if (totalSeconds <= 0) return;
        const newMin = Math.floor(totalSeconds / 60);
        const newSec = totalSeconds - newMin * 60;
        setMinutes(newMin);
        setSeconds(parseFloat(newSec.toFixed(1)));
        setSpeeds((prev) => ({
            ...prev,
            [selectedKey]: parseFloat((distance / totalSeconds).toFixed(3)),
        }));
    };

    const handleMinutesChange = (value) => {
        const min = parseInt(value, 10) || 0;
        updateSpeedFromTime(min, seconds);
    };

    const handleSecondsChange = (value) => {
        let sec = parseFloat(value) || 0;
        if (sec < 0) sec = 0;
        updateSpeedFromTime(minutes, sec);
    };

    const handleSpeedChange = (value) => {
        const newSpeed = parseFloat(value) || 0;
        setSpeeds((prev) => ({ ...prev, [selectedKey]: newSpeed }));
        const totalSeconds = distance / newSpeed;
        const min = Math.floor(totalSeconds / 60);
        const sec = totalSeconds - min * 60;
        setMinutes(min);
        setSeconds(parseFloat(sec.toFixed(1)));
    };

    const handleDistanceChange = (value) => {
        const newDistance = parseFloat(value) || 0;
        setDistance(newDistance);
        const totalSeconds = minutes * 60 + seconds;
        setSpeeds((prev) => ({
            ...prev,
            [selectedKey]: parseFloat((newDistance / totalSeconds).toFixed(3)),
        }));
    };

    const handleSubmit = async () => {
        try {
            await saveSpeedsToFirestore(speeds);
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to save speeds:", error);
        }
    };

    return (
        <>
            <button className="btn" onClick={() => setIsOpen(true)}>
                <Gauge />
            </button>

            {isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">Edit GMP Speeds</h2>
                        <div className="modal-body">
                            <div className="modal-field">
                                <label className="modal-label">Select Speed Key</label>
                                <select
                                    className="modal-select"
                                    value={selectedKey}
                                    onChange={(e) => setSelectedKey(e.target.value)}
                                >
                                    {Object.keys(speeds).map((key) => (
                                        <option key={key} value={key}>
                                            {key}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="modal-field">
                                <label className="modal-label">Distance (m)</label>
                                <input
                                    type="number"
                                    className="modal-input"
                                    value={distance}
                                    onChange={(e) => handleDistanceChange(e.target.value)}
                                />
                            </div>

                            <div className="modal-field">
                                <label className="modal-label">Speed (m/s)</label>
                                <input
                                    type="number"
                                    className="modal-input"
                                    value={speeds[selectedKey] || ""}
                                    onChange={(e) => handleSpeedChange(e.target.value)}
                                />
                            </div>

                            <div className="modal-field">
                                <label className="modal-label">Time</label>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <input
                                        type="number"
                                        className="modal-input"
                                        style={{ flex: 1 }}
                                        min={0}
                                        value={minutes}
                                        onChange={(e) => handleMinutesChange(e.target.value)}
                                    />
                                    <span style={{ alignSelf: "center", fontWeight: 600 }}>:</span>
                                    <input
                                        type="number"
                                        className="modal-input"
                                        style={{ flex: 1 }}
                                        min={0}
                                        max={59.9}
                                        step={0.1}
                                        value={seconds}
                                        onChange={(e) => handleSecondsChange(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="modal-button cancel"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-button submit"
                                onClick={handleSubmit}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
