import './App.css';
import Admin from "./Admin";
import User from "./User";
import {useEffect, useState} from "react";
import { ToastContainer } from 'react-toastify';
import { Prestige } from './Prestige';
import {loadAllDocuments} from "./firebase";
import {getAllSessionHistory} from "./Util";

function App() {

  const [admin, setAdmin] = useState(false);
  const [leaderboard, setLeaderboard] = useState([])
  const [quotes, setQuotes] = useState([])
  const [users, setUsers] = useState({})
  const [workouts, setWorkouts] = useState([])
  const [multipliers, setMultipliers] = useState({})
  const [sessions, setSessions] = useState([])
  const [gmpSpeeds, setGmpSpeeds] = useState({})

    useEffect(() => {
        const fetchLazyData = async () => {
            try {
                const lazyData = await loadAllDocuments();
                const allSessions = await getAllSessionHistory();
                console.log(lazyData)
                setLeaderboard(lazyData[1].entries)
                setMultipliers(lazyData[2])
                setQuotes(lazyData[3].quotes)
                setUsers(lazyData[5])
                setWorkouts({erg:lazyData[6].erg.entries, water:lazyData[6].water.entries})
                setSessions(allSessions)
                setGmpSpeeds(lazyData[0].speeds)

            } catch (e) {
                console.log("Failed to load page documents", e)
            }
        }
        fetchLazyData()
    }, []);

  useEffect(()=>{
      console.log(workouts)
      console.log(users)
  },[workouts,users])

  return (
    <div className="App">
      <header style={{ padding: "1rem" }}>
        <button
          className="tab-button"
          onClick={() => setAdmin(!admin)}
        >
          {admin ? "View Leaderboard" : "Admin Dashboard"}
        </button>
      </header>
      <main className="container">
        {!admin && <User
                        leaderboard={leaderboard}
                         quotes={quotes}
                         users={users}
                         workouts={workouts}
                         multipliers={multipliers}
                         sessions={sessions}
                         gmpSpeeds={gmpSpeeds}/>}
        {admin && <Admin users={users} gmpSpeeds={gmpSpeeds}/>}
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
