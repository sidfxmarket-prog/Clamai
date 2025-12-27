
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mood, UserStats } from '../types';
import { fetchStats, updateXPAndActivity } from '../services/gamificationService';
import { supabase } from '../services/supabaseClient';
import { generatePersonalizedPattern } from '../services/geminiService';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    const s = await fetchStats();
    setStats(s);
  };

  useEffect(() => {
    loadData();
    const handleActivity = () => loadData();
    window.addEventListener('activity-recorded', handleActivity);
    return () => window.removeEventListener('activity-recorded', handleActivity);
  }, []);

  const handleSaveMood = async () => {
    if (!selectedMood || !user) return;
    setIsSyncing(true);

    const entry = {
      user_id: user.id,
      date: new Date().toISOString(),
      mood: selectedMood,
      note: null
    };

    const { error } = await supabase.from('mood_entries').insert([entry]);
    
    if (!error) {
      await updateXPAndActivity(10, 'log');
      await loadData();
      setSelectedMood(null);
    }
    setIsSyncing(false);
  };

  const handleGenerateAISession = async () => {
    if (!selectedMood) return;
    setIsGenerating(true);
    try {
      const pattern = await generatePersonalizedPattern(selectedMood);
      navigate('/rescue', { state: { customPattern: pattern } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const moodOptions = Object.values(Mood);

  return (
    <div className="h-full flex flex-col bg-transparent scroll-container page-enter pb-32">
      <header className="px-8 pt-12 pb-6 sticky top-0 z-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Sanctuary</p>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Hey, {user?.email?.split('@')[0] || 'friend'}.
            </h1>
          </div>
          <button 
            onClick={() => navigate('/crisis')}
            className="w-12 h-12 rounded-2xl glass flex items-center justify-center shadow-sm text-rose-500 tap-active"
          >
            <i className="fa-solid fa-heart-pulse text-lg"></i>
          </button>
        </div>
        
        <div className="flex items-center gap-3 mt-6">
          <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/40">
            <i className="fa-solid fa-fire-flame-curved text-orange-400 text-sm"></i>
            <span className="text-slate-700 text-[11px] font-bold uppercase tracking-wider">{stats.streak} day streak</span>
          </div>
          <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/40">
            <i className="fa-solid fa-crown text-yellow-500 text-sm"></i>
            <span className="text-slate-700 text-[11px] font-bold uppercase tracking-wider">Level {stats.level}</span>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-6 flex-1">
        {/* Primary Action Card */}
        <section>
          <div className="bg-main-grad rounded-[3rem] p-8 shadow-[0_30px_60px_-15px_rgba(167,139,250,0.4)] relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full translate-x-10 -translate-y-10 blur-3xl"></div>
             
             <div className="flex justify-between items-center relative z-10">
               <div className="space-y-2">
                 <h3 className="text-white text-2xl font-bold">Time for calm?</h3>
                 <p className="text-white/80 text-sm max-w-[160px]">A quick 2-minute breathing session to reset.</p>
               </div>
               <button
                  onClick={() => navigate('/rescue')}
                  className="w-20 h-20 rounded-[2rem] bg-white text-purple-600 shadow-xl flex items-center justify-center tap-active group-hover:scale-105 transition-all duration-500"
                >
                  <i className="fa-solid fa-wind text-2xl"></i>
                </button>
             </div>
             
             <div className="mt-6 flex items-center gap-2 relative z-10">
               <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-md">
                 <span className="text-white text-[9px] font-black uppercase tracking-widest">+25 XP</span>
               </div>
               <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-md">
                 <span className="text-white text-[9px] font-black uppercase tracking-widest">Recommended</span>
               </div>
             </div>
          </div>
        </section>

        {/* Quick Log Sanctuary */}
        <section>
          <div className="glass rounded-[3rem] p-8 border border-white/60 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest">How are you feeling?</h3>
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                <i className="fa-solid fa-pen-nib text-xs"></i>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {moodOptions.map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMood(m)}
                  className={`text-3xl aspect-square rounded-[1.5rem] flex items-center justify-center transition-all duration-500 tap-active ${
                    selectedMood === m 
                      ? 'bg-purple-600 text-white shadow-2xl shadow-purple-200 -translate-y-2' 
                      : 'bg-white/50 text-slate-400 hover:bg-white border border-white/50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {selectedMood && (
              <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <button
                  onClick={handleGenerateAISession}
                  disabled={isGenerating}
                  className="w-full bg-purple-50 text-purple-600 text-[11px] font-black uppercase tracking-widest py-4 rounded-[1.5rem] border border-purple-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>Personalized AI Breathwork</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveMood}
                  disabled={isSyncing}
                  className="w-full bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] py-5 rounded-[1.5rem] active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                >
                  {isSyncing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Save Quick Entry</span>
                      <i className="fa-solid fa-chevron-right text-[10px]"></i>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* AI Companion Preview */}
        <section 
          className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer shadow-2xl" 
          onClick={() => navigate('/chat')}
        >
           <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-500"></div>
           <div className="relative z-10 flex items-center gap-6">
             <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 flex items-center justify-center border border-white/10 group-hover:rotate-12 transition-transform duration-500">
               <i className="fa-solid fa-sparkles text-2xl text-purple-300"></i>
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 mb-1">Companion</p>
               <h3 className="text-xl font-bold">Talk to Calm AI</h3>
               <p className="text-white/50 text-xs mt-1">Ready to listen and support you.</p>
             </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
