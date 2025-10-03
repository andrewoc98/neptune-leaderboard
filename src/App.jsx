import './App.css';
import Admin from "./Admin";
import User from "./User";
import { useEffect, useState } from "react";
import { ToastContainer } from 'react-toastify';
import { Prestige } from './Prestige';
import { loadAllDocuments } from "./firebase";
import { getAllSessionHistory } from "./Util";
import { auth, onAuthStateChanged } from "./firebase";
import Navbar from "./Navbar";
import AuthModal from "./AuthModal";

function App() {
    const [admin, setAdmin] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [users, setUsers] = useState({});
    const [workouts, setWorkouts] = useState([]);
    const [multipliers, setMultipliers] = useState({});
    const [sessions, setSessions] = useState([]);
    const [gmpSpeeds, setGmpSpeeds] = useState({});
    const [user, setUser] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);

    // Track auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // Find the user in the users object with matching uid
                const matchedUser = Object.values(users).find(user => user.uid === currentUser.uid);
                setUser(matchedUser || null);
            } else {
                setUser(null);
            }
        });

        return () => unsubscribe();
    }, [users]); // re-run if users changes


    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const lazyData = await loadAllDocuments();
                const allSessions = await getAllSessionHistory();

                const unsortedUsers = lazyData[5];
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
                setWorkouts({ erg: lazyData[6].erg.entries, water: lazyData[6].water.entries });
                setSessions(allSessions);
                setGmpSpeeds(lazyData[0].speeds);

            } catch (e) {
                console.error("Failed to load page documents", e);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        console.log(user)
    }, [user]);

    return (
        <div className="App">
            {/* Navbar with always-visible Auth button */}
            <Navbar

                user={user}
                admin={admin}
                setAdmin={setAdmin}
                onAuthClick={() => setModalOpen(true)}
            />

            {/* Auth Modal (full app overlay, 2-second fade-in) */}
            <AuthModal
                users={users}
                user={user}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
            />

            {/* Main content */}
            <main className="container mt-4">
                {!admin ? (
                    <User
                        leaderboard={leaderboard}
                        quotes={quotes}
                        users={users}
                        workouts={workouts}
                        multipliers={multipliers}
                        sessions={sessions}
                        gmpSpeeds={gmpSpeeds}
                    />
                ) : (
                    <Admin users={users} gmpSpeeds={gmpSpeeds}/>
                )}
            </main>

            <ToastContainer
                pauseOnHover={false}
                pauseOnFocusLoss={false}
                position="top-right"
                autoClose={1500}
                limit={1}
            />

            <Prestige />
        </div>
    );
}

export default App;
