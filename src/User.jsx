import {useEffect, useState} from "react";
import './App.css';
import SessionModal from "./SessionModal";
import Quote from "./Quote";
import LeaderboardApp from "./LeadboardApp";
import Rules from "./Rules";
import QuoteModal from "./QuoteModal";
import {loadAllDocuments} from "./firebase";

export default function User() {

  const [openModal, setOpenModal] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [quotes, setQuotes] = useState([])
  const [users, setUsers] = useState({})
  const [workouts, setWorkouts] = useState([])

    useEffect(() => {
        const fetchLazyData = async () => {
            try {
                const lazyData = await loadAllDocuments();
                setLeaderboard(lazyData[0].entries)
                setQuotes(lazyData[2].quotes)
                setUsers(lazyData[3])
                setWorkouts({erg:lazyData[4].erg, water:lazyData[4].water})
                console.log(lazyData)
                console.log(workouts)
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
      <LeaderboardApp workouts = {workouts} users={users} leaderboard ={leaderboard} setOpenModal={setOpenModal} />
      <Quote quotes={quotes}/>
      <div className="about-stripe">
        <Rules />
        <QuoteModal/>
      </div>
      <SessionModal isOpen={openModal} onClose={onClose} onSubmit={onSubmit} setOpen />
    </>);
}