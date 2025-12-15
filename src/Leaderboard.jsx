import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebaseConfig"; 
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { Trophy, ArrowLeft, Loader2, Medal, Globe, Calendar } from "lucide-react";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("global"); // 'global' or 'daily'

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      setScores([]);
      try {
        // Determine collection based on toggle
        const collectionName = view === "daily" ? "leaderboard_daily" : "leaderboard_global";
        
        const q = query(collection(db, collectionName), orderBy("efficiency", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setScores(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, [view]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-mono p-4 flex flex-col items-center">
      
      <div className="w-full max-w-2xl mb-6 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold">
            <ArrowLeft size={16} /> BACK TO MENU
        </button>
        <h1 className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
            <Trophy size={24} /> DATABASE
        </h1>
      </div>

      {/* TOGGLES */}
      <div className="w-full max-w-2xl flex gap-4 mb-4">
          <button 
             onClick={() => setView('global')}
             className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border ${view === 'global' ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
          >
             <Globe size={16} /> GLOBAL RECORDS
          </button>
          <button 
             onClick={() => setView('daily')}
             className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all border ${view === 'daily' ? 'bg-blue-900/30 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400'}`}
          >
             <Calendar size={16} /> DAILY CHALLENGE
          </button>
      </div>

      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-4 bg-zinc-950 p-4 border-b border-zinc-800 text-xs uppercase text-zinc-500 font-bold tracking-wider">
            <span>Rank</span>
            <span className="col-span-2">Operator / Sector</span>
            <span className="text-right">Efficiency</span>
        </div>

        {loading ? (
            <div className="p-10 flex justify-center text-zinc-500">
                <Loader2 className="animate-spin" />
            </div>
        ) : (
            <div className="divide-y divide-zinc-800/50">
                {scores.length === 0 ? (
                    <div className="p-8 text-center text-zinc-600 font-bold">NO DATA FOUND FOR THIS FREQUENCY.</div>
                ) : scores.map((score, index) => (
                    <div key={score.id} className="grid grid-cols-4 p-4 hover:bg-zinc-800/50 transition-colors items-center">
                        <div className="flex items-center gap-3 font-bold">
                            {index === 0 && <Medal size={16} className="text-yellow-500" />}
                            {index === 1 && <Medal size={16} className="text-zinc-400" />}
                            {index === 2 && <Medal size={16} className="text-orange-700" />}
                            <span className={index < 3 ? "text-white" : "text-zinc-500"}>#{index + 1}</span>
                        </div>
                        <div className="col-span-2 flex flex-col">
                            <div className="font-bold text-blue-400 flex items-center gap-2">
                                {score.username}
                                <span className={`text-[9px] px-1 py-0.5 rounded border ${score.mode === 'breacher' ? 'text-red-400 border-red-900/50 bg-red-900/20' : 'text-zinc-400 border-zinc-700 bg-zinc-800'}`}>
                                    {score.mode === 'breacher' ? 'BRCH' : 'STD'}
                                </span>
                            </div>
                            <span className="text-[10px] text-zinc-600 mt-0.5 font-bold">{score.sectorId || "UNKNOWN"}</span>
                        </div>
                        <div className="text-right">
                             <div className="font-bold text-green-500">{score.efficiency}%</div>
                             <div className="text-[10px] text-zinc-600">{score.time}s</div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}