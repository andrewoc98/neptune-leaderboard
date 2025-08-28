import { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc, query, where } from "firebase/firestore";
import { database } from "./firebase"; // import from your firebase.js
import "./App.css"
import { sortByDate } from "./Util";

function AdminSessionTable() {
    const [data, setData] = useState([]);

    const handleUnapprove = async (id) => {

        try {
            const docRef = doc(database, "sessionHistory", id);
            await updateDoc(docRef, { approved: false });
            console.log(`Session ${id} set to unapproved`);
        } catch (error) {
            console.error("Error unapproving session:", error);
        }
    };

    useEffect(() => {
        const usersRef = collection(database, "sessionHistory");

        // Real-time listener
        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
                .filter(session => session.approved === true);
            setData(sortByDate(sessions));

        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, []);
    const today = new Date();
    const todayString = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

return (
    <div className="table-container" style={{ width: "90%" }}>
      <div className="table-section">
        {/* Optional description */}
        <div className="table-description">
          <p style={{ textAlign: "center", marginBottom: "0.5rem", color: "white" }}>
            <b>Approved Sessions:</b> {data.length}
          </p>
        </div>

        <table style={{}}>
          <thead
          style={{padding:"0"}}>
            <tr>
              <th>Name</th>
              <th>Date</th>
              <th>Type</th>
              <th>Distance</th>
              <th>Unapprove</th>
            </tr>
          </thead>
          <tbody>
            {data.map((session) => {
              const isToday = session.date === todayString; // check if date is today
              return (
                <tr
                  key={session.id}
                  className="hover-row"
                  style={{
                    cursor: "pointer",
                    backgroundColor: isToday ? "rgba(255, 255, 255, 0.1)" : "transparent"
                  }}
                >
                  <td>{session.name || "N/A"}</td>
                  <td>{session.date || "N/A"}</td>
                  <td>{session.type || "N/A"}</td>
                  <td>{session.distance || "N/A"}</td>
                  <td>
                    <button
                      className="unapprove-button"
                      onClick={() => handleUnapprove(session.id)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminSessionTable;
