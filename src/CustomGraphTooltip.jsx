import React from "react";
import "./CustomGraphTooltip.css";

export default function CustomGraphTooltip({ active, payload, label, formatSplitLabel }) {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].value;

    return (
        <div className="graph-tooltip">
            <div className="graph-tooltip-label">Date: {label}</div>
            <div className="graph-tooltip-value">
                Split: {formatSplitLabel(data)}
            </div>
        </div>
    );
}
