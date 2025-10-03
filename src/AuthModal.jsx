import { useState, useEffect } from "react";
import { auth, provider, signInWithPopup, signOut } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { database } from "./firebase";
import "./modal.css";

export default function AuthModal({ users, user, isOpen, onClose }) {
    const [showModal, setShowModal] = useState(false);
    const [roster, setRoster] = useState(users || {});
    const [selectedName, setSelectedName] = useState("");
    const [newName, setNewName] = useState("");
    const [needsAssignment, setNeedsAssignment] = useState(false);

    // Auto-open modal if no user
    useEffect(() => {
        if (!user) {
            const timer = setTimeout(() => setShowModal(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    // Sync manual open/close
    useEffect(() => {
        if (isOpen) setShowModal(true);
    }, [isOpen]);

    // If `users` prop changes, update roster
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

            // Ensure roster is up to date
            await fetchRoster();
            console.log(signedInUser.uid)
            const alreadyLinked = Object.entries(roster).find(
                ([, data]) => data.uid === signedInUser.uid
            );

            if (alreadyLinked) {
                console.log("✅ User already linked:", alreadyLinked[0]);
                onClose();
                setShowModal(false);
            } else {
                console.log("⚠️ User not linked yet, showing roster picker.");
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
            console.log(`✅ Linked to existing user: ${selectedName}`);
        } else if (newName.trim()) {
            await createNewUserEntry(newName.trim(), auth.currentUser);
            console.log(`✅ Created new entry for: ${newName}`);
        }

        setNeedsAssignment(false);
        setShowModal(false);
        onClose();
    };

    const handleLogout = async () => {
        await signOut(auth);
        onClose();
        setShowModal(false);
    };

    if (!showModal) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button
                    className="modal-close"
                    onClick={() => {
                        setShowModal(false);
                        onClose();
                    }}
                >
                    ×
                </button>

                <h2 className="modal-title">
                    {user ? "Account" : "Sign In"}
                </h2>

                <div className="modal-body">
                    {!user ? (
                        <button
                            onClick={handleLogin}
                            className="modal-button submit w-full flex items-center justify-center gap-2"
                        >
                            <img
                                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                alt="Google"
                                className="w-5 h-5"
                            />
                            Continue with Google
                        </button>
                    ) : (
                        <>
                            {!needsAssignment ? (
                                <button
                                    onClick={handleLogout}
                                    className="modal-button cancel w-full"
                                >
                                    Logout
                                </button>
                            ) : (
                                <div className="assignment-form space-y-4">
                                    <div className="modal-field">
                                        <label className="modal-label">Select your name:</label>
                                        <select
                                            value={selectedName}
                                            onChange={(e) => setSelectedName(e.target.value)}
                                            className="modal-select"
                                        >
                                            <option value="">-- Choose your name --</option>
                                            {Object.keys(roster).map((name) =>
                                                name !== "id" ? (
                                                    <option key={name} value={name}>
                                                        {name}
                                                    </option>
                                                ) : null
                                            )}
                                            <option value="new">I’m not on the list</option>
                                        </select>
                                    </div>

                                    {selectedName === "new" && (
                                        <div className="modal-field">
                                            <label className="modal-label">Enter your name:</label>
                                            <input
                                                type="text"
                                                placeholder="Full name"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="modal-input"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={handleAssign}
                                        className="modal-button submit w-full"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
