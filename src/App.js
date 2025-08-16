import './App.css';
import Admin from "./Admin";
import { Routes, Route } from "react-router-dom";
import User from "./User";
import {useState} from "react";

function App() {
const [admin, setAdmin] = useState(false)
  return (
    <div className="App">
        <button className="tab-button" onClick={() => setAdmin(!admin)} style={{marginTop:'5px', marginLeft:'5px'}}>
            {admin ? "Leaderboard" : "Admin Dashboard"}
        </button>
        {!admin &&
            <User/>}
        {admin &&
            <Admin />}
    </div>
  );
}

export default App;
