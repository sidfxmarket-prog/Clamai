
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Blob } from '@google/genai';
import { MoodEntry, Mood } from '../types';
import { supabase } from '../services/supabaseClient';
import { updateXPAndActivity } from '../services/gamificationService';

// Transcription helpers
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const MoodTracker: React.FC = () => {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newMood, setNewMood] = useState<Mood | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Voice Note Refs
  const liveSessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  const toggleVoiceNote = async () => {
    if (isListening) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      liveSessionRef.current = null;
      setIsListening(false);
      return;
    }

    try {
      setIsListening(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setNewNote(prev => prev + message.serverContent!.inputTranscription!.text);
            }
          },
          onerror: (e) => {
            console.error('Transcription error:', e);
            setIsListening(false);
          }
        },
        config: {
          inputAudioTranscription: {},
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Voice Note failed:", err);
      setIsListening(false);
    }
  };

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
      await updateXPAndActivity(10, 'log');
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

  const getMoodColorClass = (mood: Mood) => {
    switch (mood) {
      case Mood.HAPPY: return 'bg-pink-400';
      case Mood.CALM: return 'bg-emerald-400';
      case Mood.EXCITED: return 'bg-yellow-400';
      case Mood.NEUTRAL: return 'bg-purple-300';
      case Mood.SAD: return 'bg-purple-500';
      case Mood.ANXIOUS: return 'bg-orange-400';
      case Mood.ANGRY: return 'bg-rose-500';
      case Mood.TIRED: return 'bg-indigo-400';
      default: return 'bg-slate-300';
    }
  };

  const selectedEntries = groupedByDay[selectedDate] || [];
  const moodOptions = Object.values(Mood);

  return (
    <div className="h-full flex flex-col bg-transparent scroll-container page-enter pb-32">
      <header className="px-8 pt-12 pb-6 sticky top-0 z-10 flex justify-between items-center">
        <div>
          <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Journal</p>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your story.</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all tap-active ${isAdding ? 'bg-slate-900 text-white' : 'glass text-purple-600 shadow-sm'}`}
          >
            <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'} text-lg`}></i>
          </button>
          <button 
            onClick={clearHistory} 
            className="w-12 h-12 rounded-2xl glass text-slate-400 tap-active"
          >
            <i className="fa-solid fa-trash-can text-sm"></i>
          </button>
        </div>
      </header>

      <div className="px-6 space-y-8 flex-1">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {isAdding && (
              <section className="animate-in slide-in-from-top-4 duration-500">
                <div className="glass rounded-[3rem] p-8 shadow-xl border border-white/60">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center">Current Emotion</h3>
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    {moodOptions.map((m) => (
                      <button
                        key={m}
                        onClick={() => setNewMood(m)}
                        className={`text-3xl aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 tap-active ${
                          newMood === m ? `${getMoodColorClass(m)} text-white shadow-xl scale-110` : 'bg-white/50 text-slate-300 grayscale opacity-40'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  
                  <div className="relative mb-6">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder={isListening ? "Listening..." : "Reflect on your day..."}
                      className={`w-full bg-white/50 border rounded-[1.5rem] p-5 pr-14 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-purple-200 h-28 resize-none transition-all placeholder:text-slate-300 ${isListening ? 'border-pink-300 ring-2 ring-pink-100' : 'border-purple-50'}`}
                    />
                    <button 
                      onClick={toggleVoiceNote}
                      className={`absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isListening ? 'bg-pink-500 text-white shadow-lg animate-pulse' : 'bg-purple-50 text-purple-400 hover:bg-purple-100'}`}
                    >
                      <i className={`fa-solid ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
                    </button>
                  </div>

                  <button
                    onClick={saveEntry}
                    disabled={!newMood}
                    className="w-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] py-5 rounded-[1.5rem] active:scale-95 disabled:opacity-20 transition-all shadow-xl shadow-slate-200"
                  >
                    Add to Sanctuary
                  </button>
                </div>
              </section>
            )}

            {/* Calendar Sanctuary */}
            <section className="glass rounded-[3rem] p-8 shadow-sm border border-white/60">
              <div className="flex justify-between items-center mb-8 px-1">
                <h3 className="font-extrabold text-xl text-slate-800">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                    className="w-10 h-10 rounded-full glass flex items-center justify-center text-purple-400 tap-active"
                  >
                    <i className="fa-solid fa-chevron-left text-xs"></i>
                  </button>
                  <button 
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                    className="w-10 h-10 rounded-full glass flex items-center justify-center text-purple-400 tap-active"
                  >
                    <i className="fa-solid fa-chevron-right text-xs"></i>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-purple-300 uppercase">{d}</div>
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
                      className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 ${
                        isSelected 
                          ? 'bg-purple-600 text-white shadow-xl shadow-purple-200 scale-110 z-10' 
                          : isToday 
                          ? 'bg-purple-100 text-purple-700 font-black ring-1 ring-purple-200'
                          : 'bg-white/40 hover:bg-white/80 text-slate-500'
                      }`}
                    >
                      <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : ''}`}>
                        {day.getDate()}
                      </span>
                      {dayEntries.length > 0 && !isSelected && (
                        <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-purple-400"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Daily History */}
            <section>
              <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {selectedDate === new Date().toLocaleDateString() ? 'LOGS TODAY' : selectedDate}
                </h3>
                <span className="text-[9px] font-black text-purple-500 uppercase">{selectedEntries.length} items</span>
              </div>

              {selectedEntries.length === 0 ? (
                <div className="text-center py-20 glass rounded-[3rem] border-2 border-dashed border-white/60">
                  <i className="fa-solid fa-cloud-moon text-slate-200 text-4xl mb-3"></i>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Quiet on this day.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedEntries.map(entry => (
                    <div key={entry.id} className="glass p-8 rounded-[3rem] border border-white/60 shadow-sm flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">{entry.mood}</span>
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-none">Feeling {entry.mood === Mood.HAPPY ? 'great' : entry.mood === Mood.CALM ? 'serene' : 'some way'}</p>
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">
                              {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getMoodColorClass(entry.mood)}`}></div>
                      </div>
                      {entry.note && (
                        <p className="text-sm text-slate-600 leading-relaxed font-medium bg-white/40 p-5 rounded-[1.5rem] border border-white/60">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default MoodTracker;
