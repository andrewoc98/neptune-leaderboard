import { useState } from "react";
import './App.css'
import SubmissionTable from "./SubmissionTable";

export default function Admin() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");

    const correctPassword = "supersecret"; // ⚠️ Hardcoded just for demo

    const handleSubmit = (e) => {
        e.preventDefault();
        if (passwordInput === correctPassword) {
            setIsAuthorized(true);
        } else {
            alert("Incorrect password");
        }
    };

    if (!isAuthorized) {
        return (
            <div style={{ padding: "2rem", allignItems:'centre'}}>
                <h1 style={{color:'white'}}>Admin Login</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        className='modal-input'
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter password"
                        style={{ padding: "0.5rem", marginRight: "0.5rem", width:'20%' }}
                    />
                    <button type="submit">Enter</button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ padding: "2rem", color:'white' }}>
            <SubmissionTable/>
        </div>
    );
}
