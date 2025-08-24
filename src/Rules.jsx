import { useState } from "react";
import { X, FileText } from "lucide-react";
import "./modal.css"

export default function Rules() {
  const [open, setOpen] = useState(false);

return (
    <div>
      {/* Text Icon Trigger */}
      <button onClick={() => setOpen(true)}>
        <FileText className="w-6 h-6 text-gray-700" />
      </button>

      {/* Modal */}
      {open && (
        <div className="modal-overlay">
          <div className="modal-content">
            {/* Close Button */}
            <button
              onClick={() => setOpen(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} color="#d1d5db" />
            </button>

            {/* Modal Title */}
            <h2 className="modal-title">About</h2>

            {/* Rules List */}
            <div className="modal-body">
                <ul className="rules" style={{ listStyle: "disc", paddingLeft: "1.5rem" }}>
                <h3 style={{  color:'#4ade80'}}>Erg Scores</h3>
                <li>Each week, members will complete one agreed-upon intense session together.</li>
                <li>Weekly pieces will only be recorded if all sets are completed as per programmed. Any more or less will result in a DNF/DNS</li>
                <li>Failure to complete the session, or making changes to it, will result in a DNF/DNS.</li>
                <li>Your score is based on the average split across the entire session.</li>
                <li>The session counts toward your weekly mileage total.</li>
                <li>Rank history for each participant can be viewed by clicking their name.</li>
                <li>Weight is recorded at the start of the season and may be updated upon request.</li>

                <h3 style={{  color:'#4ade80'}}>Water Scores</h3>
                <li>When conditions allow, the group should complete agreed sessions together at Blessington.</li>
                <li>Times must be recorded using a SpeedCoach or equivalent device.</li>
                <li>Your score is the average time across the full session.</li>
                <li>As with Erg Scores, failing to complete the full session results in a DNF/DNS.</li>

                <h3 style={{  color:'#4ade80'}}>Sessions</h3>
                <li>This section serves as a diary of each individual’s training throughout the year.</li>
                <li>Participants can submit scores via WhatsApp or directly through this site.</li>
                <li>All sessions must be approved by an Admin before being officially recorded.</li>
                <li>Bike meters are counted at 0.5x compared to other workout types.</li>
                <li>Weight training sessions are recorded as 0 meters.</li>
                <li>Sessions are tracked by total, monthly, and weekly metrics.</li>
                <li>Each participant has an assigned level. You advance to the next level for every 350,000 meters recorded.</li>
                </ul>
            </div>
            {/* Footer */}
            <div className="modal-footer">
              <button className="modal-button cancel" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
