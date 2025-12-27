
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-8 bg-[#fffbf0] relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-main-grad opacity-[0.03] blur-[150px] pointer-events-none"></div>

      <div className="w-full max-w-sm z-10 space-y-12">
        <div className="text-center space-y-6">
          <div className="relative inline-block group float">
            <div className="absolute inset-0 bg-main-grad rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
            <div className="relative w-24 h-24 bg-main-grad rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl">
              <i className="fa-solid fa-sparkles text-white text-4xl"></i>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Companion</h1>
            <p className="text-purple-400 text-sm font-bold tracking-[0.4em] uppercase opacity-60">The Art of Stillness</p>
          </div>
        </div>

        <div className="glass rounded-[3.5rem] p-4 shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-white/60">
          <div className="flex p-2 bg-purple-50/50 rounded-[2.5rem] mb-6">
            <button 
              onClick={() => { setIsSignUp(false); setMessage(null); }}
              className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${!isSignUp ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => { setIsSignUp(true); setMessage(null); }}
              className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${isSignUp ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="px-6 pb-10 space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-slate-800">
                {isSignUp ? 'Begin your journey' : 'Welcome back'}
              </h2>
              <p className="text-slate-400 text-[11px] mt-2 font-bold uppercase tracking-widest">
                {isSignUp ? 'personalized support awaits' : 'your sanctuary is ready'}
              </p>
            </div>

            {message && (
              <div className={`p-5 rounded-[1.8rem] text-[11px] font-black text-center animate-in zoom-in-95 duration-300 ${
                message.type === 'error' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-purple-400 transition-colors">
                    <i className="fa-solid fa-at text-sm"></i>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-50 rounded-[2rem] pl-14 pr-6 py-5 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-500"
                    placeholder="name@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-5">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-300 group-focus-within:text-purple-400 transition-colors">
                    <i className="fa-solid fa-shield-halved text-sm"></i>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-50 rounded-[2rem] pl-14 pr-6 py-5 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white font-black uppercase tracking-[0.3em] py-6 rounded-[2rem] shadow-2xl active:scale-[0.97] transition-all duration-500 disabled:opacity-20 mt-6 flex items-center justify-center gap-4 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="text-[11px]">{isSignUp ? 'Create Space' : 'Enter Sanctuary'}</span>
                    <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-2 transition-transform"></i>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-300 font-bold uppercase tracking-[0.5em]">
          Cloud Synced • Private
        </p>
      </div>
    </div>
  );
};

export default Auth;