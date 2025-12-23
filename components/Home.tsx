
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mood, UserStats } from '../types';
import { fetchStats, updateXPAndActivity } from '../services/gamificationService';
import { supabase } from '../services/supabaseClient';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
      note: note.trim() || null
    };

    const { error } = await supabase.from('mood_entries').insert([entry]);
    
    if (!error) {
      await updateXPAndActivity(10, 'log');
      await loadData();
      setSelectedMood(null);
      setNote('');
    }
    setIsSyncing(false);
  };

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50 scroll-container page-enter pb-32">
      <header className="px-8 pt-12 pb-8 bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100/50">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Welcome Back</p>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Hello, {user?.email?.split('@')[0] || 'Soul'}.
            </h1>
          </div>
          <button 
            onClick={() => navigate('/crisis')}
            className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-sm border border-red-100 transition-transform active:scale-90"
            title="Emergency Help"
          >
            <i className="fa-solid fa-shield-heart"></i>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="bg-sky-100 px-3 py-1 rounded-full flex items-center gap-1.5 border border-sky-200/50">
            <i className="fa-solid fa-fire text-sky-500 text-[10px]"></i>
            <span className="text-sky-800 text-[10px] font-black uppercase tracking-wider">{stats.streak} Day Streak</span>
          </div>
          <div className="bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200/50">
            <i className="fa-solid fa-star text-slate-400 text-[10px]"></i>
            <span className="text-slate-600 text-[10px] font-black uppercase tracking-wider">Level {stats.level}</span>
          </div>
        </div>
      </header>

      <div className="px-6 space-y-8 flex-1 mt-6">
        <section>
          <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center relative overflow-hidden group">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-sky-50 rounded-full transition-transform group-hover:scale-110"></div>
             <div className="relative mb-6">
                <div className="absolute inset-0 bg-sky-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <button
                  onClick={() => navigate('/rescue')}
                  className="relative w-40 h-40 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 shadow-2xl shadow-sky-200 flex flex-col items-center justify-center text-white transition-all active:scale-90 hover:scale-105"
                >
                  <i className="fa-solid fa-wind text-4xl mb-2"></i>
                  <span className="text-sm font-black uppercase tracking-widest">Rescue</span>
                  <span className="text-[8px] opacity-70 mt-1 uppercase tracking-widest font-bold">+25 XP</span>
                </button>
             </div>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Find calm in minutes</p>
          </div>
        </section>

        <section>
          <div className="bg-white rounded-[2.5rem] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest">Daily Log</h3>
              <span className="text-[10px] font-bold text-sky-500 uppercase">+10 XP</span>
            </div>
            
            <div className="flex justify-around mb-6">
              {[Mood.HAPPY, Mood.NEUTRAL, Mood.SAD].map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMood(m)}
                  className={`text-3xl w-16 h-16 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                    selectedMood === m 
                      ? 'bg-sky-500 text-white shadow-xl shadow-sky-100 scale-110 -translate-y-1' 
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100 grayscale hover:grayscale-0'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {selectedMood && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record a thought..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-sky-200 h-24 resize-none transition-all"
                />
                <button
                  onClick={handleSaveMood}
                  disabled={isSyncing}
                  className="w-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-all shadow-lg flex items-center justify-center"
                >
                  {isSyncing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Log Reflection'}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer" onClick={() => navigate('/chat')}>
           <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform">
             <i className="fa-solid fa-robot text-9xl translate-x-10 translate-y-10"></i>
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 mb-1">Assistant</p>
           <h3 className="text-xl font-bold mb-2">Speak with Calm AI</h3>
           <p className="text-xs text-slate-400 max-w-[180px]">Compassionate support whenever you need a listening ear.</p>
        </section>
      </div>
    </div>
  );
};

export default Home;
