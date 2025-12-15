// App routing entry: maps URL paths to top-level views
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Menu from "./Menu";
import Game from "./Game";
import Builder from "./Builder";
import Leaderboard from "./Leaderboard";

export default function App() {
  return (
    <BrowserRouter>
      {/* Route definitions for main application views */}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/game" element={<Game />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}