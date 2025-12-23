
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCalmResponse } from '../services/geminiService';
import { ChatMessage } from '../types';

const AIChat: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi, I’m your Calm Companion. Take a deep breath. How can I support you right now?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsTyping(true);

    const responseText = await getCalmResponse(newHistory);
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsTyping(false);
  };

  return (
    <div className="h-full flex flex-col bg-white page-enter">
      <header className="px-8 pt-12 pb-4 bg-white/80 backdrop-blur-md border-b border-slate-50 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-500">
              <i className="fa-solid fa-robot"></i>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Calm AI</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Listening now</p>
          </div>
        </div>
        
        <button 
          onClick={() => navigate('/voice-chat')}
          className="bg-sky-50 text-sky-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-sky-100 transition-colors shadow-sm"
        >
          <i className="fa-solid fa-microphone-lines"></i>
          Voice
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-container" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div 
              className={`max-w-[85%] px-5 py-3.5 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-900 text-white rounded-[2rem] rounded-tr-none shadow-lg' 
                  : 'bg-slate-100 text-slate-800 rounded-[2rem] rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-5 py-4 rounded-[2rem] rounded-tl-none">
              <div className="flex gap-1.5">
                <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 pt-2 bg-white sticky bottom-24 z-10">
        <div className="flex gap-2 bg-slate-50 p-2 rounded-[2rem] border border-slate-100 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Write something..."
            className="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-slate-700"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="w-11 h-11 rounded-full bg-sky-500 text-white flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all shadow-lg shadow-sky-100"
          >
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        </div>
        <p className="text-[9px] font-bold text-center text-slate-300 mt-3 uppercase tracking-widest">
          AI generated support • Not medical advice
        </p>
      </div>
    </div>
  );
};

export default AIChat;
