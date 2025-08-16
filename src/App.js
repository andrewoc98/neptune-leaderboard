import './App.css';
import Admin from "./Admin";
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
