import React, {useEffect, useState} from "react";
import {getUsers, updateUsers} from "./firebase";
import {UserRound} from "lucide-react";

// Sample users data should come from Firestore normally, but here it's static


export default function UserEditModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState({});
    const [selectedUser, setSelectedUser] = useState("");
    const [formData, setFormData] = useState({ scull: "", sweepSide: "", sweepPoints: "", champs:true});
    const [isAdding, setIsAdding] = useState(false);
    const [newUserName, setNewUserName] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const users = await getUsers();
                setUsers(users)
            } catch (error) {
                console.error("Error users:", error);
            }
        }
        fetchUsers();
    }, []);
    const openModal = (userName) => {
        setIsAdding(false);
        setSelectedUser(userName);
        const user = users[userName];
        setFormData({
            scull: user.scull,
            sweepSide: user.sweep.side,
            sweepPoints: user.sweep.points,
            champs:user.champs
        });
    };

  const openAddUser = () => {
    const password = prompt("Enter admin password to add a user:");
    
    if (password === "yourSecretPassword") {
        setIsAdding(true);
        setSelectedUser("");
        setFormData({ scull: 0, sweepSide: "Bow", sweepPoints: 0, champs: true });
        setNewUserName("");
    } else {
        alert("Incorrect password. Access denied.");
    }
};

    const closeModal = () => {
        setIsOpen(false);
        setSelectedUser("");
        setIsAdding(false);
        setNewUserName("");
    };

    const handleChange = (e) => {

        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        let updatedData;
        if (isAdding && newUserName.trim()) {
            updatedData = {
                ...users,
                [newUserName.trim()]: {
                    scull: Number(formData.scull),
                    sweep: {
                        side: formData.sweepSide,
                        points: Number(formData.sweepPoints),
                    },
                    champs: true
                },
            };
        } else if (selectedUser) {
            updatedData = {
                ...users,
                [selectedUser]: {
                    scull: Number(formData.scull),
                    sweep: {
                        side: formData.sweepSide,
                        points: Number(formData.sweepPoints),
                    },
                    champs: formData.champs
                },
            };
        } else {
            return;
        }

        setUsers(updatedData);
        try {
            await updateUsers(updatedData);
            closeModal();
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    const handleDelete = async (userName) => {
        const updatedData = { ...users };
        delete updatedData[userName];
        setUsers(updatedData);
        try {
            await updateUsers(updatedData);
            closeModal();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    return (
        <div>
            <button onClick={() => setIsOpen(true)} className="btn">
                <UserRound/>
            </button>

            {isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {!selectedUser && !isAdding ? (
                            <>
                                <h2 className="modal-title">Select a User</h2>
                                <div className="modal-body">
                                    <ul className="quotes-list">
                                        {Object.keys(users).map((user) => (
                                            <li key={user} className="quote-card">
                                                <div className="quote-text">{user}</div>
                                                <div className="quote-actions">
                                                    <button onClick={() => openModal(user)} className="modal-button submit">
                                                        Edit
                                                    </button>
                                                    <button onClick={() => handleDelete(user)} className="modal-button cancel">
                                                        Delete
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="modal-footer">
                                    <button className="modal-button submit" onClick={openAddUser}>
                                        + Add User
                                    </button>
                                    <button className="modal-button cancel" onClick={closeModal}>
                                        Close
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="modal-title">{isAdding ? "Add New User" : `Edit ${selectedUser}`}</h2>
                                <div className="modal-body">
                                    {isAdding && (
                                        <div className="modal-field">
                                            <label className="modal-label">User Name</label>
                                            <input
                                                type="text"
                                                value={newUserName}
                                                onChange={(e) => setNewUserName(e.target.value)}
                                                className="modal-input"
                                            />
                                        </div>
                                    )}

                                    <div className="modal-field">
                                        <label className="modal-label">Scull Points</label>
                                        <input
                                            type="number"
                                            name="scull"
                                            value={formData.scull}
                                            onChange={handleChange}
                                            className="modal-input"
                                        />
                                    </div>

                                    <div className="modal-field">
                                        <label className="modal-label">Sweep Side</label>
                                        <select
                                            name="sweepSide"
                                            value={formData.sweepSide}
                                            onChange={handleChange}
                                            className="modal-select"
                                        >
                                            <option value="Bow">Bow</option>
                                            <option value="Stroke">Stroke</option>
                                            <option value="Both">Both</option>
                                        </select>
                                    </div>

                                    <div className="modal-field">
                                        <label className="modal-label">Sweep Points</label>
                                        <input
                                            type="number"
                                            name="sweepPoints"
                                            value={formData.sweepPoints}
                                            onChange={handleChange}
                                            className="modal-input"
                                        />
                                    </div>

                                    <div className="modal-field checkbox-field">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="champs"
                                                checked={formData.champs}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({ ...prev, champs: e.target.checked }))
                                                }
                                            />
                                            Available for Champs
                                        </label>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <button className="modal-button cancel" onClick={() => (isAdding ? setIsAdding(false) : setSelectedUser(""))}>
                                        Back
                                    </button>
                                    {!isAdding && (
                                        <button className="modal-button cancel" onClick={() => handleDelete(selectedUser)}>
                                            Delete
                                        </button>
                                    )}
                                    <button className="modal-button submit" onClick={handleSubmit}>
                                        Save
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
