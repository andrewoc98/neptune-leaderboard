import React from "react";
import "./CustomGraphTooltip.css";

export default function CustomGraphTooltip({ active, payload, label, formatSplitLabel, display }) {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].value;

    return (
        <div className="graph-tooltip">
            <div className="graph-tooltip-label">Date: {label}</div>
            <div className="graph-tooltip-value">
                {display === "Distance" ? "Distance" : "Split"} : {formatSplitLabel(data)}
            </div>
        </div>
    );
}
