import React, { useEffect, useState } from 'react';
import './SubmissionTable.css';
import { getUnApprovedSessions } from "./Util";
import { approveSession, rejectSession } from './firebase';
import {v4 as uuidv4} from 'uuid';


export default function ExerciseTable() {
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const stats = await getUnApprovedSessions();
                setData(stats);
            } catch (error) {
                console.error("Error fetching session stats:", error);
            }
        };
        fetchData();
    }, []);

    const [editCell, setEditCell] = useState({ id: null, field: null });
    const [showNewEntryForm, setShowNewEntryForm] = useState(false);
    const [newEntry, setNewEntry] = useState({
        name: '',
        distance: 0,
        weights: false,
        intense: false,
        notes: '',
        date: ''
    });

    // Approve an entry and save it to Firebase
    const handleApprove = async (entry) => {
        const success = await approveSession(entry);
        if (success) {
            setData(prev => prev.map(item => item.id === entry.id ? { ...item, approved: true } : item));
        }
    };

    // Reject an entry and delete it from Firebase
    const handleReject = async (entry) => {
        const success = await rejectSession(entry);
        if (success) {
            setData(prev => prev.filter(item => item.id !== entry.id));
        }
    };

    const toggleCheckbox = (id, field) => {
        setData(prev =>
            prev.map(item =>
                item.id === id ? { ...item, [field]: !item[field] } : item
            )
        );
    };

    const handleEditChange = (id, field, value) => {
        setData(prev =>
            prev.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const handleDoubleClick = (id, field) => {
        setEditCell({ id, field });
    };

    const handleBlur = () => {
        setEditCell({ id: null, field: null });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleBlur();
    };

    const handleNewEntryChange = (field, value) => {
        setNewEntry(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleAddEntry = () => {
        if (!newEntry.name.trim()) {
            alert('Name is required');
            return;
        }
        const uuid = uuidv4()
        setData(prev => [
            ...prev,
            {
                ...newEntry,
                id: uuid,
                distance: Number(newEntry.distance),
                weights: Boolean(newEntry.weights),
                intense: Boolean(newEntry.intense),
            },
        ]);

        setNewEntry({
            id: uuid,
            name: '',
            distance: 0,
            weights: false,
            intense: false,
            notes: '',
            date: ''
        });
        setShowNewEntryForm(false);
    };

    return (
        <div className="table-container">
            <table className="exercise-table">
                <thead>
                <tr>
                    <th>Name</th>
                    <th>Distance(m)</th>
                    <th>Weights</th>
                    <th>Intense</th>
                    <th>Notes</th>
                    <th>Date</th>
                    <th>Approve</th>
                    <th>Reject</th>
                </tr>
                </thead>
                <tbody>
                {data.map((row) => (
                    !row.approved && (
                    <tr key={row.id}>
                        <td onDoubleClick={() => handleDoubleClick(row.id, 'name')}>
                            {editCell.id === row.id && editCell.field === 'name' ? (
                                <select
                                    value={row.name}
                                    onChange={(e) => handleEditChange(row.id, 'name', e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                >
                                    {["Alex","Andrew","Ben","Devon","Gav","John","Luke","Mark", "Matt", "Odhran","Ryan","Tommy"].map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                row.name
                            )}
                        </td>
                        <td onDoubleClick={() => handleDoubleClick(row.id, 'distance')}>
                            {editCell.id === row.id && editCell.field === 'distance' ? (
                                <input
                                    type="number"
                                    value={row.distance}
                                    onChange={(e) => handleEditChange(row.id, 'distance', Number(e.target.value))}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                />
                            ) : (
                                row.distance
                            )}
                        </td>
                        <td>
                            <input
                                type="checkbox"
                                checked={row.weights}
                                onChange={() => toggleCheckbox(row.id, 'weights')}
                            />
                        </td>
                        <td>
                            <input
                                type="checkbox"
                                checked={row.intense}
                                onChange={() => toggleCheckbox(row.id, 'intense')}
                            />
                        </td>
                        <td onDoubleClick={() => handleDoubleClick(row.id, 'notes')}>
                            {editCell.id === row.id && editCell.field === 'notes' ? (
                                <textarea
                                    value={row.notes}
                                    onChange={(e) => handleEditChange(row.id, 'notes', e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                />
                            ) : (
                                row.notes
                            )}
                        </td>
                        <td onDoubleClick={() => handleDoubleClick(row.id, 'date')}>
                            {editCell.id === row.id && editCell.field === 'date' ? (
                                <input
                                    type="date"
                                    value={row.date.replaceAll('/','-')}
                                    onChange={(e) => handleEditChange(row.id, 'date', e.target.value.replaceAll('/','-'))}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                />
                            ) : (
                                row.date
                            )}
                        </td>
                        <td>
                            <button
                                className="green"
                                onClick={() => handleApprove(row)}
                            >
                                ✔
                            </button>
                        </td>
                        <td>
                            <button
                                className="red"
                                onClick={() => handleReject(row)}
                            >
                                ✖
                            </button>
                        </td>
                    </tr>
                )))}
                </tbody>

                {showNewEntryForm && (
                    <tfoot>
                    <tr className="new-entry-row">
                        <td>
                            <select
                                value={newEntry.name}
                                onChange={(e) => handleNewEntryChange('name', e.target.value)}
                            >
                                <option value="">Select Name</option>
                                <option value="Alex">Alex</option>
                                <option value="Andrew">Andrew</option>
                                <option value="Bem">Ben</option>
                                <option value="Devon">Devpn</option>
                                <option value="Gav">Gav</option>
                                <option value="John">John</option>
                                <option value="Mark">Mark</option>
                                <option value="Matt">Matt</option>
                                <option value="Odhran">Odhran</option>
                                <option value="Ryan">Ryan</option>
                                <option value="Tommy">Tommy</option>
                            </select>
                        </td>
                        <td>
                            <input
                                type="number"
                                placeholder="Distance"
                                value={newEntry.distance}
                                onChange={(e) => handleNewEntryChange('distance', e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </td>
                        <td>
                            <input
                                type="checkbox"
                                checked={newEntry.weights}
                                onChange={(e) => handleNewEntryChange('weights', e.target.checked)}
                            />
                        </td>
                        <td>
                            <input
                                type="checkbox"
                                checked={newEntry.intense}
                                onChange={(e) => handleNewEntryChange('intense', e.target.checked)}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                placeholder="Notes"
                                value={newEntry.notes}
                                onChange={(e) => handleNewEntryChange('notes', e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                                type="date"
                                placeholder="Date dd/mm/yyyy"
                                value={newEntry.date}
                                onChange={(e) => handleNewEntryChange('date', e.target.value.replaceAll('-','/'))}
                            />
                        </td>
                        <td colSpan={2}>
                            <button onClick={handleAddEntry}>Add</button>
                            <button
                                onClick={() => setShowNewEntryForm(false)}
                                style={{ marginLeft: '0.5rem' }}
                            >
                                Cancel
                            </button>
                        </td>
                    </tr>
                    </tfoot>
                )}
            </table>

            {!showNewEntryForm && (
                <div className="add-entry-container">
                    <button
                    className="add-entry-btn"
                        onClick={() => setShowNewEntryForm(true)}
                        aria-label="Add new entry"
                        title="Add new entry"
                    >
                        +
                    </button>
                </div>
            )}
        </div>
    );
}
