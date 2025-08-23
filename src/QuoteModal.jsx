import { useState } from "react";
import { Quote } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "./modal.css"
import { addQuote } from './firebase'

export default function QuoteModal() {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState({
        quote: '',
        author: 'Anon',
        approved: false
    })
    const [error, setError] = useState('')

    function validate() {
        if (!data.quote || !data.author) {
            return false
        } else if (data.quote === '' || data.author === '') {
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
        setOpen(false)
        addQuote(data)
        setData({ quote: '', author: 'Anon', approved:false })
        toast.success("Quote has been sent for Approval");
    }
    return (
        <>
            <div>
                {/* Text Icon Trigger */}
                <button onClick={() => setOpen(true)}>
                    <Quote />
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
                                <label>Quote</label>
                                <input
                                    type="text"
                                    placeholder="Quote"
                                    onChange={(e) => setData({ ...data, quote: e.target.value })}
                                />
                            </div>
                            <div className="field">
                                <label>Author</label>
                                <input
                                    type="text"
                                    placeholder="Anon"
                                    onChange={(e) => setData({ ...data, author: e.target.value })}
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
        </>
    );
}