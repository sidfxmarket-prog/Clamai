
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
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-[#FDFEFF] animate-in fade-in duration-1000">
      {/* Decorative Background Elements */}
      <div className="fixed top-[-10%] right-[-10%] w-[300px] h-[300px] bg-sky-100 rounded-full blur-[120px] opacity-60 pointer-events-none"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[300px] h-[300px] bg-indigo-50 rounded-full blur-[120px] opacity-60 pointer-events-none"></div>

      <div className="w-full max-w-sm z-10 space-y-8">
        {/* Branding Header */}
        <div className="text-center space-y-4">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-sky-400 rounded-[2.2rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-600 rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl shadow-sky-200/50 mb-2 transform group-hover:scale-105 transition-transform duration-500">
              <i className="fa-solid fa-leaf text-white text-3xl animate-pulse"></i>
            </div>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Calm Companion</h1>
            <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase opacity-80">The Art of Stillness</p>
          </div>
        </div>

        {/* Auth Container */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[3.5rem] p-3 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-white/80">
          
          {/* Tab Switcher */}
          <div className="flex p-1.5 bg-slate-50/50 rounded-[2.5rem] mb-3">
            <button 
              onClick={() => { setIsSignUp(false); setMessage(null); }}
              className={`flex-1 py-3.5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-500 ${!isSignUp ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => { setIsSignUp(true); setMessage(null); }}
              className={`flex-1 py-3.5 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all duration-500 ${isSignUp ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Sign Up
            </button>
          </div>

          <div className="px-6 pt-4 pb-8 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-slate-800">
                {isSignUp ? 'Create your space' : 'Welcome home'}
              </h2>
              <p className="text-slate-400 text-xs mt-1 font-medium">
                {isSignUp ? 'Begin your personalized journey' : 'Sign in to your sanctuary'}
              </p>
            </div>

            {message && (
              <div className={`p-4 rounded-[1.5rem] text-[11px] font-bold text-center animate-in zoom-in-95 duration-300 ${
                message.type === 'error' ? 'bg-red-50 text-red-500 border border-red-100/50' : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-sky-400 transition-colors">
                    <i className="fa-solid fa-envelope text-xs"></i>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50/50 border-none rounded-[1.5rem] pl-12 pr-5 py-4 text-sm text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all duration-300"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-sky-400 transition-colors">
                    <i className="fa-solid fa-lock text-xs"></i>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50/50 border-none rounded-[1.5rem] pl-12 pr-5 py-4 text-sm text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-sky-200 focus:bg-white transition-all duration-300"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-black uppercase tracking-[0.15em] py-4.5 rounded-[1.5rem] shadow-[0_12px_24px_-8px_rgba(14,165,233,0.4)] active:scale-[0.97] hover:scale-[1.01] transition-all duration-300 disabled:opacity-50 mt-4 flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>{isSignUp ? 'Get Started' : 'Enter Now'}</span>
                    <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center space-y-4">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
            Privacy Centric • Secure 256-bit
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
