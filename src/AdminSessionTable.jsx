import { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc, query, where } from "firebase/firestore";
import { database } from "./firebase"; // import from your firebase.js
import "./App.css"
import { sortByDate } from "./Util";
import FilterModal from "./FilterModal";

function AdminSessionTable() {
    const [data, setData] = useState([]);

    const [filters, setFilters] = useState({ name: "", sortBy: "", order: "asc" });
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    const filteredData = data
        .filter((session) => (filters.name ? session.name === filters.name : true))
        .sort((a, b) => {
            let result = 0;
            if (filters.sortBy === "distance") {
                result = (a.distance || 0) - (b.distance || 0);
            } else if (filters.sortBy === "date") {
                result = new Date(a.date) - new Date(b.date);
            }
            return filters.order === "desc" ? -result : result;
        });

return (
    <div className="table-container" style={{ width: "90%" }}>
      <div className="table-section">
        <FilterModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            filters={filters}
            onSubmit={(newFilters) => setFilters(newFilters)}
            onReset={() => setFilters({ name: "", sortBy: "" })}/>

          <button
              className="btn"
              style={{ margin: "0.5rem", padding: "0.3rem 0.6rem" }}
              onClick={() => setIsModalOpen(true)}
          >
              Filters
          </button>
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
          {filteredData.map((session) => {
              const isToday = session.date === todayString;
              return (
                  <tr
                      key={session.id}
                      className="hover-row"
                      style={{
                          cursor: "pointer",
                          backgroundColor: isToday ? "rgba(255, 255, 255, 0.1)" : "transparent",
                      }}
                  >
                      <td>{session.name || "N/A"}</td>
                      <td>{session.date || "N/A"}</td>
                      <td>{session.type || "N/A"}</td>
                      <td>{session.distance || "N/A"}</td>
                      <td>
                          <button className="unapprove-button" onClick={() => handleUnapprove(session.id)}>
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
