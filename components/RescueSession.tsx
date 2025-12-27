
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BreathingExercise from './BreathingExercise';
import { Mood, BreathingPattern } from '../types';
import { getVoiceInstruction } from '../services/voiceService';
import { updateXPAndActivity } from '../services/gamificationService';
import { supabase } from '../services/supabaseClient';

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
  { label: '5 min', value: 300 }
];

const RescueSession: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState<'config' | 'loading' | 'active' | 'complete'>('config');
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(PATTERNS[0]);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0].value);
  const [musicEnabled, setMusicEnabled] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const voiceBuffersRef = useRef<Record<string, AudioBuffer | null>>({});

  useEffect(() => {
    if (location.state?.customPattern) {
      setSelectedPattern(location.state.customPattern);
    }
  }, [location.state]);

  const startSession = async () => {
    setStep('loading');
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    try {
      const phaseVoices = await Promise.all(
        selectedPattern.phases.map(p => getVoiceInstruction(`${p.instruction}.`, audioContextRef.current!))
      );
      const buffers: Record<string, AudioBuffer | null> = {};
      selectedPattern.phases.forEach((p, i) => { buffers[p.type] = phaseVoices[i]; });
      voiceBuffersRef.current = buffers;
      setStep('active');
    } catch (err) {
      console.error("Session start failed:", err);
      setStep('active');
    }
  };

  const handleComplete = async () => {
    await updateXPAndActivity(25, 'session');
    setStep('complete');
  };

  const handleLogFeeling = async (mood: Mood) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('mood_entries').insert([{
      user_id: user.id,
      date: new Date().toISOString(),
      mood,
      note: `Completed ${selectedPattern.name} session.`
    }]);
    
    await updateXPAndActivity(10, 'log');
    navigate('/');
  };

  if (step === 'complete') {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full text-center space-y-8 animate-in slide-in-from-bottom duration-700 bg-white">
        <div className="relative">
          <div className="bg-pink-50 w-24 h-24 rounded-full flex items-center justify-center text-pink-500 text-4xl shadow-inner">
            <i className="fa-solid fa-check"></i>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Breath completed.</h2>
          <p className="text-pink-600 font-bold uppercase text-[10px] tracking-widest mt-2">+25 XP EARNED</p>
        </div>
        <div className="w-full">
          <p className="text-xs font-black text-slate-400 mb-6 uppercase tracking-widest">How do you feel now?</p>
          <div className="grid grid-cols-4 gap-4 px-4">
            {Object.values(Mood).map((m) => (
              <button key={m} onClick={() => handleLogFeeling(m)} className="text-3xl p-4 bg-purple-50 rounded-2xl hover:bg-pink-50 transition-all active:scale-90">{m}</button>
            ))}
          </div>
        </div>
        <button onClick={() => navigate('/')} className="text-purple-600 font-bold hover:text-purple-700 pt-4">Return Home</button>
      </div>
    );
  }

  if (step === 'config') {
    return (
      <div className="p-6 h-full flex flex-col animate-in fade-in duration-500 overflow-y-auto pb-24 bg-white">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Rescue Session</h2>
            <p className="text-slate-500 text-sm">Find your center.</p>
          </div>
          <button onClick={() => navigate('/')} className="text-slate-300 hover:text-slate-500 transition-colors">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>
        
        {location.state?.customPattern && (
          <div className="mb-8 p-6 bg-purple-50 rounded-[2.5rem] border border-purple-100 animate-in slide-in-from-top-4">
             <div className="flex items-center gap-3 mb-2">
                <i className="fa-solid fa-wand-magic-sparkles text-purple-600"></i>
                <h3 className="font-black text-xs text-purple-800 uppercase tracking-widest">AI Generated Pattern</h3>
             </div>
             <p className="text-xl font-bold text-purple-900 mb-1">{location.state.customPattern.name}</p>
             <p className="text-xs text-purple-600/70 leading-relaxed">{location.state.customPattern.description}</p>
          </div>
        )}

        <section className="space-y-4 mb-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Choose Technique</h3>
          <div className="grid gap-4">
            {PATTERNS.map(p => (
              <button key={p.id} onClick={() => { setSelectedPattern(p); navigate('.', { replace: true, state: {} }); }} className={`text-left p-5 rounded-3xl border-2 transition-all ${selectedPattern.id === p.id && !location.state?.customPattern ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-slate-100 bg-white'}`}>
                <h3 className={`font-bold ${selectedPattern.id === p.id && !location.state?.customPattern ? 'text-purple-700' : 'text-slate-700'}`}>{p.name}</h3>
                <p className="text-xs mt-1 text-slate-400">{p.description}</p>
              </button>
            ))}
          </div>
        </section>
        
        <section className="space-y-4 mb-8">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Duration</h3>
          <div className="flex gap-3">
            {DURATIONS.map(d => (
              <button key={d.value} onClick={() => setSelectedDuration(d.value)} className={`flex-1 py-4 rounded-2xl border-2 font-bold text-xs ${selectedDuration === d.value ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'border-slate-100 text-slate-400 bg-white'}`}>{d.label}</button>
            ))}
          </div>
        </section>
        <button onClick={startSession} className="mt-auto w-full bg-purple-500 text-white font-bold py-5 rounded-3xl shadow-xl shadow-purple-100 transition-all">BEGIN SESSION (+25 XP)</button>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in bg-white">
        <div className="w-12 h-12 border-4 border-purple-50 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Pre-generating Guidance</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-50 relative flex flex-col">
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
