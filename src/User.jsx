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

export default function User({leaderboard, quotes, users, workouts, multipliers, sessions, gmpSpeeds}) {

  const [openModal, setOpenModal] = useState(false)

  const onClose = () => {
    setOpenModal(false)
  }
  const onSubmit = () => {
    setOpenModal(false)
  }




  return (
    <>
      <LeaderboardApp sessions={sessions}
                      multipliers={multipliers}
                      workouts = {workouts}
                      users={users}
                      leaderboard ={leaderboard}
                      setOpenModal={setOpenModal}
                      gmpSpeeds={gmpSpeeds}/>
      <Quote quotes={quotes}/>
      <div className="about-stripe">
        <Rules />
        <QuoteModal/>

      </div>
      <SessionModal isOpen={openModal} onClose={onClose} onSubmit={onSubmit} setOpen />
    </>);
}