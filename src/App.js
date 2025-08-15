import './App.css';
import Admin from "./Admin";
import { Routes, Route } from "react-router-dom";
import User from "./User";

function App() {

  return (
    <div className="App">
        <Routes>
            <Route path='/' element={<User/>}/>
            <Route path="/admin" element={<Admin />}/>
        </Routes>
    </div>
  );
}

export default App;
