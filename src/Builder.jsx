// Builder view: lets the user design and save custom 10x10 maps
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Trash2, Eraser, Square, Trophy, Circle, MousePointer2, Send, FolderOpen, X, Clock } from "lucide-react";
import { db } from "./firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Builder() {
  const navigate = useNavigate();
    const SIZE = 10;

    // Grid values: 0=Floor, 1=Wall, 3=Goal, 8=BluePortal, 9=RedPortal
    const [grid, setGrid] = useState(Array(SIZE).fill().map(() => Array(SIZE).fill(0)));
  const [selectedTool, setSelectedTool] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
    // Saved maps and UI toggles
  const [savedMaps, setSavedMaps] = useState([]);
  const [showLoadMenu, setShowLoadMenu] = useState(false);

    // Tools palette available to the builder
  const tools = [
    { id: 1, label: "WALL", icon: <Square size={14} className="fill-current"/>, color: "text-zinc-400", bg: "bg-black border-zinc-700" },
    { id: 0, label: "FLOOR", icon: <Eraser size={14} />, color: "text-zinc-500", bg: "bg-zinc-800 border-zinc-700" },
    { id: 3, label: "GOAL", icon: <Trophy size={14} />, color: "text-yellow-500", bg: "bg-yellow-900/20 border-yellow-600/50" },
    { id: 8, label: "WARP A", icon: <Circle size={14} />, color: "text-blue-500", bg: "bg-blue-900/20 border-blue-600/50" },
    { id: 9, label: "WARP B", icon: <Circle size={14} />, color: "text-red-500", bg: "bg-red-900/20 border-red-600/50" },
  ];

  useEffect(() => {
        // Load saved build library and current draft from localStorage
    const storedMaps = JSON.parse(localStorage.getItem("myBuilds") || "[]");
    setSavedMaps(storedMaps);

        // Restore working draft if present
    const currentDraft = localStorage.getItem("customMap");
    if (currentDraft) {
        try { setGrid(JSON.parse(currentDraft)); } catch(e) {}
    }
  }, []);

  const handleCellClick = (r, c) => {
    if (r === 0 && c === 0) return; 
    const newGrid = grid.map(row => [...row]);
    if (newGrid[r][c] === selectedTool && selectedTool !== 0) {
        newGrid[r][c] = 0;
    } else {
        newGrid[r][c] = selectedTool;
    }
    setGrid(newGrid);
        // Persist current draft so progress isn't lost on reload
    localStorage.setItem("customMap", JSON.stringify(newGrid));
  };

  const clearGrid = () => {
    setGrid(Array(SIZE).fill().map(() => Array(SIZE).fill(0)));
  };

  const saveToLibrary = () => {
      const name = prompt("Name your Sector:", `Sector-${Math.floor(Math.random()*1000)}`);
      if (!name) return;

      const newMapEntry = {
          id: Date.now(),
          name: name,
          data: grid,
          date: new Date().toLocaleDateString()
      };

      const updatedList = [newMapEntry, ...savedMaps];
      setSavedMaps(updatedList);
      localStorage.setItem("myBuilds", JSON.stringify(updatedList));
      alert("Sector saved to Library!");
  };

  const loadMapFromLibrary = (mapData) => {
      setGrid(mapData);
      localStorage.setItem("customMap", JSON.stringify(mapData)); // Set as current
      setShowLoadMenu(false);
  };

  const deleteFromLibrary = (id, e) => {
      e.stopPropagation();
      const updatedList = savedMaps.filter(m => m.id !== id);
      setSavedMaps(updatedList);
      localStorage.setItem("myBuilds", JSON.stringify(updatedList));
  };

  const saveAndPlay = () => {
    const hasTrophy = grid.some(row => row.includes(3));
    if (!hasTrophy) {
        alert("ERROR: SIMULATION REQUIRES A GOAL (TROPHY)");
        return;
    }
    localStorage.setItem("customMap", JSON.stringify(grid));
    localStorage.setItem("gameSource", "builder");
    navigate("/game");
  };

  const handleFakeSubmit = async () => {
    const hasTrophy = grid.some(row => row.includes(3));
    if (!hasTrophy) { alert("Cannot submit incomplete sector."); return; }
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
        const username = localStorage.getItem("username") || "Agent";
        await addDoc(collection(db, "feature_requests"), {
            builder: username,
            mapData: JSON.stringify(grid),
            timestamp: serverTimestamp(),
            status: "pending_review",
            priority: "normal"
        });
        alert("Sector sent to Global Moderators for review. Status: PENDING");
    } catch (error) {
        console.log("Packet sent"); 
        alert("Request queued for transmission.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono flex flex-col items-center p-4 relative">
      
    {/* Header and tools bar */}
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-col items-start min-w-[150px]">
          <h1 className="text-xl font-bold text-purple-500 flex items-center gap-2">
              ARCHITECT MODE
          </h1>
          <p className="text-xs text-zinc-400 font-bold mt-1">DESIGN YOUR SECTOR</p>
        </div>

        {/* Tools palette (select a tile type to paint) */}
        <div className="flex gap-2 bg-black p-1.5 rounded-lg border border-zinc-700 overflow-x-auto max-w-full scrollbar-hide">
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold transition-all border whitespace-nowrap ${
                        selectedTool === tool.id 
                        ? "bg-zinc-700 text-white border-zinc-500 shadow-lg scale-105" 
                        : "bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                    }`}
                >
                    <span className={tool.color}>{tool.icon}</span>
                    <span className="hidden sm:inline">{tool.label}</span>
                </button>
            ))}
        </div>
      </div>

    {/* Editable grid canvas */}
      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 shadow-2xl relative mb-4">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${SIZE}, 45px)`, gap: "5px" }}>
          {grid.map((row, rIndex) =>
            row.map((cellVal, cIndex) => {
              let bg = "bg-zinc-800"; 
              let content = null;
              const isStart = rIndex === 0 && cIndex === 0;

              if (cellVal === 1) bg = "bg-black border border-zinc-800"; 
              if (cellVal === 3) { bg = "bg-yellow-900/30 border border-yellow-600"; content = <Trophy size={20} className="text-yellow-500" />; }
              if (cellVal === 8) { bg = "bg-blue-900/30 border border-blue-600"; content = <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>; }
              if (cellVal === 9) { bg = "bg-red-900/30 border border-red-600"; content = <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]"></div>; }

              if (isStart) content = <div className="h-5 w-5 bg-green-500 rounded shadow-[0_0_10px_#22c55e]"></div>;

              return (
                <div
                  key={`${rIndex}-${cIndex}`}
                  onClick={() => handleCellClick(rIndex, cIndex)}
                  className={`w-[45px] h-[45px] rounded-md flex items-center justify-center relative cursor-pointer hover:brightness-125 transition-colors ${bg}`}
                >
                   <span className="relative z-20 pointer-events-none">{content}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

    {/* Footer action bar: save, play, clear, load */}
      <div className="w-full max-w-2xl flex flex-col gap-4">
         <div className="text-zinc-500 text-xs font-bold flex gap-6 uppercase tracking-widest justify-center">
            <span className="flex items-center gap-2"><MousePointer2 size={14}/> CLICK TO PLACE</span>
            <span className="flex items-center gap-2"><Square size={12} className="fill-green-500 text-green-500"/> START IS LOCKED</span>
         </div>

         {/* Primary action bar */}
         <div className="flex flex-col md:flex-row justify-between items-center w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-lg gap-3">
             <div className="flex gap-2 order-3 md:order-1">
                <button onClick={() => navigate("/menu")} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-bold px-2">
                    <ArrowLeft size={14} /> EXIT
                </button>
                {/* NEW LOAD BUTTON */}
                <button onClick={() => setShowLoadMenu(true)} className="flex items-center gap-2 text-blue-400 bg-blue-900/20 hover:bg-blue-900/40 border border-blue-900/50 px-3 py-1.5 rounded text-xs font-bold transition-all">
                    <FolderOpen size={14} /> LOAD ({savedMaps.length})
                </button>
             </div>

             {/* Submit feature request (simulated) */}
             <button 
                onClick={handleFakeSubmit} 
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-xs transition-all border order-1 md:order-2 w-full md:w-auto justify-center
                    ${isSubmitting ? "bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed" : "bg-cyan-900/20 text-cyan-400 border-cyan-800/50 hover:bg-cyan-900/40 hover:text-cyan-300"}`}
             >
                {isSubmitting ? "TRANSMITTING..." : <><Send size={14} /> REQUEST FEATURE</>}
             </button>

             <div className="flex gap-3 order-2 md:order-3 w-full md:w-auto justify-end">
                <button onClick={clearGrid} className="p-2 text-red-500 bg-red-900/10 border border-red-900/30 rounded hover:bg-red-900/30 transition-colors" title="Clear All">
                    <Trash2 size={18} />
                </button>
                {/* Save current design to local library */}
                <button onClick={saveToLibrary} className="p-2 text-zinc-300 bg-zinc-800 border border-zinc-700 rounded hover:bg-zinc-700 transition-colors" title="Save to Library">
                    <Save size={18} />
                </button>
                {/* PLAY BUTTON */}
                <button onClick={saveAndPlay} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded font-bold text-xs transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                    PLAY
                </button>
             </div>
         </div>
      </div>

      {/* --- LOAD MAPS MODAL (POPUP) --- */}
      {showLoadMenu && (
        <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FolderOpen className="text-blue-500"/> SAVED SECTORS
                    </h2>
                    <button onClick={() => setShowLoadMenu(false)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {savedMaps.length === 0 ? (
                        <div className="text-zinc-600 text-center py-8 text-sm italic">NO SAVED SECTORS FOUND</div>
                    ) : (
                        savedMaps.map((map) => (
                            <div key={map.id} onClick={() => loadMapFromLibrary(map.data)} className="bg-black border border-zinc-800 p-3 rounded-lg flex justify-between items-center hover:border-blue-500 cursor-pointer group transition-all">
                                <div>
                                    <div className="font-bold text-sm text-zinc-300 group-hover:text-white">{map.name}</div>
                                    <div className="text-[10px] text-zinc-600 flex items-center gap-1 mt-1">
                                        <Clock size={10}/> {map.date}
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => deleteFromLibrary(map.id, e)} 
                                    className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-900/20 rounded transition-colors"
                                >
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
}