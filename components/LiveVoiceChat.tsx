
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

// Manually implementing encode/decode as per instructions
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveVoiceChat: React.FC = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const SYSTEM_INSTRUCTION = `You are a calm, compassionate mental health companion. 
  The user is speaking with you via voice. Speak softly and kindly. 
  Keep your responses concise and soothing. Avoid medical advice. 
  Help the user feel safe and heard.`;

  const cleanup = () => {
    if (sessionRef.current) {
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    if (audioContextsRef.current) {
      audioContextsRef.current.input.close();
      audioContextsRef.current.output.close();
      audioContextsRef.current = null;
    }
  };

  useEffect(() => {
    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextsRef.current = { input: inputCtx, output: outputCtx };

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              setIsConnected(true);
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
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
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                setIsModelSpeaking(true);
                const ctx = audioContextsRef.current?.output;
                if (!ctx) return;

                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                const source = ctx.createBufferSource();
                source.buffer = buffer;
                source.connect(ctx.destination);
                source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
                  if (sourcesRef.current.size === 0) setIsModelSpeaking(false);
                });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsModelSpeaking(false);
              }
            },
            onerror: (e) => {
              console.error('Live Error:', e);
              setError("Connection error. Please try again.");
            },
            onclose: () => {
              setIsConnected(false);
            },
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
            },
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        });

        sessionRef.current = await sessionPromise;
      } catch (err) {
        console.error("Failed to start session:", err);
        setError("Could not access microphone or connect to AI.");
      }
    };

    startSession();
    return cleanup;
  }, []);

  const handleEndCall = () => {
    cleanup();
    navigate('/chat');
  };

  const initiateExit = () => {
    if (isConnected) {
      setShowExitConfirm(true);
    } else {
      handleEndCall();
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px] transition-all duration-1000 ${isModelSpeaking ? 'scale-125 opacity-30' : 'scale-100 opacity-20'}`}></div>
      
      {/* Top Header */}
      <div className="absolute top-12 left-0 right-0 px-8 flex justify-between items-center z-20">
        <button 
          onClick={initiateExit}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
        </div>
        <div className="w-12 h-12"></div> {/* Spacer */}
      </div>

      {/* Main Visualizer */}
      <div className="relative flex flex-col items-center justify-center gap-12 z-10">
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Animated Circles */}
          <div className={`absolute inset-0 rounded-full border-2 border-sky-400/20 transition-all duration-1000 ${isConnected ? 'animate-ping' : ''}`}></div>
          <div className={`absolute inset-4 rounded-full border border-sky-400/30 transition-all duration-[2000ms] ${isConnected ? 'animate-pulse' : ''}`}></div>
          
          <div 
            className={`w-40 h-40 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 shadow-[0_0_50px_rgba(56,189,248,0.3)] transition-all duration-500 transform ${isModelSpeaking ? 'scale-110 shadow-[0_0_80px_rgba(56,189,248,0.5)]' : 'scale-95'}`}
          >
          </div>
          
          {/* Speaking Indicator */}
          {isModelSpeaking && (
             <div className="absolute -bottom-8 bg-sky-500 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce">
               Companion Speaking
             </div>
          )}
        </div>

        <div className="text-center space-y-4 max-w-[280px]">
          <h2 className="text-2xl font-extrabold tracking-tight">
            {isConnected ? "I'm listening..." : "Joining Workspace"}
          </h2>
          <p className="text-white/50 text-sm leading-relaxed">
            {error || "Speak freely about what's on your mind. I'm here for you."}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-8 z-20">
        <button 
          onClick={initiateExit}
          className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-500/20 active:scale-90 transition-all"
        >
          <i className="fa-solid fa-phone-slash text-2xl"></i>
        </button>
      </div>

      {/* Audio Visualizer Bar at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 flex gap-0.5 px-0.5">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i} 
            className="flex-1 bg-sky-400/30 rounded-t-full transition-all duration-150"
            style={{ 
              height: isConnected ? `${Math.random() * 100}%` : '0%',
              opacity: isModelSpeaking ? 0.8 : 0.2
            }}
          ></div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 max-w-xs w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-extrabold text-white text-center mb-2">End Session?</h3>
            <p className="text-slate-400 text-sm text-center mb-8">
              Are you sure you want to leave this session? Your current progress will be lost.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => setShowExitConfirm(false)}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all"
              >
                Stay Here
              </button>
              <button 
                onClick={handleEndCall}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-red-500/20"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveVoiceChat;
