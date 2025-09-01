import {useEffect, useState} from "react";
import './App.css';
import SessionModal from "./SessionModal";
import Quote from "./Quote";
import LeaderboardApp from "./LeadboardApp";
import Rules from "./Rules";
import QuoteModal from "./QuoteModal";
import {loadAllDocuments} from "./firebase";
import {getAllSessionHistory} from "./Util"
import ConnectStravaButton from "./ConnectStravaButton";

export default function User() {

  const [openModal, setOpenModal] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [quotes, setQuotes] = useState([])
  const [users, setUsers] = useState({})
  const [workouts, setWorkouts] = useState([])
  const [multipliers, setMultipliers] = useState({})
  const [sessions, setSessions] = useState([])

    useEffect(() => {
        const fetchLazyData = async () => {
            try {
                const lazyData = await loadAllDocuments();
                const allSessions = await getAllSessionHistory();
                setLeaderboard(lazyData[0].entries)
                setMultipliers(lazyData[1])
                setQuotes(lazyData[2].quotes)
                setUsers(lazyData[4])
                setWorkouts({erg:lazyData[5].erg, water:lazyData[5].water})
                setSessions(allSessions)


            } catch (e) {
                console.log("Failed to load page documents", e)
            }
        }

        fetchLazyData()

    }, []);
  const onClose = () => {
    setOpenModal(false)
  }
  const onSubmit = () => {
    setOpenModal(false)
  }




  return (
    <>
      <LeaderboardApp sessions={sessions} multipliers={multipliers} workouts = {workouts} users={users} leaderboard ={leaderboard} setOpenModal={setOpenModal} />
      <Quote quotes={quotes}/>
      <div className="about-stripe">
        <Rules />
          <ConnectStravaButton/>
        <QuoteModal/>

      </div>
      <SessionModal isOpen={openModal} onClose={onClose} onSubmit={onSubmit} setOpen />
    </>);
}