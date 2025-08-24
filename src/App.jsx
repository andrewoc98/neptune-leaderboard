import './App.css';
import Admin from "./Admin";
import User from "./User";
import { useState } from "react";
import { ToastContainer } from 'react-toastify';
import { Prestige } from './Prestige';

function App() {
  const [admin, setAdmin] = useState(false);

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
        {!admin && <User />}
        {admin && <Admin />}
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
