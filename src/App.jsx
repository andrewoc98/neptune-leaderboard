import './App.css';
import Admin from "./Admin";
import User from "./User";
import { useState } from "react";

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
    </div>
  );
}

export default App;
