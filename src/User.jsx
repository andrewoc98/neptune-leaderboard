import { useState } from "react";
import './App.css';
import SessionModal from "./SessionModal";
import Quote from "./Quote";
import LeaderboardApp from "./LeadboardApp";
import Rules from "./Rules";
import QuoteModal from "./QuoteModal";

export default function User() {

  const [openModal, setOpenModal] = useState(false)
  const onClose = () => {
    setOpenModal(false)
  }
  const onSubmit = () => {
    setOpenModal(false)
  }


  return (
    <>
      <LeaderboardApp setOpenModal={setOpenModal} />
      <Quote />
      <div className="about-stripe">
        <Rules />
        <QuoteModal/>
      </div>
      <SessionModal isOpen={openModal} onClose={onClose} onSubmit={onSubmit} setOpen />
    </>);
}