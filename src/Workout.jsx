import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "./modal.css"
import { updateOrAppendWorkout } from './firebase'

export default function Workout() {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState({
        week: '',
        type: 'Erg',
        workout: ''

    })
    const [error, setError] = useState('')

    function validate() {
        if (!data.week || !data.type || !data.workout) {
            return false
        } else if (data.week === '' || data.type === '' || data.workout === '') {
            return false
        }
        return true
    }
    const closeModal = () => {
        setOpen(false)
    }

    const handleSubmit = () => {
        setError('')
        if (!validate()) {
            setError('Please fill out all the fields')
            return
        }
        console.log(data)
        updateOrAppendWorkout(data)
        setOpen(false)
        setData({week: '', type: 'Erg', workout: ''})
        toast.success("Workout has been Uploaded");
    }
    return (
        <>
            <div>
                {/* Text Icon Trigger */}
                <button style={{ marginLeft: "0.5rem" }} className='btn' onClick={() => setOpen(true)}>
                    <Dumbbell />
                </button>

                {/* Modal */}
                {open && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button
                                onClick={closeModal}
                                style={{
                                    position: "absolute",
                                    top: "1rem",
                                    right: "1rem",
                                    background: "transparent",
                                    border: "none",
                                    fontSize: "1.5rem",
                                    color: "#f8f9fa",
                                    cursor: "pointer",
                                }}
                            >
                                ×
                            </button>

                            <div className="field">
                                <label>Date</label>
                                <input
                                    type="week"
                                    onChange={(e) => setData({ ...data, week: e.target.value })}
                                />
                            </div>
                            <div className="field">
                                <label>Type</label>
                                <select
                                    type="text"
                                    onChange={(e) => setData({ ...data, type: e.target.value })}
                                >
                                    <option value="Erg">Erg</option>
                                    <option value="Water">Water</option>
                                </select>
                            </div>
                            <div className="field">
                                <label>Session</label>
                                <input
                                    type="text"
                                    placeholder="Workout"
                                    onChange={(e) => setData({ ...data, workout: e.target.value })}
                                />
                            </div>
                            <p style={{ color: 'red' }}>{error}</p>
                            <div className="modal-footer">
                                <button className="modal-button cancel" onClick={() => handleSubmit()}>
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ToastContainer position="top-right" autoClose={3000} />
        </>
    );
}
