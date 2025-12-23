
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mood, MoodEntry, UserStats } from '../types';
import { getStats, getXPForNextLevel, BADGES } from '../services/gamificationService';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>(getStats());
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    setStats(getStats());
  }, []);

  const handleSaveMood = () => {
    if (!selectedMood) return;

    const newEntry: MoodEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mood: selectedMood,
      note: note.trim() || undefined
    };

    const saved = localStorage.getItem('mood_entries');
    const entries = saved ? JSON.parse(saved) : [];
    localStorage.setItem('mood_entries', JSON.stringify([newEntry, ...entries]));
    
    // We update stats elsewhere or via a listener, for now we re-fetch
    window.dispatchEvent(new Event('activity-recorded'));
    
    setSelectedMood(null);
    setNote('');
  };

  const xpPercent = (stats.xp / getXPForNextLevel(stats.level)) * 100;

  // Visual Garden Logic based on level
  const renderGarden = () => {
    const icons = ['🌱', '🌿', '☘️', '🍀', '🌸', '🌼', '🌻', '🌲', '🌳', '🌈'];
    const activeIcons = icons.slice(0, Math.min(stats.level, icons.length));
    
    return (
      <div className="flex flex-wrap justify-center gap-4 py-8 animate-in fade-in zoom-in duration-700">
        {activeIcons.map((emoji, i) => (
          <div key={i} className="text-4xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
            {emoji}
          </div>
        ))}
        {activeIcons.length < 3 && (
          <p className="w-full text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-4">
            Grow your sanctuary by practicing calm
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 scroll-container page-enter pb-32">
      {/* Dynamic Header with XP Bar */}
      <header className="px-8 pt-12 pb-6 bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-slate-100/50">
        <div className="flex justify-between items-end mb-4">
          <div>
            <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Level {stats.level}</p>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Sanctuary.</h1>
          </div>
          <div className="bg-sky-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <i className="fa-solid fa-fire text-sky-500 text-xs"></i>
            <span className="text-sky-800 text-xs font-bold">{stats.streak}d</span>
          </div>
        </div>
        
        {/* XP Progress Bar */}
        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-1000"
            style={{ width: `${xpPercent}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{stats.xp} XP</span>
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{getXPForNextLevel(stats.level)} XP NEXT</span>
        </div>
      </header>

      <div className="px-6 space-y-8 flex-1">
        {/* Digital Sanctuary Visualization */}
        <section className="mt-4 bg-white rounded-[2.5rem] p-4 shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex justify-between items-center mb-2 px-4 pt-2">
            <h3 className="text-slate-800 font-black text-[10px] uppercase tracking-widest">Growth Visualization</h3>
            <span className="text-[10px] text-sky-500 font-bold">Lvl {stats.level} Garden</span>
          </div>
          <div className="bg-slate-50/50 rounded-[2rem] border border-slate-50 min-h-[140px] flex items-center justify-center">
            {renderGarden()}
          </div>
        </section>

        {/* Hero Panic Button */}
        <section>
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center">
             <div className="relative mb-6">
                <div className="absolute inset-0 bg-sky-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <button
                  onClick={() => navigate('/rescue')}
                  className="relative w-40 h-40 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 shadow-2xl shadow-sky-200 flex flex-col items-center justify-center text-white transition-all active:scale-90 hover:scale-105 group"
                >
                  <i className="fa-solid fa-wind text-4xl mb-2 group-hover:rotate-12 transition-transform"></i>
                  <span className="text-sm font-black uppercase tracking-widest">Rescue Session</span>
                  <span className="text-[8px] opacity-70 mt-1">+25 XP</span>
                </button>
             </div>
          </div>
        </section>

        {/* Mood Section */}
        <section>
          <div className="bg-white rounded-[2.5rem] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest">Daily Log</h3>
              <span className="text-[10px] font-bold text-sky-500">+10 XP</span>
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
                  className="w-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-all shadow-lg"
                >
                  Unlock 10 XP
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Badges Section */}
        <section>
          <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-4 ml-1">Achievements</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scroll-container">
            {BADGES.map((badge) => {
              const isUnlocked = stats.badges.includes(badge.id);
              return (
                <div 
                  key={badge.id}
                  className={`shrink-0 w-28 h-32 rounded-3xl p-4 flex flex-col items-center justify-center border transition-all ${
                    isUnlocked ? 'bg-white border-sky-100 shadow-sm' : 'bg-slate-100/50 border-slate-100 opacity-40 grayscale'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isUnlocked ? 'bg-sky-50 text-sky-500' : 'bg-slate-200 text-slate-400'}`}>
                    <i className={`fa-solid ${badge.icon}`}></i>
                  </div>
                  <p className="text-[9px] font-black text-center text-slate-800 uppercase tracking-tight leading-none mb-1">
                    {badge.name}
                  </p>
                  <p className="text-[7px] text-center text-slate-400 uppercase tracking-tighter">
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;
