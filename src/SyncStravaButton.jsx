import React, { useState } from "react";
import {fetchAllAthleteActivities, rowerSession} from "./firebase";
import {formatStravaActivities} from "./Util";
import {CalendarSync} from 'lucide-react'
import './SyncStravaButton.css'

export default function SyncStravaButton() {
    const [loading, setLoading] = useState(false);
    const [errorFlash, setErrorFlash] = useState(false);

    const handleSync = async () => {
        try {
            setLoading(true);
            setErrorFlash(false);

            // 1. Fetch raw activities
            const activities = await fetchAllAthleteActivities();

            // 2. Format them into your schema
            const formatted = formatStravaActivities(activities);

            // 3. Send each formatted activity into rowerSession
            for (const activity of formatted) {
                await rowerSession(activity);
            }
        } catch (err) {
            console.error("Error syncing activities:", err);
            // flash red for 1 second
            setErrorFlash(true);
            setTimeout(() => setErrorFlash(false), 1000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSync}
            disabled={loading}
            className={`sync-button ${loading ? "loading" : ""} ${errorFlash ? "error" : ""}`}
        >
            {loading && (
                <svg
                    className="spinner"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="spinner-circle"
                        cx={12}
                        cy={12}
                        r={10}
                        stroke="currentColor"
                        strokeWidth={4}
                    />
                    <path
                        className="spinner-path"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                </svg>
            )}
            <span>{loading ? null : <CalendarSync/>}</span>
        </button>
    );
}