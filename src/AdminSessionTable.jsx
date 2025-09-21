import { useEffect, useState } from "react";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { database } from "./firebase";
import "./App.css";
import { sortByDate } from "./Util";
import FilterModal from "./FilterModal";
import { ListFilter, Download } from "lucide-react";

function AdminSessionTable() {
    const [data, setData] = useState([]);
    const [filters, setFilters] = useState({
        name: "",
        type: "",
        sortBy: "",
        order: "asc",
        intense: "",
        weights: ""
    });
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

        const unsubscribe = onSnapshot(usersRef, (snapshot) => {
            const sessions = snapshot.docs
                .map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        date: data.date ? data.date.toDate() : new Date() // convert Firestore timestamp to JS Date
                    };
                })
                .filter((session) => session.approved === true);

            setData(sortByDate(sessions));
        });

        return () => unsubscribe();
    }, []);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize time for comparison

    const filteredData = data
        .filter((session) => (filters.name ? session.name === filters.name : true))
        .filter((session) => (filters.type ? session.type === filters.type : true))
        .filter((session) => (filters.intense === true ? session.intense === true : true))
        .filter((session) => (filters.weights === true ? session.weights === true : true))
        .sort((a, b) => {
            let result = 0;
            if (filters.sortBy === "distance") {
                result = (a.distance || 0) - (b.distance || 0);
            } else if (filters.sortBy === "date") {
                result = a.date - b.date;
            }
            return filters.order === "desc" ? -result : result;
        });

    const handleDownload = () => {
        const json = JSON.stringify(filteredData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "sessions.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    return (
        <div className="table-container" style={{ width: "90%" }}>
            <div
                className="table-section"
                style={{ position: "relative", marginBottom: "0.5rem", color: "white" }}
            >
                <FilterModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    filters={filters}
                    onSubmit={(newFilters) => setFilters(newFilters)}
                    onReset={() =>
                        setFilters({
                            name: "",
                            type: "",
                            sortBy: "",
                            order: "asc",
                            intense: "",
                            weights: ""
                        })
                    }
                />

                <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                        className="btn"
                        style={{ margin: "0.5rem", padding: "0.3rem 0.6rem" }}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <ListFilter />
                    </button>

                    <button
                        className="btn"
                        style={{ margin: "0.5rem" }}
                        onClick={handleDownload}
                    >
                        <Download style={{ marginRight: "4px" }} />
                    </button>
                </div>

                <div className="table-description">
                    <p style={{ textAlign: "center", marginBottom: "0.5rem", color: "white" }}>
                        <b>Approved Sessions:</b> {filteredData.length}
                    </p>
                </div>

                <table>
                    <thead style={{ padding: "0" }}>
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
                        const sessionDate = new Date(session.date);
                        sessionDate.setHours(0, 0, 0, 0); // normalize
                        const isToday = sessionDate.getTime() === today.getTime();

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
                                <td>{session.date ? session.date.toLocaleDateString() : "N/A"}</td>
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
