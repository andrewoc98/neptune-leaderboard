import './App.css';
import Admin from "./Admin";
import User from "./User";
import Profile from "./Profile";
import { useEffect, useState } from "react";
import { ToastContainer } from 'react-toastify';
import { Prestige } from './Prestige';
import { loadAllDocuments } from "./firebase";
import { getAllSessionHistory } from "./Util";
import { auth, onAuthStateChanged } from "./firebase";
import Navbar from "./Navbar";
import AuthModal from "./AuthModal";

function App() {
    const [view, setView] = useState("user"); // can be "user", "admin", or "profile"
    const [leaderboard, setLeaderboard] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [users, setUsers] = useState({});
    const [workouts, setWorkouts] = useState([]);
    const [multipliers, setMultipliers] = useState({});
    const [sessions, setSessions] = useState([]);
    const [gmpSpeeds, setGmpSpeeds] = useState({});
    const [user, setUser] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [tags, setTags] = useState([])

    // Track authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Find both the username (key) and user data (value)
                const matchedEntry = Object.entries(users).find(
                    ([, u]) => u.uid === currentUser.uid
                );

                if (matchedEntry) {
                    const [username, userData] = matchedEntry;
                    // Store username and user data together
                    setUser({ ...userData, username });
                } else {
                    setUser(null);
                }
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, [users]);

    // Fetch all data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const lazyData = await loadAllDocuments();
                const allSessions = await getAllSessionHistory();

                const unsortedUsers = lazyData[6];
                const sortedUsers = Object.keys(unsortedUsers)
                    .filter(key => key !== "id")
                    .sort((a, b) => a.localeCompare(b))
                    .reduce((obj, key) => {
                        obj[key] = unsortedUsers[key];
                        return obj;
                    }, { id: unsortedUsers.id });

                setLeaderboard(lazyData[1].entries);
                setMultipliers(lazyData[2]);
                setQuotes(lazyData[3].quotes);
                setUsers(sortedUsers);
                setWorkouts({
                    erg: lazyData[7].erg.entries,
                    water: lazyData[7].water.entries
                });
                setSessions(allSessions);
                setGmpSpeeds(lazyData[0].speeds);
                setTags(lazyData[5].entries)
            } catch (e) {
                console.error("Failed to load page documents", e);
            }
        };

        fetchData();
    }, []);


    return (
        <div className="App">
            {/* Navbar */}
            <Navbar
                user={user}
                currentView={view}
                setView={setView}
                onAuthClick={() => setModalOpen(true)}
            />

            {/* Auth Modal */}
            <AuthModal
                users={users}
                user={user}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            />

            {/* Main Content */}
            <main className="container mt-4">
                {view === "user" && (
                    <User
                        leaderboard={leaderboard}
                        quotes={quotes}
                        users={users}
                        workouts={workouts}
                        multipliers={multipliers}
                        sessions={sessions}
                        gmpSpeeds={gmpSpeeds}
                        tags={tags}
                    />
                )}

                {view === "admin" && (
                    <Admin users={users} gmpSpeeds={gmpSpeeds} />
                )}

                {view === "profile" && (
                    <Profile
                        user={user}          // includes username + user data
                        sessions={sessions}
                        tags={tags}
                    />
                )}
            </main>

            {/* Toast Notifications */}
            <ToastContainer
                pauseOnHover={false}
                pauseOnFocusLoss={false}
                position="top-right"
                autoClose={1500}
                limit={1}
            />

            {/* Prestige Widget */}
            <Prestige />
        </div>
    );
}

export default App;
