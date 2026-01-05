
import React, { useState } from 'react';
import { User } from '../../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CITIZEN' | 'ADMIN'>('CITIZEN');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password) {
      setError('Required telemetry data missing. Please fill all fields.');
      return;
    }

    // Direct access simulation: Creates a user session based on input
    const mockUser: User = {
      id: `usr_${Math.random().toString(36).substr(2, 9)}`,
      name,
      email,
      role,
      points: role === 'ADMIN' ? 0 : 750,
      level: role === 'ADMIN' ? 10 : 3,
      cityRank: role === 'ADMIN' ? 1 : 124,
      earnedBadgeIds: role === 'ADMIN' ? ['b4'] : ['b1'],
      redeemedRewardIds: [],
      pointHistory: [
        { id: 'tx_init', amount: role === 'ADMIN' ? 0 : 750, reason: 'System Initialization', date: new Date().toISOString() }
      ]
    };

    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] relative overflow-hidden p-6">
      {/* Background Ambience */}
      <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[160px] opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-purple-100 rounded-full blur-[160px] opacity-40"></div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-3xl border border-white rounded-[3.5rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] p-12 relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center mb-10">
          <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white text-4xl mx-auto mb-8 shadow-2xl shadow-blue-200 rotate-6 transform hover:rotate-0 transition-transform duration-500">
            🏛️
          </div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Civic Samadhan</h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.15em]">Municipal Intelligence</p>
        </div>

        <div className="flex bg-slate-100/50 p-1.5 rounded-2xl mb-8 border border-slate-100">
          <button 
            onClick={() => setRole('CITIZEN')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'CITIZEN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
          >
            Citizen Portal
          </button>
          <button 
            onClick={() => setRole('ADMIN')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'ADMIN' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
          >
            Municipal Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest p-4 rounded-2xl animate-in slide-in-from-top-2">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Identity</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              className="w-full px-6 py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
            <input
              type="email"
              placeholder="name@civic.gov"
              className="w-full px-6 py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Passkey</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-6 py-4 bg-white/50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 text-white mt-4 ${role === 'ADMIN' ? 'bg-slate-900 shadow-slate-200' : 'bg-blue-600 shadow-blue-200'}`}
          >
            Establish Link
          </button>
        </form>

        <p className="mt-10 text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
          Secure Civic Protocol Active
        </p>
      </div>
    </div>
  );
};
