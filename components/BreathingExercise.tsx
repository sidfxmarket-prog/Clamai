
import React, { useState, useEffect, useRef } from 'react';
import { playBuffer } from '../services/voiceService';
import { createAmbientBackground, AmbientBackground } from '../services/audioService';
import { BreathingPattern, PhaseType } from '../types';

interface BreathingExerciseProps {
  pattern: BreathingPattern;
  totalDurationSeconds: number;
  onComplete: () => void;
  audioContext: AudioContext | null;
  voiceBuffers: Record<string, AudioBuffer | null>;
  musicEnabled?: boolean;
}

const BreathingExercise: React.FC<BreathingExerciseProps> = ({ 
  pattern,
  totalDurationSeconds,
  onComplete, 
  audioContext, 
  voiceBuffers,
  musicEnabled = true
}) => {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(pattern.phases[0].duration);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTime, setRemainingTime] = useState(totalDurationSeconds);
  const [isMusicOn, setIsMusicOn] = useState(musicEnabled);

  const ambientRef = useRef<AmbientBackground | null>(null);
  const phaseIndexRef = useRef(0);
  const phaseTimerRef = useRef(pattern.phases[0].duration);
  const remainingTimeRef = useRef(totalDurationSeconds);
  const lastTickRef = useRef(Date.now());
  const requestRef = useRef<number | null>(null);
  const voiceBuffersRef = useRef(voiceBuffers);
  const isVoicePlayingRef = useRef(false);

  useEffect(() => {
    voiceBuffersRef.current = voiceBuffers;
  }, [voiceBuffers]);

  useEffect(() => {
    if (audioContext && !ambientRef.current) {
      ambientRef.current = createAmbientBackground(audioContext);
      ambientRef.current.start();
    }
    return () => {
      if (ambientRef.current) {
        ambientRef.current.stop();
      }
    };
  }, [audioContext]);

  // Handle ambient volume transitions
  useEffect(() => {
    if (ambientRef.current) {
      if (isPaused || !isMusicOn) {
        ambientRef.current.setVolume(0);
      } else if (!isVoicePlayingRef.current) {
        ambientRef.current.setVolume(0.4);
      }
    }
  }, [isPaused, isMusicOn]);

  const triggerVoice = async (index: number) => {
    if (!audioContext || !ambientRef.current) return;
    
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(console.error);
    }
    
    const phaseType = pattern.phases[index].type;
    const buffer = voiceBuffersRef.current[phaseType];
    
    if (buffer) {
      // Audio ducking: lower music volume while voice is playing for clarity
      if (isMusicOn && !isPaused) {
        ambientRef.current.setVolume(0.1);
      }
      
      isVoicePlayingRef.current = true;
      await playBuffer(buffer, audioContext);
      isVoicePlayingRef.current = false;
      
      // Restore music volume after voice ends
      if (isMusicOn && !isPaused) {
        ambientRef.current.setVolume(0.4);
      }
    }
  };

  const updateTimers = () => {
    const now = Date.now();
    const delta = now - lastTickRef.current;

    if (delta >= 1000) {
      lastTickRef.current = now - (delta % 1000);

      remainingTimeRef.current -= 1;
      setRemainingTime(remainingTimeRef.current);

      if (remainingTimeRef.current <= 0) {
        onComplete();
        return;
      }

      phaseTimerRef.current -= 1;
      
      if (phaseTimerRef.current <= 0) {
        const nextIndex = (phaseIndexRef.current + 1) % pattern.phases.length;
        phaseIndexRef.current = nextIndex;
        phaseTimerRef.current = pattern.phases[nextIndex].duration;
        
        triggerVoice(nextIndex);
        setPhaseIndex(nextIndex);
      }
      
      setPhaseTimer(phaseTimerRef.current);
    }

    if (!isPaused) {
      requestRef.current = requestAnimationFrame(updateTimers);
    }
  };

  useEffect(() => {
    if (!isPaused) {
      triggerVoice(phaseIndexRef.current);
      lastTickRef.current = Date.now();
      requestRef.current = requestAnimationFrame(updateTimers);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPaused]);

  const currentPhase = pattern.phases[phaseIndex];

  const getScale = () => {
    if (currentPhase.type === 'Inhale') return 1.6;
    if (currentPhase.type === 'Hold') return 1.6;
    return 0.7;
  };

  const getCircleColor = () => {
    switch (currentPhase.type) {
      case 'Inhale': return 'bg-purple-400';
      case 'Hold': return 'bg-pink-400';
      case 'Exhale': return 'bg-fuchsia-400';
      case 'HoldOut': return 'bg-rose-400';
      default: return 'bg-purple-400';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-12 w-full h-full p-6 select-none relative overflow-hidden">
      {/* Immersive background aura */}
      <div className={`absolute inset-0 opacity-10 transition-colors duration-1000 ${getCircleColor()}`} />
      
      <div className="text-center h-24 flex flex-col justify-center relative z-10">
        <h2 
          className="text-4xl font-extrabold text-slate-900 mb-2 transition-all duration-700 transform"
          key={`text-${phaseIndex}`}
        >
          {currentPhase.instruction}
        </h2>
        <div className="flex items-center justify-center gap-2">
          <p className="text-xl text-slate-400 font-bold tabular-nums tracking-widest">{phaseTimer}s</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center h-72 w-72 z-10">
        <div className={`absolute w-full h-full rounded-full opacity-10 animate-ping duration-[4000ms] ${getCircleColor()}`}></div>
        <div className={`absolute w-4/5 h-4/5 rounded-full opacity-5 animate-pulse ${getCircleColor()}`}></div>
        
        <div 
          key={`circle-${phaseIndex}`}
          className={`w-32 h-32 rounded-full shadow-2xl transition-all shadow-purple-200/50 ${getCircleColor()}`}
          style={{ 
            transform: `scale(${getScale()})`,
            transitionTimingFunction: 'linear', 
            transitionDuration: `${currentPhase.duration * 1000}ms`
          }}
        />
      </div>

      <div className="w-full max-w-xs space-y-6 relative z-10">
        <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center gap-3">
             <span className="tabular-nums font-bold text-purple-600 bg-white/50 px-2 py-1 rounded-lg border border-purple-100/50">
              {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
            </span>
            <button 
              onClick={() => setIsMusicOn(!isMusicOn)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMusicOn ? 'bg-purple-100 text-purple-600 border border-purple-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
              title={isMusicOn ? "Mute Music" : "Unmute Music"}
            >
              <div className="relative">
                {isMusicOn && !isPaused && (
                  <span className="absolute -inset-1 rounded-full bg-purple-400/20 animate-ping"></span>
                )}
                <i className={`fa-solid ${isMusicOn ? 'fa-music' : 'fa-volume-mute'}`}></i>
              </div>
            </button>
          </div>
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="text-purple-600 bg-white shadow-sm border border-purple-100 px-4 py-2 rounded-2xl transition-all active:scale-90 flex items-center gap-2 font-bold"
          >
            {isPaused ? <i className="fa-solid fa-play"></i> : <i className="fa-solid fa-pause"></i>}
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
        <div className="h-2 bg-slate-200/50 rounded-full overflow-hidden backdrop-blur-sm">
          <div 
            className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all duration-1000 ease-linear"
            style={{ width: `${((totalDurationSeconds - remainingTime) / totalDurationSeconds) * 100}%` }}
          />
        </div>
      </div>

      <div className="relative z-10">
        <div className="px-6 py-2 rounded-full bg-white/50 border border-white/50 backdrop-blur-sm shadow-sm">
          <p className="text-slate-400 text-center text-[10px] font-bold uppercase tracking-[0.2em]">
            {pattern.name}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BreathingExercise;