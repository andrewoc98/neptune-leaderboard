import {useState} from "react";
import './App.css';
import SessionModal from "./SessionModal";
import Quote from "./Quote";
import LeaderboardApp from "./LeadboardApp";

export default function User() {

    const [openModal,setOpenModal] = useState(false)
    const onClose = () =>{
        setOpenModal(false)
    }
    const onSubmit = () =>{
        setOpenModal(false)
    }
    return(
    <>
        <LeaderboardApp setOpenModal={setOpenModal}/>
          <Quote />
          <SessionModal isOpen={openModal} onClose={onClose} onSubmit={onSubmit} setOpen/>
    </>);
}