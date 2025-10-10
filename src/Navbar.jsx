import React, { useState } from "react";
import "./navbar.css";

export default function Navbar({ user, currentView, setView, onAuthClick }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="app-navbar">
            <div className="navbar-left">
                {/* Hamburger on the LEFT now */}
                <div
                    className={`hamburger ${menuOpen ? "open" : ""}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>

            <div className={`navbar-right ${menuOpen ? "open" : ""}`}>
                {user && (
                    <>
                        <button
                            onClick={() => {
                                setMenuOpen(false)
                                setView("user")
                            }
                        }
                            className={`navbar-btn ${currentView === "user" ? "active" : ""}`}
                        >
                            Leaderboard
                        </button>
                        <button
                            onClick={() => {
                                setMenuOpen(false)
                                setView("profile")
                            }}
                            className={`navbar-btn ${currentView === "profile" ? "active" : ""}`}
                        >
                            Personal Dashboard
                        </button>
                        {(user.role === "admin" || user.role === "super-admin") && (
                            <button
                                onClick={() => {
                                    setMenuOpen(false)
                                    setView("admin")
                                }}

                                className={`navbar-btn ${currentView === "admin" ? "active" : ""}`}
                            >
                                Admin Dashboard
                            </button>
                        )}
                    </>
                )}

                <button onClick={onAuthClick} className="navbar-btn auth-btn">
                    {user ? "Sign Out" : "Sign In"}
                </button>
            </div>
        </nav>
    );
}
