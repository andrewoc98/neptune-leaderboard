import React, {useEffect, useState} from "react";
import {getUsers, updateUsers} from "./firebase"; // adjust path where you put updateUsers
import { UserRound } from 'lucide-react';
import "./modal.css"

export default function UserEditModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [users, setUsers] = useState({});
    const [selectedUser, setSelectedUser] = useState("");
    const [formData, setFormData] = useState({ scull: "", sweepSide: "", sweepPoints: "" });

    useEffect(() => {
        const fetchUsers = async () => {
            try{
                const users = await getUsers()
                setUsers(users)
            } catch (e){
                console.log("Error fetching users: ", e)
            }
        }
        fetchUsers();
    }, []);
    const openModal = (userName) => {
        setSelectedUser(userName);
        const user = users[userName];
        setFormData({
            scull: user.scull,
            sweepSide: user.sweep.side,
            sweepPoints: user.sweep.points,
        });
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        const newData = {
            ...users,
            [selectedUser]: {
                scull: Number(formData.scull),
                sweep: {
                    side: formData.sweepSide,
                    points: Number(formData.sweepPoints),
                },
            },
        };

        setUsers(newData);
        try {
            await updateUsers(newData);
            closeModal();
        } catch (err) {
            console.error("Update failed", err);
        }
    };

    return (
        <div>
            <button onClick={() => setIsOpen(true)} className="btn" >
                <UserRound/>
            </button>


            {isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        {!selectedUser ? (
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
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="modal-footer">
                                    <button className="modal-button cancel" onClick={closeModal}>
                                        Close
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="modal-title">Edit {selectedUser}</h2>
                                <div className="modal-body">
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
                                </div>


                                <div className="modal-footer">
                                    <button className="modal-button cancel" onClick={() => setSelectedUser("")}>
                                        Back
                                    </button>
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