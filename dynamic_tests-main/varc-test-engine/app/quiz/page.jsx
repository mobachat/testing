// dynamic_tests-main (1)/dynamic_tests-main/varc-test-engine/app/quiz/page.jsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Swords, ArrowRight, Home, Users, Globe, Play, Server, Loader2, Activity, Settings, Search, X, Mic, MicOff, Layers } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import { getAvailableTests } from '../../lib/githubFetcher';

export default function QuizLobby() {
  const router = useRouter();
  const [hostName, setHostName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [activeRooms, setActiveRooms] = useState([]);
  const [isFetchingIp, setIsFetchingIp] = useState(true);

  // Host Configuration Modal State
  const [showConfig, setShowConfig] = useState(false);
  const [availableTests, setAvailableTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [quizMode, setQuizMode] = useState("random"); // 'random' or 'custom'
  const [questionCount, setQuestionCount] = useState(5);
  const [enableMic, setEnableMic] = useState(true);

  // Fetch Public IP
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
          setIpAddress(data.ip);
          setIsFetchingIp(false);
      })
      .catch(() => {
          setIpAddress(`0.0.0.0-${Math.floor(Math.random() * 1000)}`);
          setIsFetchingIp(false);
      });
  }, []);

  // Fetch available test modules for the selector
  useEffect(() => {
    getAvailableTests().then(setAvailableTests);
  }, []);

  // Listen to Global Directory of Rooms
  useEffect(() => {
    const channel = supabase.channel('global-directory');
    
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const rooms = [];
      for (const id in state) {
        const presenceData = state[id][0];
        if (presenceData && presenceData.isHost) {
           rooms.push(presenceData);
        }
      }
      setActiveRooms(rooms);
    }).subscribe();

    return () => {
       // Safe, standard cleanup. Destroys the local channel listener cleanly.
       supabase.removeChannel(channel);
    };
  }, []);

  const handleHostClick = () => {
    if (!hostName.trim()) return alert("Please enter your name to host a quiz.");
    setShowConfig(true);
  };

  const handleLaunchServer = () => {
    const sanitizedName = hostName.trim().replace(/[^a-zA-Z0-9]/g, '');
    const sanitizedIp = ipAddress.replace(/[^a-zA-Z0-9]/g, '-');
    const roomId = `${sanitizedName}-${sanitizedIp}`.toUpperCase();
    
    sessionStorage.setItem(`arena_config_${roomId}`, JSON.stringify({
        mode: quizMode,
        count: questionCount,
        tests: selectedTests,
        enableMic: enableMic
    }));

    router.push(`/quiz/multi/${roomId}`);
  };

  const handleJoinMulti = (roomId) => {
    router.push(`/quiz/multi/${roomId}`);
  };

  const grouped = availableTests.reduce((acc, test) => {
    if (!acc[test.folder]) acc[test.folder] = [];
    acc[test.folder].push(test);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-6 items-center justify-center relative">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
        <Home size={18}/> Back to Home
      </Link>
      
      {showConfig && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><Settings size={20}/></div>
                  <div>
                     <h2 className="text-xl font-extrabold text-slate-800">Server Configuration</h2>
                     <p className="text-xs font-semibold text-slate-500">Customize your live arena before broadcasting</p>
                  </div>
               </div>
               <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
               <div className="w-full md:w-1/3 bg-slate-50/50 border-r border-slate-100 p-6 overflow-y-auto scrollbar-thin">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Core Rules</h3>
                  
                  <div className="space-y-3 mb-8">
                     <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${quizMode === 'random' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-200'}`}>
                        <input type="radio" name="mode" checked={quizMode === 'random'} onChange={() => setQuizMode('random')} className="mt-1" />
                        <div>
                           <div className="font-bold text-slate-800">Randomized Mix</div>
                           <div className="text-xs text-slate-500 mt-1">Engine picks random passages holistically.</div>
                        </div>
                     </label>
                     
                     <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${quizMode === 'custom' ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-200'}`}>
                        <input type="radio" name="mode" checked={quizMode === 'custom'} onChange={() => setQuizMode('custom')} className="mt-1" />
                        <div>
                           <div className="font-bold text-slate-800">Specific Modules</div>
                           <div className="text-xs text-slate-500 mt-1">Manually select specific question datasets.</div>
                        </div>
                     </label>
                  </div>

                  {quizMode === 'random' && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Number of Passages: {questionCount}</label>
                       <input type="range" min="1" max="20" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))} className="w-full accent-indigo-600" />
                    </div>
                  )}

                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Live Classroom</h3>
                  <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                           {enableMic ? <Mic size={16} className="text-emerald-500"/> : <MicOff size={16} className="text-rose-500"/>}
                           Peer Microphones
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={enableMic} onChange={e => setEnableMic(e.target.checked)} />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                     </div>
                     <p className="text-[10px] text-slate-500 leading-tight">If enabled, joining players must grant mic access. The quiz master will hear all players.</p>
                  </div>
               </div>

               <div className={`w-full md:w-2/3 flex flex-col bg-white transition-opacity duration-300 ${quizMode === 'random' ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  <div className="p-4 border-b border-slate-100">
                     <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
                        <Search size={16} className="text-slate-400" />
                        <input 
                           type="text" 
                           placeholder="Search modules..." 
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           className="bg-transparent outline-none w-full text-sm font-medium text-slate-700"
                        />
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-6">
                     {Object.entries(grouped).map(([folder, tests]) => {
                        const filtered = tests.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
                        if (filtered.length === 0) return null;
                        return (
                           <div key={folder}>
                              <h4 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                 <Layers size={14}/> {folder.replace(/\//g, ' / ')}
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                 {filtered.map(test => {
                                    const isSelected = selectedTests.some(st => st.filename === test.filename);
                                    return (
                                       <label key={test.filename} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-indigo-500 bg-indigo-50/30 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                                          <input 
                                             type="checkbox" 
                                             checked={isSelected}
                                             onChange={(e) => {
                                                if (e.target.checked) setSelectedTests([...selectedTests, test]);
                                                else setSelectedTests(selectedTests.filter(st => st.filename !== test.filename));
                                             }}
                                             className="mt-0.5 accent-indigo-600"
                                          />
                                          <div className="min-w-0 flex-1">
                                             <div className="text-sm font-bold text-slate-800 truncate">{test.name}</div>
                                          </div>
                                       </label>
                                    )
                                 })}
                              </div>
                           </div>
                        )
                     })}
                  </div>
               </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
               <div className="text-sm font-semibold text-slate-500">
                  {quizMode === 'custom' ? (
                     <span><span className="font-bold text-indigo-600">{selectedTests.length}</span> modules selected</span>
                  ) : (
                     <span>Random mix of <span className="font-bold text-indigo-600">{questionCount}</span> passages</span>
                  )}
               </div>
               <button 
                  onClick={handleLaunchServer}
                  disabled={quizMode === 'custom' && selectedTests.length === 0}
                  className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl shadow-md hover:bg-indigo-500 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
               >
                  Launch Server <Play size={16} fill="currentColor"/>
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl w-full bg-white rounded-[3rem] p-10 md:p-12 shadow-xl border border-slate-200/60 text-center relative overflow-hidden flex flex-col lg:flex-row gap-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50/50 rounded-full blur-3xl -z-10 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="flex-1 text-left z-10 border-b lg:border-b-0 lg:border-r border-slate-200/60 pb-10 lg:pb-0 lg:pr-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 mb-6">
            <Server size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Quiz Protocol</h1>
          <p className="text-slate-500 font-medium text-lg mb-10 leading-relaxed">
            Host a new arena or join an active session. Hosting bounds the room instance to your current network IP.
          </p>

          <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl shadow-inner">
             <h3 className="text-xl font-extrabold text-slate-800 mb-2">Initialize Local Host</h3>
             <p className="text-sm text-slate-500 font-medium mb-6">Your room ID will be securely generated from your connection data.</p>
             
             <div className="space-y-4">
                <div className="relative">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 block">Your Name / Alias</label>
                  <input 
                     type="text" 
                     placeholder="E.g., JohnDoe"
                     value={hostName}
                     onChange={e => setHostName(e.target.value)}
                     className="w-full px-4 py-4 rounded-xl border border-slate-200 bg-white shadow-sm font-bold text-slate-800 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                   />
                </div>

                <div className="relative">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2 block"><Globe size={12}/> Network IP Bound</label>
                  <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-mono text-sm flex items-center">
                    {isFetchingIp ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : ipAddress}
                  </div>
                </div>

                <button 
                   onClick={handleHostClick}
                   disabled={!hostName.trim() || isFetchingIp}
                  className="w-full mt-4 bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Settings size={18}/> Configure & Broadcast Server <ArrowRight size={18}/>
                </button>
             </div>
          </div>
        </div>

        <div className="flex-[1.2] text-left z-10 flex flex-col h-full min-h-[400px]">
          <div className="flex items-center justify-between mb-8">
             <div>
               <h2 className="text-2xl font-extrabold text-slate-900">Active Directory</h2>
               <p className="text-sm font-medium text-slate-500">Live network hosts currently accepting peers.</p>
             </div>
             <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse">
               <Activity size={12}/> {activeRooms.length} Live
             </span>
          </div>

          <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-3xl p-4 overflow-y-auto shadow-inner space-y-3">
             {activeRooms.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                 <Globe size={48} className="mb-4 opacity-20" />
                 <p className="font-bold text-lg text-slate-500">No signals detected</p>
                 <p className="text-sm">Wait for a host to broadcast their server, or start your own on the left.</p>
               </div>
             ) : (
               activeRooms.map((room, idx) => (
                 <div key={room.roomId || idx} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center justify-between shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                   <div className="flex items-center gap-4">
                     <div className="bg-indigo-50 p-3 rounded-xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                       <Server size={24} />
                     </div>
                     <div>
                       <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                         {room.hostName}'s Arena
                       </h3>
                       <p className="text-xs font-mono text-slate-400 mt-1">Host IP: {room.ip}</p>
                     </div>
                   </div>
                   <button 
                      onClick={() => handleJoinMulti(room.roomId)}
                     className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-indigo-600 transition-colors flex items-center gap-2 shadow-sm"
                   >
                     Join <Play size={16} fill="currentColor"/>
                   </button>
                 </div>
               ))
             )}
          </div>
        </div>
        
      </div>
    </div>
  );
}