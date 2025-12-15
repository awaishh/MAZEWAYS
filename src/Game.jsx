// Game view: handles map generation, player movement and scoring
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RotateCcw, Trophy, Footprints, Timer, Lightbulb, MousePointer2, Eye, X, Shield, Zap, LogOut, RefreshCw, MapPin, Radio } from "lucide-react";

import { db } from "./firebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Generate a playable 10x10 level; optional seeded RNG for reproducible daily maps
const generateLevel = (seed = null) => {
  const SIZE = 10;
  let grid = Array(SIZE).fill().map(() => Array(SIZE).fill(1)); // 1 = Wall

  // If a seed (date) is provided, use it. Otherwise random.
  let seedVal = seed ? seed : Math.random() * 10000;
  const random = () => {
    const x = Math.sin(seedVal++) * 10000;
    return x - Math.floor(x);
  };

  const visit = (r, c) => {
    grid[r][c] = 0;
    const randFunc = seed ? random : Math.random;
    const dirs = [[0,2], [0,-2], [2,0], [-2,0]].sort(() => randFunc() - 0.5);
    
    for(let [dr, dc] of dirs) {
      let nr = r+dr, nc = c+dc;
      if(nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && grid[nr][nc] === 1) {
        grid[r+dr/2][c+dc/2] = 0;
        visit(nr, nc);
      }
    }
  };
  visit(0,0);
  
  grid[0][0] = 0; grid[0][1] = 0; grid[1][0] = 0;
  grid[SIZE-1][SIZE-1] = 3; // GOAL
  grid[SIZE-1][SIZE-2] = 0; grid[SIZE-2][SIZE-1] = 0;

  const randFunc = seed ? random : Math.random;
  // Remove random walls to make it playable
  for(let i=0; i<12; i++) {
    const r = Math.floor(randFunc()*(SIZE-2))+1;
    const c = Math.floor(randFunc()*(SIZE-2))+1;
    grid[r][c] = 0;
  }

  // Place Portals
  const placePair = (val) => {
    let count = 0;
    while(count < 2) {
      const r = Math.floor(randFunc() * SIZE);
      const c = Math.floor(randFunc() * SIZE);
      if(grid[r][c] === 0 && !(r===0&&c===0) && !(r===SIZE-1&&c===SIZE-1)) {
        grid[r][c] = val;
        count++;
      }
    }
  };
  placePair(8); // Blue Portal
  placePair(9); // Red Portal

  return grid;
};

  // Pathfinding helper that supports 'breacher' charges (kLimit)
const solveMazeWithK = (grid, startR, startC, kLimit) => {
  const SIZE = 10;
  let queue = [{ r: startR, c: startC, k: kLimit, path: [] }];
  let visited = new Set();
  visited.add(`${startR},${startC},${kLimit}`);

  while(queue.length > 0) {
    let { r, c, k, path } = queue.shift();
    if(grid[r][c] === 3) return path;

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for(let [dr, dc] of dirs) {
      let nr = r + dr, nc = c + dc;
      if(nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
        const cell = grid[nr][nc];
        let newK = k;
        let isValidMove = false;

        if(cell !== 1) isValidMove = true;
        else if(cell === 1 && k > 0) {
          newK = k - 1;
          isValidMove = true;
        }

        if(isValidMove) {
          if(!visited.has(`${nr},${nc},${newK}`)) {
            visited.add(`${nr},${nc},${newK}`);
            queue.push({ r: nr, c: nc, k: newK, path: [...path, {r: nr, c: nc}] });
          }
        }
      }
    }
    
    // Portal Logic for AI
    const val = grid[r][c];
    if(val === 8 || val === 9) {
      for(let tr=0; tr<SIZE; tr++) {
        for(let tc=0; tc<SIZE; tc++) {
          if(grid[tr][tc] === val && (tr !== r || tc !== c)) {
            if(!visited.has(`${tr},${tc},${k}`)) {
              visited.add(`${tr},${tc},${k}`);
              queue.push({ r: tr, c: tc, k: k, path: [...path, {r: tr, c: tc}] });
            }
          }
        }
      }
    }
  }
  return null;
};

export default function Game() {
  const navigate = useNavigate();
  const [grid, setGrid] = useState([]);
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  const [gameMode, setGameMode] = useState('standard');
  const [kLeft, setKLeft] = useState(0);
  const [isCustom, setIsCustom] = useState(false);
  const [customKLimit, setCustomKLimit] = useState(3);
  const [username, setUsername] = useState("Agent");
  const [hintPath, setHintPath] = useState([]);
  const [optimalStandard, setOptimalStandard] = useState(0);
  const [optimalBreacher, setOptimalBreacher] = useState(0);
  const [isViewingBoard, setIsViewingBoard] = useState(false);
  const [steps, setSteps] = useState(0);
  const [seconds, setSeconds] = useState(0); 
  const [gameState, setGameState] = useState("loading");
  const [message, setMessage] = useState("Initializing System...");
  const [sectorId, setSectorId] = useState("SEC-000");

  const saveScore = async (finalEfficiency) => {
    // Do not persist scores for custom (builder) maps
    if (isCustom) return;

    // Detect if this is a Daily or Global run
    const source = localStorage.getItem("gameSource");
    const collectionName = source === "daily" ? "leaderboard_daily" : "leaderboard_global";

    try {
        await addDoc(collection(db, collectionName), {
            username: username,
            efficiency: finalEfficiency,
            steps: steps + 1,
            time: seconds,
            mode: gameMode,
            sectorId: sectorId,
            timestamp: serverTimestamp()
        });
        console.log(`Score saved to ${collectionName}`);
    } catch (e) {
        console.error("Error saving score: ", e);
    }
  };

  useEffect(() => {
    setUsername(localStorage.getItem("username") || "Agent");
    const source = localStorage.getItem("gameSource");
    
    // 1. Builder mode: load custom map and pre-calc optimals
    if (source === "builder") {
        const savedMap = JSON.parse(localStorage.getItem("customMap"));
        const savedK = parseInt(localStorage.getItem("customK")) || 3;
        if (savedMap) {
            setIsCustom(true);
            setCustomKLimit(savedK);
            setGrid(savedMap);
            // Pre-calculate optimals
            const pathStd = solveMazeWithK(savedMap, 0, 0, 0);
            const pathBrch = solveMazeWithK(savedMap, 0, 0, savedK);
            setOptimalStandard(pathStd ? pathStd.length : 0);
            setOptimalBreacher(pathBrch ? pathBrch.length : 0);
            setGameMode('standard');
            setKLeft(0);
            setPlayerPos({ r: 0, c: 0 });
            setSteps(0);
            setSeconds(0);
            setGameState("playing");
            setMessage("CUSTOM MAP LOADED");
            setSectorId("CUSTOM");
            return;
        }
    }
    
    // 2. Daily mode: generate seeded map for today
    if (source === "daily") {
        const today = new Date();
        // Creates a unique number from today's date (e.g., 20251215)
        const dateSeed = parseInt(`${today.getFullYear()}${today.getMonth()+1}${today.getDate()}`);
        handleNewMap('standard', dateSeed); // Use seed
        setSectorId(`DAILY-${today.getDate()}`);
        setMessage("DAILY CHALLENGE ACTIVE");
        return;
    }

    // 3. Standard free play: random generation
    handleNewMap('standard');
  }, []);

  useEffect(() => {
    let timerId;
    if (gameState === "playing") {
      timerId = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(timerId);
  }, [gameState]);

  const handleNewMap = (modeOverride = null, seed = null) => {
    setIsCustom(false);
    const mode = modeOverride || gameMode;
    
    // If random play, make a random Sector ID
    if (!seed) setSectorId(`SEC-${Math.floor(Math.random() * 900) + 100}`);
    
    setMessage("GENERATING SECTOR...");
    
    let validMap = false;
    let newMap = [];
    let pathStd = null;
    let pathBrch = null;
    let attempts = 0; 

    // Attempt to generate a valid, solvable map within a limited number of tries
    while(!validMap && attempts < 200) {
       // If seed exists, add attempts to it so we get consistent but different variations if first fails
       newMap = generateLevel(seed ? seed + attempts : null);
       pathStd = solveMazeWithK(newMap, 0, 0, 0);
       pathBrch = solveMazeWithK(newMap, 0, 0, 3);
       
       // Map is valid if both modes are possible AND it's not too short
       if (pathStd && pathBrch && pathStd.length > 8) validMap = true;
       attempts++;
    }
    
    // Emergency fallback in case generation did not produce a valid map
    if (!validMap) { 
        newMap = generateLevel(); 
        pathStd = solveMazeWithK(newMap, 0, 0, 0);
        pathBrch = solveMazeWithK(newMap, 0, 0, 3);
    }
    
    setGrid(newMap);
    setPlayerPos({ r: 0, c: 0 });
    setOptimalStandard(pathStd ? pathStd.length : 0);
    setOptimalBreacher(pathBrch ? pathBrch.length : 0);
    setKLeft(mode === 'breacher' ? 3 : 0);
    setSteps(0);    
    setSeconds(0);  
    setHintPath([]);
    setIsViewingBoard(false);
    setGameState("playing");
    if (!seed) setMessage(`REACH THE GOLD NODE`);
  };

  // Restart player progress on the current map
  const restartLevel = () => {
      setPlayerPos({ r: 0, c: 0 });
      setSteps(0);
      setSeconds(0);
      setHintPath([]);
      setGameState("playing");
      setMessage("RESTARTED");
      if (gameMode === 'breacher') {
          setKLeft(isCustom ? customKLimit : 3);
      } else {
          setKLeft(0);
      }
  };

  // Switch between standard and breacher modes
  const switchMode = (newMode) => {
      if (newMode === gameMode) return;
      setGameMode(newMode);
      if (isCustom) {
          setKLeft(newMode === 'breacher' ? customKLimit : 0);
          restartLevel();
      } else {
          // If in Daily Mode, we just restart the SAME map (don't generate new one)
          const source = localStorage.getItem("gameSource");
          if (source === "daily") {
              setKLeft(newMode === 'breacher' ? 3 : 0);
              restartLevel(); 
          } else {
              handleNewMap(newMode);
          }
      }
  };

  // Request an AI hint: reveal the next few moves if available
  const showHint = () => {
    if(gameState !== "playing") return;
    setHintPath([]);
    const currentK = gameMode === 'breacher' ? kLeft : 0;
    const path = solveMazeWithK(grid, playerPos.r, playerPos.c, currentK);
    if (path && path.length > 0) {
      const nextMoves = path.slice(0, 5);
      setHintPath(nextMoves);
      setMessage(`AI: 5 STEPS REVEALED`);
    } else {
       setMessage("AI: NO PATH DETECTED");
    }
  };

  // Handle attempted movement; breacher behavior triggered by shift
  const attemptMove = (targetR, targetC, isShiftKey = false) => {
    if (targetR < 0 || targetR >= 10 || targetC < 0 || targetC >= 10) return;
    const targetCell = grid[targetR][targetC];

    // BREACH LOGIC
    if (isShiftKey && gameMode === 'breacher' && targetCell === 1) {
        if (kLeft > 0) {
          const newGrid = grid.map(row => [...row]);
          newGrid[targetR][targetC] = 0;
          setGrid(newGrid);
          setKLeft(kLeft - 1);
          setMessage("WALL BREACHED");
          if(hintPath.length > 0) setHintPath([]);
        } else {
          setMessage("CHARGES DEPLETED");
        }
        return;
    }

    if (targetCell === 1) {
      setMessage(gameMode === 'breacher' ? "HOLD SHIFT TO BREAK" : "BLOCKED");
      return;
    }

    setPlayerPos({ r: targetR, c: targetC });
    setSteps(prev => prev + 1);
    if(hintPath.length > 0) setHintPath([]);

    // WIN LOGIC
    if (targetCell === 3) {
      setGameState("won");
      setMessage("SECTOR COMPLETED");
      const maxK = gameMode === 'breacher' ? (isCustom ? customKLimit : 3) : 0;
      const fullPath = solveMazeWithK(grid, 0, 0, maxK);
      if(fullPath) setHintPath(fullPath);
      
      const opt = getCurrentOptimal();
      const finalSteps = steps + 1;
      const val = Math.round((opt / Math.max(finalSteps, 1)) * 100);
      const finalEff = Math.min(val, 100);
      saveScore(finalEff); 
    }
    
    if (targetCell === 8) setMessage("BLUE WARP");
    if (targetCell === 9) setMessage("RED WARP");
  };

  // Teleport player via portals (if standing on a portal cell)
  const handleTeleport = () => {
    const currentVal = grid[playerPos.r][playerPos.c];
    if (currentVal === 8 || currentVal === 9) {
      for(let r=0; r<10; r++) {
        for(let c=0; c<10; c++) {
          if (grid[r][c] === currentVal && (r !== playerPos.r || c !== playerPos.c)) {
            setPlayerPos({r, c});
            setSteps(prev => prev + 1);
            setMessage("TELEPORTED");
            setHintPath([]);
            return;
          }
        }
      }
    }
  };

  // Keyboard controls for movement and teleport
  useEffect(() => {
    if (gameState !== "playing") return;
    const handleKeyDown = (e) => {
      if (e.key === "Enter") { handleTeleport(); return; }
      let dR = 0, dC = 0;
      if (e.key === "w" || e.key === "ArrowUp") dR = -1;
      if (e.key === "s" || e.key === "ArrowDown") dR = 1;
      if (e.key === "a" || e.key === "ArrowLeft") dC = -1;
      if (e.key === "d" || e.key === "ArrowRight") dC = 1;
      if (dR !== 0 || dC !== 0) attemptMove(playerPos.r + dR, playerPos.c + dC, e.shiftKey);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [playerPos, grid, kLeft, gameState]);

  // Click handler for grid cells: move if adjacent, or teleport if same cell
  const handleCellClick = (r, c, e) => {
    if (gameState !== "playing") return;
    if (r === playerPos.r && c === playerPos.c) { handleTeleport(); return; }
    const dist = Math.abs(r - playerPos.r) + Math.abs(c - playerPos.c);
    if (dist === 1) attemptMove(r, c, e.shiftKey);
  };

  const getCurrentOptimal = () => gameMode === 'breacher' ? optimalBreacher : optimalStandard;
  const getEfficiencyPercent = () => Math.min(Math.round((getCurrentOptimal() / Math.max(steps, 1)) * 100), 100);
  const getEfficiencyColor = () => {
     const percent = getEfficiencyPercent();
     if(percent >= 100) return "bg-green-500";
     if(percent >= 70) return "bg-yellow-500";
     return "bg-red-500";
  }

  if (gameState === "loading") return <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-white font-mono animate-pulse">LOADING SECTOR...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono flex flex-col items-center p-4">
      
      {/* HEADER */}
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 p-4 rounded-xl mb-6 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* INFO */}
        <div className="flex flex-col items-start min-w-[150px]">
          <h1 className="text-xl font-bold text-blue-500 flex items-center gap-2">
              <Radio size={18} /> {sectorId}
          </h1>
          <p className="text-xs text-zinc-400 font-bold mt-1">OP: {username.toUpperCase()}</p>
          <p className="text-xs text-white mt-1 animate-pulse">{message}</p>
        </div>

        {/* MODE SELECTOR */}
        <div className="flex items-center gap-3">
            <div className="flex bg-black p-1 rounded-lg border border-zinc-700">
                <button onClick={() => switchMode('standard')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold transition-all min-w-[80px] justify-center ${gameMode === 'standard' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    <Shield size={12} /> STANDARD
                </button>
                <button onClick={() => switchMode('breacher')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold transition-all min-w-[80px] justify-center ${gameMode === 'breacher' ? 'bg-red-900 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    <Zap size={12} /> BREACHER
                </button>
            </div>
            {gameMode === 'breacher' && (
                 <div className="flex flex-col gap-1 items-end">
                    <span className="text-[8px] text-red-500 font-bold">CHARGES</span>
                    <div className="flex gap-1">
                        {[...Array(isCustom ? customKLimit : 3)].map((_, i) => (
                            <div key={i} className={`h-2 w-3 rounded-sm ${i < kLeft ? "bg-red-500" : "bg-zinc-800 border border-red-900/30"}`} />
                        ))}
                    </div>
                 </div>
            )}
        </div>

        {/* STATS & EXIT */}
        <div className="flex gap-6 items-center">
           <div className="flex flex-col items-center">
             <span className="text-zinc-500 text-[9px] uppercase font-bold"><Timer size={12} className="inline mb-0.5"/> TIME</span>
             <span className="font-mono font-bold text-2xl text-yellow-500 leading-none">{seconds}s</span>
           </div>
           
           <div className="flex flex-col items-end">
             <span className="text-zinc-500 text-[9px] uppercase font-bold"><Footprints size={12} className="inline mb-0.5"/> STEPS</span>
             <span className="font-mono font-bold text-2xl text-white leading-none">{steps}</span>
           </div>
           
           <button onClick={() => navigate('/')} className="ml-2 flex flex-col items-center justify-center bg-red-900/20 hover:bg-red-900/40 text-red-500 p-2 rounded-lg border border-red-900/30 transition-colors">
             <LogOut size={16} />
             <span className="text-[8px] font-bold mt-1">EXIT</span>
           </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-4 px-2">
         <div className="text-xs text-zinc-500 italic">
             {gameMode === 'breacher' ? "SHIFT + CLICK TO BREAK WALLS" : "STANDARD NAVIGATION"}
         </div>
         <div className="flex gap-2">
           <button onClick={showHint} className="text-xs font-bold flex items-center gap-2 text-blue-400 hover:text-white transition-colors border border-blue-900/30 px-3 py-1.5 rounded bg-blue-900/10 hover:bg-blue-900/30">
             <Lightbulb size={14} /> HINT
           </button>
           <button onClick={restartLevel} className="text-xs font-bold flex items-center gap-2 text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded hover:bg-zinc-800">
             <RotateCcw size={14} /> RESET
           </button>
         </div>
      </div>

      {/* GAME GRID */}
      <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-700 shadow-2xl">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 45px)", gap: "5px" }}>
          {grid.map((row, rIndex) =>
            row.map((cellVal, cIndex) => {
              let bg = "bg-zinc-800"; // Floor
              let content = null;
              const isPlayer = rIndex === playerPos.r && cIndex === playerPos.c;
              const isHint = hintPath.some(p => p.r === rIndex && p.c === cIndex);
              
              if (cellVal === 1) bg = "bg-black border border-zinc-800"; // Wall
              if (cellVal === 3) { bg = "bg-yellow-900/30 border border-yellow-600"; content = <Trophy size={20} className="text-yellow-500" />; }
              if (cellVal === 8) { bg = "bg-blue-900/30 border border-blue-600"; content = <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_#3b82f6]"></div>; }
              if (cellVal === 9) { bg = "bg-red-900/30 border border-red-600"; content = <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_#ef4444]"></div>; }

              return (
                <div key={`${rIndex}-${cIndex}`} onClick={(e) => handleCellClick(rIndex, cIndex, e)} className={`w-[45px] h-[45px] rounded-md flex items-center justify-center relative cursor-pointer hover:brightness-125 ${bg}`}>
                   {isHint && !isPlayer && cellVal !== 3 && <div className="absolute w-2 h-2 rounded-full bg-cyan-400 z-40 pointer-events-none animate-pulse" />}
                   <span className="relative z-20 pointer-events-none">{content}</span>
                   {isPlayer && <div className="absolute h-5 w-5 bg-green-500 rounded shadow-[0_0_10px_#22c55e] z-30 pointer-events-none"></div>}
                </div>
              );
            })
          )}
        </div>

        {/* WIN SCREEN */}
        {gameState === "won" && !isViewingBoard && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 rounded-xl">
            <div className="w-full max-w-sm text-center p-6">
               <Trophy className="text-yellow-500 w-12 h-12 mx-auto mb-4" />
               <h2 className="text-3xl font-bold text-white mb-1">COMPLETED!</h2>
               <p className="text-sm text-zinc-500 mb-6">Sector {sectorId}</p>

               <div className="bg-zinc-800 rounded-lg p-5 mb-6 border border-zinc-700">
                  <div className="flex justify-between items-end mb-2 text-sm">
                      <span className="text-zinc-400 font-bold">EFFICIENCY</span>
                      <span className={`font-bold ${getEfficiencyPercent() >= 100 ? 'text-green-400' : 'text-white'}`}>{getEfficiencyPercent()}%</span>
                  </div>
                  <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden">
                      <div className={`h-full ${getEfficiencyColor()}`} style={{width: `${getEfficiencyPercent()}%`}}/>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-3">
                    <button onClick={() => navigate("/leaderboard")} className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded font-bold border border-zinc-700 text-xs">
                        LEADERBOARD
                    </button>
                    <button onClick={() => setIsViewingBoard(true)} className="bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded font-bold border border-zinc-700 text-xs">
                        VIEW PATH
                    </button>
               </div>
               <button onClick={() => handleNewMap()} className="w-full bg-white hover:bg-zinc-200 text-black py-4 rounded font-bold flex items-center justify-center gap-2">
                    NEXT LEVEL <ArrowRight size={18}/>
               </button>
            </div>
          </div>
        )}

        {/* VIEW BOARD BUTTON */}
        {gameState === "won" && isViewingBoard && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50">
                <button onClick={() => setIsViewingBoard(false)} className="bg-black text-white border border-zinc-500 px-6 py-2 rounded-full font-bold text-xs shadow-xl">
                    CLOSE VIEW
                </button>
            </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR - SKIP BUTTON (HIDDEN IF DAILY) */}
      <div className="mt-6 w-full max-w-2xl flex justify-between items-center">
         <div className="text-zinc-500 text-sm font-bold flex gap-6 uppercase tracking-widest">
            <span className="flex items-center gap-2"><MousePointer2 size={16}/> WASD / CLICK</span>
            <span className="flex items-center gap-2"><MapPin size={16}/> {sectorId}</span>
         </div>
         {/* We hide the skip button if it's daily mode, because you can't skip the daily challenge! */}
         {!sectorId.startsWith("DAILY") && (
             <button 
               onClick={() => handleNewMap()} 
               className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold px-5 py-3 rounded-lg flex items-center gap-2 border border-zinc-700 transition-all hover:scale-105"
             >
               <RefreshCw size={16} /> SKIP LEVEL
             </button>
         )}
      </div>

    </div>
  );
}