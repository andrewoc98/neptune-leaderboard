import { useState } from "react";
import './App.css'
import SubmissionTable from "./SubmissionTable";
import LeaderboardModal from "./LeaderboardModal";
import WaterLeaderBoardModal from "./WaterLeaderBoardModal";
import Workout from "./Workout";
import QuotesModal from "./QuotesModal";
import AdminSessionTable from "./AdminSessionTable";
import MultiplierModal from "./MultiplerModal";
import UserEditModal from "./UserEditModal";
import GmpModal from "./GmpModal";

export default function Admin({gmpSpeeds,users}) {
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

  return (
    <div style={{ padding: "2rem", color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      


      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
        <LeaderboardModal users={users}/>
        <WaterLeaderBoardModal users={users}/>
        <Workout />
        <QuotesModal />
        <MultiplierModal/>
        <UserEditModal/>
        <GmpModal gmpSpeeds={gmpSpeeds}/>
      </div>
        {/* Submission Table */}
        <div style={{ width: '80%', maxWidth: '1200px', }}>
            <SubmissionTable users={users}/>
        </div>
      {/* Admin Session Table */}
      <div style={{ width: '90%', maxWidth: '1200px' }}>
        <AdminSessionTable users={users}/>
      </div>

    </div>
  );
}
