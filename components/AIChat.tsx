
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { getCalmResponse } from '../services/geminiService';
import { getSpeechBuffer, playBuffer } from '../services/voiceService';
import { ChatMessage } from '../types';

// Voice logic helpers
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

const AIChat: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: 'Hi, I’m your Calm Companion. Take a deep breath. How can I support you right now?',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Live Mode Refs
  const liveSessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping, isLiveMode]);

  // Cleanup Live Session on unmount
  useEffect(() => {
    return () => {
      stopLiveMode();
    };
  }, []);

  const stopLiveMode = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setIsLiveMode(false);
  };

  const startLiveMode = async () => {
    try {
      setIsLiveMode(true);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
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
            // Handle transcriptions
            if (message.serverContent?.inputTranscription) {
              currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userText = currentInputTranscriptionRef.current;
              const modelText = currentOutputTranscriptionRef.current;
              
              if (userText || modelText) {
                setMessages(prev => [
                  ...prev,
                  ...(userText ? [{ role: 'user' as const, text: userText, timestamp: Date.now() }] : []),
                  ...(modelText ? [{ role: 'model' as const, text: modelText, timestamp: Date.now() }] : [])
                ]);
              }
              currentInputTranscriptionRef.current = '';
              currentOutputTranscriptionRef.current = '';
            }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Live Error:', e);
            stopLiveMode();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are a calm, compassionate mental health companion. Respond briefly and kindly.',
        }
      });

      liveSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start Live Mode:", err);
      setIsLiveMode(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLiveMode) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const userMsg: ChatMessage = { 
      role: 'user', 
      text: input,
      timestamp: Date.now()
    };
    
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    const responseText = await getCalmResponse(newHistory);
    
    const modelMsg: ChatMessage = { 
      role: 'model', 
      text: responseText,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, modelMsg]);
    setIsTyping(false);

    if (isVoiceEnabled && audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      const buffer = await getSpeechBuffer(responseText, audioContextRef.current);
      if (buffer) {
        await playBuffer(buffer, audioContextRef.current);
      }
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-white/40 page-enter">
      <header className="px-8 pt-12 pb-6 glass border-b border-white/20 sticky top-0 z-20 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg transition-colors duration-500 ${isLiveMode ? 'bg-pink-500' : 'bg-main-grad'}`}>
              <i className={`fa-solid ${isLiveMode ? 'fa-microphone-lines animate-pulse' : 'fa-sparkles'} text-xl`}></i>
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full transition-colors ${isLiveMode ? 'bg-pink-400' : 'bg-emerald-400'}`}></div>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 leading-none">{isLiveMode ? 'Live Voice' : 'Calm AI'}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveMode ? 'bg-pink-400' : 'bg-emerald-400'}`}></span>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{isLiveMode ? 'Streaming' : 'Ready to Chat'}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isLiveMode && (
            <button 
              onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all tap-active ${isVoiceEnabled ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-white text-slate-400 border border-slate-100'}`}
            >
              <i className={`fa-solid ${isVoiceEnabled ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
            </button>
          )}
          <button 
            onClick={isLiveMode ? stopLiveMode : startLiveMode}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center tap-active transition-all ${isLiveMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white text-pink-500 border border-pink-100'}`}
          >
            <i className={`fa-solid ${isLiveMode ? 'fa-phone-slash' : 'fa-microphone-lines'}`}></i>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-container" ref={scrollRef}>
        {isLiveMode && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-microphone-lines text-3xl text-pink-400"></i>
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Speak freely. I am listening.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-4 duration-500`}
          >
            <div 
              className={`max-w-[85%] px-6 py-4 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-[2rem] rounded-tr-none shadow-2xl' 
                  : 'bg-white text-slate-800 rounded-[2rem] rounded-tl-none shadow-sm border border-slate-50'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] font-black text-slate-300 mt-2 mx-3 uppercase tracking-widest">
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white px-6 py-5 rounded-[2rem] rounded-tl-none shadow-sm border border-slate-50">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-purple-200 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-transparent sticky bottom-24 z-10">
        {isLiveMode ? (
          <div className="flex flex-col items-center gap-4 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex gap-1 h-8 items-center">
              {[...Array(12)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-pink-400 rounded-full animate-pulse" 
                  style={{ 
                    height: `${20 + Math.random() * 80}%`,
                    animationDelay: `${i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
            <button 
              onClick={stopLiveMode}
              className="px-8 py-4 bg-rose-500 text-white rounded-full font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-200 flex items-center gap-3 active:scale-95 transition-all"
            >
              <i className="fa-solid fa-phone-slash"></i>
              End Voice Session
            </button>
          </div>
        ) : (
          <div className="glass p-3 rounded-[2.5rem] border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex gap-3 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-transparent px-5 py-2 outline-none text-sm text-slate-700 placeholder:text-slate-300"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all shadow-lg"
            >
              <i className="fa-solid fa-arrow-up"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIChat;
