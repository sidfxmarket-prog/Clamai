import React, { useState, useEffect, useMemo } from 'react';
import { MoodEntry, Mood } from '../types';

const MoodTracker: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem('mood_entries');
    if (saved) {
      try {
        const parsed: MoodEntry[] = JSON.parse(saved);
        setEntries(parsed);
      } catch (e) {
        console.error("Failed to parse mood entries", e);
      }
    }
  }, []);

  const clearHistory = () => {
    if (confirm("Clear all mood history?")) {
      localStorage.removeItem('mood_entries');
      setEntries([]);
    }
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for start of week
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of month
    for (let i = 1; i <= lastDate; i++) {
      days.push(new Date(year, month, i));
    }
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

  /**
   * Helper function to get the tailwind color class based on the mood.
   */
  const getMoodColorClass = (mood: Mood) => {
    switch (mood) {
      case Mood.HAPPY: return 'bg-emerald-500';
      case Mood.NEUTRAL: return 'bg-amber-400';
      case Mood.SAD: return 'bg-indigo-500';
      default: return 'bg-slate-300';
    }
  };

  const selectedEntries = groupedByDay[selectedDate] || [];

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 overflow-y-auto pb-24 animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Your Journey</h2>
          <p className="text-slate-500 text-sm">Visualizing your emotional path.</p>
        </div>
        <button 
          onClick={clearHistory} 
          className="text-slate-300 hover:text-red-400 transition-colors p-2"
          aria-label="Clear history"
        >
          <i className="fa-solid fa-trash-can"></i>
        </button>
      </header>

      <section className="mb-8 bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6 px-1">
          <h3 className="font-bold text-slate-700">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
              aria-label="Previous month"
            >
              <i className="fa-solid fa-chevron-left text-xs text-slate-400"></i>
            </button>
            <button 
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
              aria-label="Next month"
            >
              <i className="fa-solid fa-chevron-right text-xs text-slate-400"></i>
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
                        className={`w-1 h-1 rounded-full ${getMoodColorClass(entry.mood)} shadow-sm`}
                        title={entry.mood}
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
          <div className="text-center py-16 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
              <i className="fa-solid fa-moon text-2xl"></i>
            </div>
            <p className="text-slate-400 text-sm font-medium">Quiet day... so far.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedEntries.map(entry => (
              <div key={entry.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex gap-5 items-start animate-in slide-in-from-right-4 duration-300">
                <div className={`w-1.5 shrink-0 self-stretch rounded-full ${getMoodColorClass(entry.mood)} shadow-sm opacity-60`} />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl drop-shadow-sm" role="img" aria-label={entry.mood}>{entry.mood}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${
                        entry.mood === Mood.HAPPY ? 'text-emerald-500' : 
                        entry.mood === Mood.NEUTRAL ? 'text-amber-500' : 'text-indigo-500'
                      }`}>
                        {entry.mood === Mood.HAPPY ? 'Grateful' : 
                         entry.mood === Mood.NEUTRAL ? 'Balanced' : 'Reflective'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {entry.note ? (
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{entry.note}</p>
                  ) : (
                    <p className="text-sm text-slate-300 italic">No notes added.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default MoodTracker;