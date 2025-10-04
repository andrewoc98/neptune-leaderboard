import { useState, useEffect } from "react";
import { auth, provider, signInWithPopup, signOut } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { database } from "./firebase";
import "./auth.css";

export default function AuthModal({ users, user: parentUser, isOpen, onClose }) {
    const [showModal, setShowModal] = useState(false);
    const [roster, setRoster] = useState(users || {});
    const [selectedName, setSelectedName] = useState("");
    const [newName, setNewName] = useState("");
    const [needsAssignment, setNeedsAssignment] = useState(false);
    const [localUser, setLocalUser] = useState(parentUser || null);

    // Keep local user synced with parent
    useEffect(() => {
        setLocalUser(parentUser || null);
    }, [parentUser]);

    // Auto-open modal if no user
    useEffect(() => {
        if (!localUser) {
            const timer = setTimeout(() => setShowModal(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [localUser]);

    // Sync manual open/close
    useEffect(() => {
        if (isOpen) setShowModal(true);
    }, [isOpen]);

    // Update roster if prop changes
    useEffect(() => {
        if (users) setRoster(users);
    }, [users]);

    async function fetchRoster() {
        const ref = doc(database, "page-data", "users");
        const snap = await getDoc(ref);
        if (snap.exists()) {
            setRoster(snap.data());
        }
    }

    async function assignToExistingUser(selectedName, currentUser) {
        const ref = doc(database, "page-data", "users");
        await updateDoc(ref, {
            [`${selectedName}.uid`]: currentUser.uid,
            [`${selectedName}.email`]: currentUser.email,
        });
    }

    async function createNewUserEntry(newName, currentUser) {
        const ref = doc(database, "page-data", "users");
        await updateDoc(ref, {
            [newName]: {
                uid: currentUser.uid,
                email: currentUser.email,
                scull: 0,
                weight: 0,
                champs: false,
                sweep: { points: 0, side: "Both" },
            },
        });
    }

    const handleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const signedInUser = result.user;
            setLocalUser(signedInUser);

            const alreadyLinked = Object.entries(roster).find(
                ([, data]) => data.uid && data.uid === signedInUser.uid
            );

            if (alreadyLinked) {
                console.log("linked");
                onClose();
                setShowModal(false);
            } else {
                console.log("not linked");
                setNeedsAssignment(true);
            }
        } catch (err) {
            console.error("Login failed", err);
        }
    };

    const handleAssign = async () => {
        if (!auth.currentUser) return;

        if (selectedName && selectedName !== "new") {
            await assignToExistingUser(selectedName, auth.currentUser);
        } else if (newName.trim()) {
            await createNewUserEntry(newName.trim(), auth.currentUser);
        }

        setNeedsAssignment(false);
        setShowModal(false);
        onClose();
    };

    const handleLogout = async () => {
        await signOut(auth);
        setLocalUser(null);
        onClose();
        setShowModal(false);
    };

    if (!showModal) return null;

    // Only filter for display purposes
    const displayableRoster = Object.entries(roster).filter(
        ([name, data]) => name !== "id" && !data.uid
    );

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal-content">
                <button
                    className="auth-modal-close"
                    onClick={() => {
                        setShowModal(false);
                        onClose();
                    }}
                >
                    ×
                </button>

                <h2 className="auth-modal-title">
                    {localUser ? "Account" : "Sign In"}
                </h2>

                <div className="auth-modal-body">
                    {!localUser ? (
                        <button
                            onClick={handleLogin}
                            className="auth-modal-button auth-google-button"
                        >
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                            />
                            Continue with Google
                        </button>
                    ) : needsAssignment ? (
                        <div className="auth-assignment-form">
                            <div className="auth-modal-field">
                                <label className="auth-modal-label">Select your name:</label>
                                <select
                                    value={selectedName}
                                    onChange={(e) => setSelectedName(e.target.value)}
                                    className="auth-modal-select"
                                >
                                    <option value="">-- Choose your name --</option>
                                    {displayableRoster.map(([name]) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                    <option value="new">I’m not on the list</option>
                                </select>
                            </div>

                            {selectedName === "new" && (
                                <div className="auth-modal-field">
                                    <label className="auth-modal-label">Enter your name:</label>
                                    <input
                                        type="text"
                                        placeholder="Full name"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="auth-modal-input"
                                    />
                                </div>
                            )}

                            <button
                                onClick={handleAssign}
                                className="auth-modal-button submit"
                            >
                                Confirm
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="auth-modal-button cancel"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
