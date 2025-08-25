import { useState } from "react";
import './App.css'
import SubmissionTable from "./SubmissionTable";
import LeaderboardModal from "./LeaderboardModal";
import WaterLeaderBoardModal from "./WaterLeaderBoardModal";
import Workout from "./Workout";
import QuotesModal from "./QuotesModal";
import AdminSessionTable from "./AdminSessionTable";
import MultiplierModal from "./MultiplerModal";

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
            <div style={{ padding: "2rem", allignItems: 'centre' }}>
                <h1 style={{ color: 'white' }}>Admin Login</h1>
                <form onSubmit={handleSubmit}>
                    <input
                        className='modal-input'
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter password"
                        style={{ padding: "0.5rem", marginRight: "0.5rem", width: '20%' }}
                    />
                    <button type="submit">Enter</button>
                </form>
            </div>
        );
    }
  return (
    <div style={{ padding: "2rem", color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      
      {/* Submission Table */}
      <div style={{ width: '80%', maxWidth: '1200px', }}>
        <SubmissionTable />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
        <LeaderboardModal />
        <WaterLeaderBoardModal />
        <Workout />
        <QuotesModal />
        <MultiplierModal/>
      </div>

      {/* Admin Session Table */}
      <div style={{ width: '90%', maxWidth: '1200px' }}>
        <AdminSessionTable />
      </div>

    </div>
  );
}
