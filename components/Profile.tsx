
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserStats, Badge } from '../types';
import { fetchStats, getXPForNextLevel, BADGES } from '../services/gamificationService';
import { supabase } from '../services/supabaseClient';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      const s = await fetchStats();
      setStats(s);
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!stats) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-sky-100 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const xpPercent = (stats.xp / getXPForNextLevel(stats.level)) * 100;

  const renderGarden = () => {
    const icons = ['🌱', '🌿', '☘️', '🍀', '🌸', '🌼', '🌻', '🌲', '🌳', '🌈'];
    const activeIcons = icons.slice(0, Math.min(stats.level, icons.length));
    
    return (
      <div className="flex flex-wrap justify-center gap-4 py-8">
        {activeIcons.map((emoji, i) => (
          <div key={i} className="text-4xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
            {emoji}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 scroll-container page-enter pb-32">
      <header className="px-8 pt-12 pb-6 bg-white border-b border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-[1.5rem] flex items-center justify-center text-white text-xl font-black shadow-lg shadow-sky-100">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Your Journey</h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"
            title="Logout"
          >
            <i className="fa-solid fa-arrow-right-from-bracket text-sm"></i>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-sky-600 uppercase tracking-widest">Level {stats.level}</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{stats.xp} / {getXPForNextLevel(stats.level)} XP</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all duration-1000"
              style={{ width: `${xpPercent}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8 space-y-8">
        {/* Quick Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Sessions</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalSessions}</p>
          </div>
          <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Streak</p>
            <div className="flex items-center justify-center gap-2">
              <i className="fa-solid fa-fire text-sky-500 text-sm"></i>
              <p className="text-2xl font-bold text-slate-900">{stats.streak}d</p>
            </div>
          </div>
        </section>

        {/* Growth Garden Visualization */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-slate-800 font-black text-[10px] uppercase tracking-widest">Growth Visualization</h3>
            <span className="text-[10px] text-sky-500 font-bold uppercase tracking-widest">Garden Progress</span>
          </div>
          <div className="bg-slate-50/50 rounded-[2rem] border border-slate-100 min-h-[160px] flex items-center justify-center">
            {renderGarden()}
          </div>
          <p className="text-[9px] text-slate-400 text-center mt-4 font-bold uppercase tracking-widest px-4 leading-relaxed">
            Your inner garden flourishes as you level up. Keep practicing to see new growth.
          </p>
        </section>

        {/* Achievement Badges */}
        <section>
          <h3 className="text-slate-800 font-black text-[10px] uppercase tracking-widest mb-4 ml-2">Achievements</h3>
          <div className="grid grid-cols-2 gap-4">
            {BADGES.map((badge) => {
              const isUnlocked = stats.badges.includes(badge.id);
              return (
                <div key={badge.id} className={`p-5 rounded-[2rem] border transition-all flex flex-col items-center text-center ${isUnlocked ? 'bg-white border-sky-100 shadow-sm' : 'bg-slate-100/50 border-slate-100 opacity-50 grayscale'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 text-lg ${isUnlocked ? 'bg-sky-50 text-sky-500 shadow-inner' : 'bg-slate-200 text-slate-400'}`}>
                    <i className={`fa-solid ${badge.icon}`}></i>
                  </div>
                  <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight mb-1">{badge.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold leading-tight">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Profile;
