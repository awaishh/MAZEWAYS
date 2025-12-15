import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebaseConfig"; 
import { ArrowRight, Disc, Activity } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [customName, setCustomName] = useState(""); 
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); 
    if (!customName.trim()) {
      setError("IDENTITY REQUIRED. ENTER ALIAS.");
      return;
    }
    setLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      localStorage.setItem("username", customName); 
      
      // *** REDIRECT TO MENU ***
      navigate("/menu"); 
      
    } catch (err) {
      console.error(err);
      setError("AUTHENTICATION FAILED.");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 font-mono overflow-hidden text-white">
      
      {/* LEFT SIDE */}
      <div className="flex w-[70%] bg-black relative overflow-hidden items-center justify-center border-r border-zinc-800">
        <div className="absolute inset-0 opacity-20">
           <MazePattern />
        </div>
        <div className="relative z-10 text-center">
           <h1 className="text-8xl md:text-9xl font-black tracking-tighter leading-none select-none">
             MAZE<br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">WAYS</span>
           </h1>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-[30%] min-w-[350px] bg-zinc-900 flex flex-col justify-center px-10 relative shadow-2xl z-20">
        
        <div className="absolute top-10 left-10 flex items-center gap-2 text-xs text-zinc-500 font-bold tracking-widest">
           <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
           SECURE_GATEWAY
        </div>

        <div className="space-y-8">
           <div>
             <h2 className="text-4xl font-bold text-white mb-2">Who are you?</h2>
             <p className="text-zinc-400 text-sm">Identify yourself to enter the simulation.</p>
           </div>

           <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                 <input
                   type="text"
                   placeholder="ENTER ALIAS..."
                   value={customName}
                   onChange={(e) => setCustomName(e.target.value)}
                   className="w-full bg-black border border-zinc-700 focus:border-blue-500 text-white p-4 pl-4 rounded-lg outline-none font-bold tracking-wider transition-all placeholder:text-zinc-700"
                   autoFocus
                 />
                 <div className="absolute right-4 top-4 text-zinc-600">
                    <Activity size={20} />
                 </div>
              </div>

              <div>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  >
                    {loading ? "..." : "JACK IN"} 
                    {!loading && <ArrowRight size={20} />}
                  </button>
              </div>

              {error && (
                <div className="text-red-500 text-xs font-bold text-center border border-red-500/30 p-2 rounded bg-red-500/5">
                   {error}
                </div>
              )}
           </form>
        </div>

        <div className="absolute bottom-10 left-10 flex items-center gap-2 text-zinc-700 text-[10px]">
           <Disc size={12} className="animate-spin-slow" />
           SERVER_SYNC_ACTIVE
        </div>

      </div>
    </div>
  );
}

function MazePattern() {
  const [cells, setCells] = useState([]);
  useEffect(() => {
    setCells(Array.from({ length: 100 }).map((_, i) => ({
      id: i,
      hasRight: Math.random() > 0.5,
      hasBottom: Math.random() > 0.5,
      opacity: Math.random() * 0.5 + 0.1
    })));
  }, []);
  return (
    <div className="w-full h-full grid grid-cols-10 grid-rows-10 gap-0 transform scale-150 rotate-12">
      {cells.map((cell) => (
        <div key={cell.id} className="border-zinc-800"
          style={{
            borderRightWidth: cell.hasRight ? '2px' : '0',
            borderBottomWidth: cell.hasBottom ? '2px' : '0',
            borderColor: `rgba(37, 99, 235, ${cell.opacity})` 
          }}
        />
      ))}
    </div>
  );
}