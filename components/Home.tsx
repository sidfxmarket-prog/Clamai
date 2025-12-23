
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mood, MoodEntry } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mood_entries');
    if (saved) {
      const entries: MoodEntry[] = JSON.parse(saved);
      const uniqueDays = new Set(entries.map(e => e.date.split('T')[0])).size;
      setStreak(uniqueDays);
    }
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
    
    setSelectedMood(null);
    setNote('');
    
    const updatedEntries = [newEntry, ...entries];
    const uniqueDays = new Set(updatedEntries.map(e => e.date.split('T')[0])).size;
    setStreak(uniqueDays);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 scroll-container page-enter">
      <header className="px-8 pt-12 pb-6 flex justify-between items-end bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <p className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">Welcome Back</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Deep Breath.</h1>
        </div>
        <div className="bg-sky-100 px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <i className="fa-solid fa-fire text-sky-500 text-xs"></i>
          <span className="text-sky-800 text-xs font-bold">{streak}</span>
        </div>
      </header>

      <div className="px-6 pb-32 flex-1 space-y-8">
        {/* Hero Panic Button */}
        <section className="mt-4">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center">
             <div className="relative mb-6">
                <div className="absolute inset-0 bg-sky-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                <button
                  onClick={() => navigate('/rescue')}
                  className="relative w-40 h-40 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 shadow-2xl shadow-sky-200 flex flex-col items-center justify-center text-white transition-all active:scale-90 hover:scale-105 group"
                >
                  <i className="fa-solid fa-wind text-4xl mb-2 group-hover:rotate-12 transition-transform"></i>
                  <span className="text-sm font-black uppercase tracking-widest">Rescue</span>
                </button>
             </div>
             <h2 className="text-slate-800 font-bold text-center">In the middle of a storm?</h2>
             <p className="text-slate-400 text-xs text-center mt-1">Tap for immediate calming guidance</p>
          </div>
        </section>

        {/* Mood Section */}
        <section>
          <div className="bg-white rounded-[2.5rem] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.03)] border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-slate-800 font-black text-xs uppercase tracking-widest">How's your heart?</h3>
              <span className="text-[10px] font-bold text-slate-300">LOG DAILY</span>
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
                  placeholder="Anything on your mind? (optional)"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-sky-200 h-24 resize-none transition-all"
                />
                <button
                  onClick={handleSaveMood}
                  className="w-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 transition-all shadow-lg"
                >
                  Record Moment
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-4 pb-4">
          <button 
            onClick={() => navigate('/chat')}
            className="bg-emerald-50 p-6 rounded-[2rem] text-left group hover:bg-emerald-100 transition-colors"
          >
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-comment-dots"></i>
            </div>
            <p className="text-emerald-900 font-bold text-sm">Talk to AI</p>
            <p className="text-emerald-700 text-[10px] opacity-70">Gentle chat</p>
          </button>
          
          <button 
             onClick={() => navigate('/mood')}
             className="bg-indigo-50 p-6 rounded-[2rem] text-left group hover:bg-indigo-100 transition-colors"
          >
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-indigo-500 mb-4 shadow-sm group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-book-open"></i>
            </div>
            <p className="text-indigo-900 font-bold text-sm">History</p>
            <p className="text-indigo-700 text-[10px] opacity-70">Review growth</p>
          </button>
        </section>
      </div>
    </div>
  );
};

export default Home;
