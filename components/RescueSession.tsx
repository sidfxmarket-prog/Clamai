
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BreathingExercise from './BreathingExercise';
import { Mood, MoodEntry, BreathingPattern } from '../types';
import { getVoiceInstruction } from '../services/voiceService';
import { addXP, recordActivity } from '../services/gamificationService';

const PATTERNS: BreathingPattern[] = [
  {
    id: 'panic',
    name: 'Panic Rescue',
    description: 'Quick relief using 5-4-7 timing to calm the heart rate.',
    phases: [
      { type: 'Inhale', duration: 5, instruction: 'Breathe in slowly through your nose' },
      { type: 'Hold', duration: 4, instruction: 'Hold your breath gently' },
      { type: 'Exhale', duration: 7, instruction: 'Breathe out through pursed lips' }
    ]
  },
  {
    id: '478',
    name: '4-7-8 Relax',
    description: 'A natural tranquilizer for the nervous system and deep sleep.',
    phases: [
      { type: 'Inhale', duration: 4, instruction: 'Inhale quietly through your nose' },
      { type: 'Hold', duration: 7, instruction: 'Hold the breath for seven counts' },
      { type: 'Exhale', duration: 8, instruction: 'Exhale completely with a soft whoosh' }
    ]
  },
  {
    id: 'sigh',
    name: 'Physiological Sigh',
    description: 'The fastest way to lower your heart rate and anxiety.',
    phases: [
      { type: 'Inhale', duration: 4, instruction: 'Take a deep, full breath in' },
      { type: 'Hold', duration: 1, instruction: 'Now a quick second sip' },
      { type: 'Exhale', duration: 8, instruction: 'Let out a long, vocal sigh' }
    ]
  },
  {
    id: 'box',
    name: 'Box Breathing',
    description: 'The Navy SEAL technique for focus and stress control.',
    phases: [
      { type: 'Inhale', duration: 4, instruction: 'Inhale deeply for four' },
      { type: 'Hold', duration: 4, instruction: 'Hold the space for four' },
      { type: 'Exhale', duration: 4, instruction: 'Exhale steady for four' },
      { type: 'HoldOut', duration: 4, instruction: 'Rest in the empty space' }
    ]
  }
];

const DURATIONS = [
  { label: '2 min', value: 120 },
  { label: '5 min', value: 300 },
  { label: '10 min', value: 600 }
];

const RescueSession: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'config' | 'loading' | 'active' | 'complete'>('config');
  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0].value);
  const [musicEnabled, setMusicEnabled] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceBuffersRef = useRef<Record<string, AudioBuffer | null>>({});

  const startSession = async () => {
    setStep('loading');
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    try {
      // Pre-generate voice instructions for all phases of the selected pattern
      const phaseVoices = await Promise.all(
        selectedPattern.phases.map(p => 
          getVoiceInstruction(`${p.instruction}.`, audioContextRef.current!)
        )
      );

      const buffers: Record<string, AudioBuffer | null> = {};
      selectedPattern.phases.forEach((p, i) => {
        buffers[p.type] = phaseVoices[i];
      });

      voiceBuffersRef.current = buffers;
      setStep('active');
    } catch (err) {
      console.error("Session start failed:", err);
      // Fallback to starting without voice if it fails
      setStep('active');
    }
  };

  const handleComplete = () => {
    // Award XP
    addXP(25);
    recordActivity('session');
    setStep('complete');
  };

  const handleLogFeeling = (mood: Mood) => {
    const newEntry: MoodEntry = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      mood,
      note: `Completed ${selectedPattern.name} session.`
    };
    const saved = localStorage.getItem('mood_entries');
    const entries = saved ? JSON.parse(saved) : [];
    localStorage.setItem('mood_entries', JSON.stringify([newEntry, ...entries]));
    
    // Log Activity
    addXP(10);
    recordActivity('log');
    
    navigate('/');
  };

  if (step === 'complete') {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-8 animate-in slide-in-from-bottom duration-700">
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center text-emerald-500 text-4xl shadow-inner shadow-emerald-100/50">
            <i className="fa-solid fa-check"></i>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Breath completed.</h2>
          <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest mt-2">+25 XP EARNED</p>
        </div>
        <div className="w-full">
          <p className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest">How do you feel now?</p>
          <div className="flex justify-center gap-4">
            {[Mood.HAPPY, Mood.NEUTRAL, Mood.SAD].map((m) => (
              <button
                key={m}
                onClick={() => handleLogFeeling(m)}
                className="text-4xl p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:border-sky-300 hover:bg-sky-50 transition-all active:scale-90"
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => navigate('/')} className="text-sky-600 font-bold hover:text-sky-700 transition-colors pt-4">Return Home</button>
      </div>
    );
  }

  if (step === 'config') {
    return (
      <div className="p-6 h-full flex flex-col animate-in fade-in duration-500 overflow-y-auto pb-24">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Rescue Session</h2>
            <p className="text-slate-500 text-sm">Find your center.</p>
          </div>
          <button onClick={() => navigate('/')} className="text-slate-300 hover:text-slate-500 transition-colors">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>

        <section className="space-y-4 mb-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technique</p>
          <div className="grid gap-4">
            {PATTERNS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPattern(p)}
                className={`text-left p-5 rounded-3xl border-2 transition-all group ${
                  selectedPattern.id === p.id 
                    ? 'border-sky-500 bg-sky-50 shadow-sm shadow-sky-100' 
                    : 'border-slate-100 hover:border-slate-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className={`font-bold transition-colors ${selectedPattern.id === p.id ? 'text-sky-700' : 'text-slate-700'}`}>
                    {p.name}
                  </h3>
                  {selectedPattern.id === p.id && (
                    <div className="w-5 h-5 rounded-full bg-sky-500 flex items-center justify-center text-white text-[10px]">
                      <i className="fa-solid fa-check"></i>
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-2 leading-relaxed transition-colors ${selectedPattern.id === p.id ? 'text-sky-600/70' : 'text-slate-400'}`}>
                  {p.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4 mb-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</p>
          <div className="flex gap-3">
            {DURATIONS.map(d => (
              <button
                key={d.value}
                onClick={() => setSelectedDuration(d.value)}
                className={`flex-1 py-4 rounded-2xl border-2 font-bold text-xs transition-all ${
                  selectedDuration === d.value 
                    ? 'bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-200' 
                    : 'border-slate-100 text-slate-400 bg-white hover:border-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4 mb-10">
          <div className="flex justify-between items-center px-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Voice Guidance</p>
            <button 
              onClick={() => setMusicEnabled(!musicEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${musicEnabled ? 'bg-sky-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${musicEnabled ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 px-1">Soothing AI narration and ambient chords.</p>
        </section>

        <button 
          onClick={startSession}
          className="mt-auto w-full bg-sky-500 text-white font-bold py-5 rounded-3xl shadow-xl shadow-sky-100 active:scale-95 hover:bg-sky-600 transition-all flex items-center justify-center gap-3"
        >
          <i className="fa-solid fa-wind"></i>
          BEGIN SESSION (+25 XP)
        </button>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-sky-50 border-t-sky-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-sky-500">
            <i className="fa-solid fa-leaf animate-pulse"></i>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-slate-800">Calming the space</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[240px] mx-auto">
            We're preparing your personal AI guidance session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 relative flex flex-col">
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm">
          <div className={`w-2 h-2 rounded-full bg-sky-500 animate-pulse`}></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedPattern.name}</span>
        </div>
      </div>
      <div className="absolute top-6 right-6 z-10">
         <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 bg-white/60 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center border border-white/50 shadow-sm transition-all hover:scale-105">
           <i className="fa-solid fa-xmark"></i>
         </button>
      </div>
      <BreathingExercise 
        pattern={selectedPattern}
        totalDurationSeconds={selectedDuration}
        onComplete={handleComplete} 
        audioContext={audioContextRef.current}
        voiceBuffers={voiceBuffersRef.current}
        musicEnabled={musicEnabled}
      />
    </div>
  );
};

export default RescueSession;
