// Main menu: provides navigation to game modes and builder
import { useNavigate } from "react-router-dom";
import { Play, Hammer, LogOut, Terminal, Trophy, Shield, Activity, Calendar } from "lucide-react";
import { auth } from "./firebaseConfig";
import { useEffect, useState } from "react";

export default function Menu() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Agent";
  const [latency, setLatency] = useState(24);

  useEffect(() => {
    const id = setInterval(() => setLatency(Math.floor(Math.random() * 50) + 10), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  // Start daily challenge (seeded) or free play (random)
  const handleStartDaily = () => {
      localStorage.setItem("gameSource", "daily");
      navigate("/game");
  };

  const handleStartFree = () => {
      localStorage.setItem("gameSource", "standard");
      navigate("/game");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono p-6 flex flex-col items-center justify-center">

      {/* Header area: title and quick logout */}
      <div className="w-full max-w-6xl flex justify-between items-center border-b border-zinc-800 pb-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">MAZEWAYS_OS</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
            OPERATOR: <span className="text-blue-500">{username.toUpperCase()}</span>
          </p>
        </div>
        <button onClick={handleLogout} className="text-xs text-red-500 hover:text-white border border-red-900/30 hover:bg-red-600/80 px-4 py-2 rounded transition-all font-bold flex items-center gap-2">
          <LogOut size={14} /> ABORT
        </button>
      </div>

      {/* Main action grid: daily, free play, build, leaderboard */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left column: mission briefing and server status */}
        <div className="lg:col-span-4 flex flex-col">
          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Shield size={120} /></div>
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs mb-6 uppercase tracking-widest">
              <Terminal size={14} /> Mission Briefing
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">SYSTEM ARCHITECTURE</h2>
            
            <div className="space-y-6 text-sm text-zinc-400 leading-relaxed font-mono">
              <p>
                Welcome to <strong className="text-white">MazeWays V4.3</strong>. Your neural link is stable. 
                Global directives are synchronized daily at 00:00 UTC.
              </p>
              <p>
                The <strong className="text-white">Daily Quest</strong> sector generates a unique, seed-locked topology for all operatives. 
                Performance is tracked via the Global Leaderboard, prioritizing path efficiency (Steps) and execution speed (Time).
              </p>
              <p>
                <strong className="text-white">Architect Mode</strong> allows for the construction of complex training simulations. 
                You can now access your <strong className="text-white">Past Builds</strong> directly from the interface to iterate on your designs.
              </p>
              <p>
                <em className="text-zinc-600">WARNING: Breacher charges are limited resources in standard operations. Use extreme caution when dismantling structural firewalls.</em>
              </p>
            </div>

            <div className="mt-auto pt-8">
              <div className="bg-black p-4 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-green-500" />
                  <span className="text-xs font-bold text-white">SERVER STATUS</span>
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {">"} UPLINK ESTABLISHED <br />
                  {">"} LATENCY: {latency}ms <br />
                  {">"} SYNC: AUTO <br />
                  {">"} DATABASE: WRITE_ACCESS_OK
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (L SHAPE - STACKED) */}
        <div className="lg:col-span-8 flex flex-col gap-4 h-full">

            {/* Daily quest button */}
            <button onClick={handleStartDaily} className="w-full bg-black border border-zinc-800 hover:border-cyan-500 p-8 rounded-xl text-left transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] group flex justify-between items-center">
                <div>
                  <h3 className="text-4xl font-mono font-bold text-white group-hover:text-cyan-500 transition-colors">DAILY QUEST</h3>
                  <p className="text-zinc-500 text-xs font-mono font-bold uppercase tracking-widest mt-1">Global Ranking • One Map • 24 Hours</p>
                </div>
                <Calendar size={48} className="text-zinc-800 group-hover:text-cyan-500 transition-colors" />
            </button>

            {/* Free play button */}
            <button onClick={handleStartFree} className="w-full bg-black border border-zinc-800 hover:border-blue-600 p-8 rounded-xl text-left transition-all hover:shadow-[0_0_30px_rgba(37,99,235,0.2)] group flex justify-between items-center">
                <div>
                  <h3 className="text-4xl font-mono font-bold text-white group-hover:text-blue-500 transition-colors">FREE PLAY</h3>
                  <p className="text-zinc-500 text-xs font-mono font-bold uppercase tracking-widest mt-1">Practice Mode • Random Generation</p>
                </div>
                <Play size={48} className="text-zinc-800 group-hover:text-blue-500 transition-colors" />
            </button>

            {/* Architect/Build button */}
            <button onClick={() => navigate("/builder")} className="w-full bg-black border border-zinc-800 hover:border-purple-600 p-8 rounded-xl text-left transition-all hover:shadow-[0_0_30px_rgba(147,51,234,0.2)] group flex justify-between items-center">
                <div>
                  <h3 className="text-4xl font-mono font-bold text-white group-hover:text-purple-500 transition-colors">BUILD</h3>
                  <p className="text-zinc-500 text-xs font-mono font-bold uppercase tracking-widest mt-1">Architect Mode • Create & Save</p>
                </div>
                <Hammer size={48} className="text-zinc-800 group-hover:text-purple-500 transition-colors" />
            </button>

            {/* Leaderboard CTA */}
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                    
                    <h2 className="text-2xl font-bold text-white tracking-wide font-mono">HALL OF FAME</h2>
                </div>
                <p className="text-sm text-zinc-400 leading-7 mb-6 max-w-2xl font-mono">
                    Access the global neural network to compare your Daily Quest performance. 
                    Rankings are sorted by Steps (Lowest), then Time, then Wall Breaks.
                    Data resets every 24 hours with the new cycle.
                </p>
                <div>
                    <button onClick={() => navigate("/leaderboard")} className="bg-black border border-zinc-700 hover:border-yellow-500 text-white px-8 py-4 rounded-lg text-xs font-bold uppercase tracking-widest transition-all font-mono">
                        View Daily Rankings
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}