
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import Home from './components/Home';
import RescueSession from './components/RescueSession';
import MoodTracker from './components/MoodTracker';
import CrisisResources from './components/CrisisResources';
import AIChat from './components/AIChat';
import LiveVoiceChat from './components/LiveVoiceChat';
import Profile from './components/Profile';
import Auth from './components/Auth';

const Navigation = () => {
  const location = useLocation();
  const isRescue = location.pathname === '/rescue' || location.pathname === '/voice-chat';

  if (isRescue) return null;

  const navItems = [
    { path: '/', icon: 'fa-house', label: 'Home' },
    { path: '/mood', icon: 'fa-feather', label: 'Journal' },
    { path: '/rescue', icon: 'fa-wind', label: 'Rescue', isBig: true },
    { path: '/chat', icon: 'fa-sparkles', label: 'AI' },
    { path: '/profile', icon: 'fa-user', label: 'Me' },
  ];

  return (
    <div className="fixed bottom-8 left-0 right-0 px-4 z-50 pointer-events-none">
      <nav className="max-w-md mx-auto glass h-20 rounded-[2.5rem] flex justify-between items-center px-4 shadow-[0_20px_50px_rgba(0,0,0,0.12)] pointer-events-auto relative">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          if (item.isBig) {
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className="relative flex flex-col items-center justify-center -mt-12 tap-active"
              >
                <div className="w-16 h-16 rounded-full bg-main-grad flex items-center justify-center text-white shadow-[0_12px_24px_rgba(167,139,250,0.4)] border-4 border-white transition-transform duration-300 hover:scale-105 active:scale-95">
                  <i className={`fa-solid ${item.icon} text-2xl`}></i>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest mt-2 bg-main-grad bg-clip-text text-transparent inline-block">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-500 tap-active ${isActive ? 'scale-110' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <div className={`relative flex items-center justify-center transition-all duration-500 ${isActive ? '-translate-y-1' : ''}`}>
                <i className={`fa-solid ${item.icon} text-lg ${isActive ? 'text-purple-600' : ''}`}></i>
                {isActive && (
                  <div className="absolute -inset-2 bg-purple-100/40 rounded-full -z-10 animate-pulse"></div>
                )}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest mt-1 transition-all duration-500 ${isActive ? 'opacity-100 scale-100 bg-main-grad bg-clip-text text-transparent inline-block' : 'opacity-0 scale-75 h-0 overflow-hidden'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1.5 h-1.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#fff7f0] flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fa-solid fa-leaf text-purple-400"></i>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <HashRouter>
      <div className="fixed inset-0 bg-[#fff7f0] flex justify-center items-center overflow-hidden">
        {/* Aesthetic dynamic background elements */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-100/30 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-pink-100/30 rounded-full blur-[120px] pointer-events-none"></div>

        <main className="w-full h-full max-w-md bg-white/40 backdrop-blur-sm relative md:h-[90vh] md:rounded-[3.5rem] md:overflow-hidden md:shadow-[0_40px_100px_rgba(0,0,0,0.1)] flex flex-col border border-white/60">
          <div className="flex-1 overflow-hidden relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rescue" element={<RescueSession />} />
              <Route path="/mood" element={<MoodTracker />} />
              <Route path="/chat" element={<AIChat />} />
              <Route path="/voice-chat" element={<LiveVoiceChat />} />
              <Route path="/crisis" element={<CrisisResources />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
          <Navigation />
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
