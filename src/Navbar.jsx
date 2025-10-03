import React from "react";
import "./navbar.css"

export default function Navbar({ user, admin, setAdmin, onAuthClick }) {
    return (
        <nav className="app-navbar">
            <div className="navbar-left">
            </div>
            <div className="navbar-right">
                {user && (user.role === "role" || user.role === "super-admin") && (
                    <button
                        onClick={() => setAdmin(!admin)}
                        className="navbar-btn admin-btn"
                    >
                        {admin ? "Admin Dashboard" : "View Leaderboard"}
                    </button>
                )}

                <button onClick={onAuthClick} className="navbar-btn auth-btn">
                    {user ? "Sign Out" : "Sign In"}
                </button>
            </div>
        </nav>
    );
}
