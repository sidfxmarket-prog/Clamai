
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { supabase } from './services/supabaseClient';
import Home from './components/Home';
import RescueSession from './components/RescueSession';
import MoodTracker from './components/MoodTracker';
import CrisisResources from './components/CrisisResources';
import AIChat from './components/AIChat';
import LiveVoiceChat from './components/LiveVoiceChat';
import Auth from './components/Auth';

const Navigation = () => {
  const location = useLocation();
  const isRescue = location.pathname === '/rescue' || location.pathname === '/voice-chat';

  if (isRescue) return null;

  const navItems = [
    { path: '/', icon: 'fa-house', label: 'Home' },
    { path: '/mood', icon: 'fa-chart-line', label: 'Journal' },
    { path: '/chat', icon: 'fa-comment-dots', label: 'Calm AI' },
    { path: '/crisis', icon: 'fa-shield-heart', label: 'Help' },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 px-6 z-50 pointer-events-none">
      <nav className="max-w-md mx-auto bg-white/80 backdrop-blur-2xl border border-white/40 h-16 rounded-[2rem] flex justify-around items-center px-4 shadow-[0_8px_32px_rgba(0,0,0,0.08)] pointer-events-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path}
              to={item.path} 
              className={`relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ${isActive ? 'text-sky-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className={`fa-solid ${item.icon} text-lg mb-0.5`}></i>
              <span className={`text-[9px] font-bold uppercase tracking-widest transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 h-0'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-sky-600 rounded-full animate-pulse"></div>
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
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <HashRouter>
      <div className="fixed inset-0 bg-slate-50 flex justify-center items-center overflow-hidden">
        <main className="w-full h-full max-w-md bg-white relative shadow-2xl md:h-[90vh] md:rounded-[3rem] md:overflow-hidden overflow-hidden flex flex-col">
          <div className="flex-1 overflow-hidden relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/rescue" element={<RescueSession />} />
              <Route path="/mood" element={<MoodTracker />} />
              <Route path="/chat" element={<AIChat />} />
              <Route path="/voice-chat" element={<LiveVoiceChat />} />
              <Route path="/crisis" element={<CrisisResources />} />
            </Routes>
          </div>
          <Navigation />
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
