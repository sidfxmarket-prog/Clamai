
import React, { useState, useEffect, useMemo } from 'react';
import { MoodEntry, Mood } from '../types';
import { supabase } from '../services/supabaseClient';
import { updateXPAndActivity } from '../services/gamificationService';

const MoodTracker: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state for new entry
  const [newMood, setNewMood] = useState<Mood | null>(null);
  const [newNote, setNewNote] = useState('');

  const loadEntries = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error("Failed to fetch mood entries", error);
    } else {
      setEntries(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const saveEntry = async () => {
    if (!newMood) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const entry = {
      user_id: user.id,
      date: new Date().toISOString(),
      mood: newMood,
      note: newNote.trim() || null
    };

    const { data, error } = await supabase
      .from('mood_entries')
      .insert([entry])
      .select()
      .single();

    if (error) {
      console.error("Error saving mood entry", error);
    } else {
      setEntries([data, ...entries]);
      setNewMood(null);
      setNewNote('');
      setIsAdding(false);
      setSelectedDate(new Date().toLocaleDateString());
      
      // Update XP & Stats in Supabase
      await updateXPAndActivity(10, 'log');
      
      // Notify components that may need a refresh
      window.dispatchEvent(new Event('activity-recorded'));
    }
  };

  const clearHistory = async () => {
    if (confirm("Clear all mood history from the cloud?")) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error("Error clearing history", error);
      } else {
        setEntries([]);
      }
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= lastDate; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentMonth]);

  const groupedByDay = useMemo(() => {
    return entries.reduce((acc: Record<string, MoodEntry[]>, entry) => {
      const day = new Date(entry.date).toLocaleDateString();
      if (!acc[day]) acc[day] = [];
      acc[day].push(entry);
      return acc;
    }, {} as Record<string, MoodEntry[]>);
  }, [entries]);

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const counts = entries.reduce((acc, e) => {
      acc[e.mood] = (acc[e.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return counts;
  }, [entries]);

  const getMoodColorClass = (mood: Mood) => {
    switch (mood) {
      case Mood.HAPPY: return 'bg-emerald-500';
      case Mood.NEUTRAL: return 'bg-amber-400';
      case Mood.SAD: return 'bg-sky-500';
      default: return 'bg-slate-300';
    }
  };

  const selectedEntries = groupedByDay[selectedDate] || [];

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 overflow-y-auto pb-32 animate-in fade-in duration-500 scroll-container">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Journal</h2>
          <p className="text-slate-400 text-sm font-bold">Cloud-synced path.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isAdding ? 'bg-slate-900 text-white rotate-45' : 'bg-sky-50 text-sky-500 hover:bg-sky-100'}`}
          >
            <i className="fa-solid fa-plus"></i>
          </button>
          <button 
            onClick={clearHistory} 
            className="w-10 h-10 rounded-full bg-white text-slate-300 hover:text-red-400 transition-colors shadow-sm flex items-center justify-center"
          >
            <i className="fa-solid fa-trash-can text-sm"></i>
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Fetching Sanctuary Data</p>
        </div>
      ) : (
        <>
          {stats && (
            <section className="mb-6 grid grid-cols-3 gap-3">
              {[Mood.HAPPY, Mood.NEUTRAL, Mood.SAD].map(m => (
                <div key={m} className="bg-white p-3 rounded-2xl border border-slate-100 flex flex-col items-center shadow-sm">
                  <span className="text-xl mb-1">{m}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stats[m] || 0}</span>
                </div>
              ))}
            </section>
          )}

          {isAdding && (
            <section className="mb-8 animate-in slide-in-from-top-4 duration-300">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">How are you now?</h3>
                <div className="flex justify-around mb-6">
                  {[Mood.HAPPY, Mood.NEUTRAL, Mood.SAD].map((m) => (
                    <button
                      key={m}
                      onClick={() => setNewMood(m)}
                      className={`text-3xl w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        newMood === m ? `${getMoodColorClass(m)} text-white scale-110 shadow-lg` : 'bg-slate-50 text-slate-300 grayscale opacity-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a reflection..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-sky-200 h-24 resize-none transition-all mb-4"
                />
                <button
                  onClick={saveEntry}
                  disabled={!newMood}
                  className="w-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest py-4 rounded-2xl active:scale-95 disabled:opacity-30 transition-all shadow-lg"
                >
                  Sync to Sanctuary
                </button>
              </div>
            </section>
          )}

          <section className="mb-8 bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="font-bold text-slate-800 tracking-tight">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <i className="fa-solid fa-chevron-left text-[10px]"></i>
                </button>
                <button 
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400"
                >
                  <i className="fa-solid fa-chevron-right text-[10px]"></i>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-3 gap-x-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase mb-2">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} className="aspect-square"></div>;
                const dateStr = day.toLocaleDateString();
                const dayEntries = groupedByDay[dateStr] || [];
                const isSelected = selectedDate === dateStr;
                const isToday = new Date().toLocaleDateString() === dateStr;
                
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all border ${
                      isSelected 
                        ? 'border-sky-300 bg-sky-50 shadow-inner scale-110 z-10' 
                        : isToday 
                        ? 'border-sky-100 bg-white ring-2 ring-sky-50 ring-offset-1'
                        : 'border-transparent bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className={`text-[11px] font-bold ${isSelected ? 'text-sky-600' : 'text-slate-600'}`}>
                      {day.getDate()}
                    </span>
                    {dayEntries.length > 0 && (
                      <div className="flex gap-0.5 mt-1 justify-center flex-wrap px-0.5 h-1.5 w-full">
                        {dayEntries.slice(0, 4).map((entry) => (
                          <div 
                            key={entry.id} 
                            className={`w-1.5 h-1.5 rounded-full ${getMoodColorClass(entry.mood)} shadow-sm`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {selectedDate === new Date().toLocaleDateString() ? 'TODAY' : selectedDate}
              </h3>
              <span className="text-[10px] font-bold text-slate-300 bg-slate-200/50 px-2 py-0.5 rounded-full">
                {selectedEntries.length} {selectedEntries.length === 1 ? 'LOG' : 'LOGS'}
              </span>
            </div>

            {selectedEntries.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 animate-in fade-in zoom-in-95 duration-300">
                <p className="text-slate-400 text-sm font-bold">No entries for this date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedEntries.map(entry => (
                  <div key={entry.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex gap-5 items-start animate-in slide-in-from-right-4 duration-300">
                    <div className={`w-1.5 shrink-0 self-stretch rounded-full ${getMoodColorClass(entry.mood)} opacity-60`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl drop-shadow-sm">{entry.mood}</span>
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg">
                          {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium">{entry.note || 'No notes recorded.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default MoodTracker;
