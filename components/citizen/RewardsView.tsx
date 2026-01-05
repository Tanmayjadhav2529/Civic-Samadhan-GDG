
import React, { useEffect, useState, useRef } from 'react';
import { User, Reward, Badge, PointTransaction } from '../../types';

interface RewardsViewProps {
  user: User;
  availableRewards: Reward[];
  allBadges: Badge[];
  onRedeem: (reward: Reward) => void;
}

export const RewardsView: React.FC<RewardsViewProps> = ({ user, availableRewards, allBadges, onRedeem }) => {
  const [displayPoints, setDisplayPoints] = useState(user.points);
  const [isPinging, setIsPinging] = useState(false);
  const [prevLevel, setPrevLevel] = useState(user.level);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  const pointsToNextLevel = 250 - (user.points % 250);
  const progressPercent = ((user.points % 250) / 250) * 100;

  // Points Ticker Animation & Ping Effect
  useEffect(() => {
    if (user.points !== displayPoints) {
      setIsPinging(true);
      const timer = setTimeout(() => setIsPinging(false), 600);
      
      // Animate the number counting up/down
      const start = displayPoints;
      const end = user.points;
      const duration = 500;
      let startTime: number | null = null;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        setDisplayPoints(current);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayPoints(end);
        }
      };
      requestAnimationFrame(animate);

      return () => clearTimeout(timer);
    }
  }, [user.points]);

  // Level Up Detection
  useEffect(() => {
    if (user.level > prevLevel) {
      setShowLevelUp(true);
      const timer = setTimeout(() => setShowLevelUp(false), 4000);
      setPrevLevel(user.level);
      return () => clearTimeout(timer);
    }
    setPrevLevel(user.level);
  }, [user.level]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20 relative">
      
      {/* Level Up Celebration Toast */}
      {showLevelUp && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] animate-in zoom-in-95 fade-in slide-in-from-top-8 duration-700">
          <div className="bg-slate-900 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex items-center space-x-6 border border-white/10 backdrop-blur-xl">
             <div className="text-4xl animate-bounce">🆙</div>
             <div>
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Promotion Achieved</h4>
                <p className="text-xl font-black">Now Level {user.level} Citizen</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1">New municipal perks unlocked in your profile.</p>
             </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Civic Rewards</h2>
          <p className="text-slate-500 mt-1 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></span>
            Real-time synchronization active
          </p>
        </div>
        <div className={`bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3 transition-all duration-300 ${isPinging ? 'scale-110 border-blue-200 shadow-blue-100 shadow-xl' : 'hover:shadow-md'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black transition-colors ${isPinging ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>P</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Balance</p>
            <p className="text-xl font-black text-slate-800 tabular-nums">
              {displayPoints.toLocaleString()} <span className="text-xs font-bold text-slate-300 ml-1">PTS</span>
            </p>
          </div>
        </div>
      </div>

      {/* Profile & Leveling Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center space-x-8 mb-12">
              <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center text-4xl border border-white/20 backdrop-blur shadow-xl transition-transform group-hover:scale-105 relative">
                {user.name.charAt(0)}
                {isPinging && <span className="absolute inset-0 bg-white/20 rounded-[2rem] animate-ping"></span>}
              </div>
              <div>
                <h3 className="text-4xl font-black tracking-tight">{user.name}</h3>
                <div className="flex items-center space-x-3 mt-2">
                  <span className={`bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/20 tracking-wide uppercase transition-transform ${showLevelUp ? 'scale-125 bg-blue-400' : ''}`}>Level {user.level}</span>
                  <span className="text-white/60 text-xs font-medium">• {user.email}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-12 pt-8 border-t border-white/10">
              <div className="animate-in slide-in-from-bottom-2 duration-300 delay-100">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">City Rank</p>
                <p className="text-4xl font-black italic">#{user.cityRank}</p>
              </div>
              <div className="animate-in slide-in-from-bottom-2 duration-300 delay-200">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Badges</p>
                <p className="text-4xl font-black italic">{user.earnedBadgeIds.length}</p>
              </div>
              <div className="animate-in slide-in-from-bottom-2 duration-300 delay-300">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">Impact pts</p>
                <p className="text-4xl font-black italic tabular-nums">{displayPoints}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -mr-48 -mt-48 blur-[100px]"></div>
        </div>

        <div className="lg:col-span-4 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-slate-800 uppercase text-xs tracking-widest">Level Progression</h4>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-colors ${isPinging ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden mb-6 border border-slate-100 shadow-inner relative">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progressPercent}%` }}
              >
                 <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-[-20deg]"></div>
              </div>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              <span className="text-blue-600 font-bold transition-all">{pointsToNextLevel} points</span> until Level {user.level + 1}
            </p>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-50 relative z-10">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Upcoming Milestone</p>
            <div className="flex items-center space-x-4">
               <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-xl shadow-sm group-hover:rotate-12 transition-transform">🏆</div>
               <div>
                  <p className="text-xs font-bold text-slate-700">Next Reward Unlock</p>
                  <p className="text-[10px] text-slate-400">Civic Tax Rebate Eligible at Level 10</p>
               </div>
            </div>
          </div>
          {/* Animated Background Pulse on Point Change */}
          {isPinging && <div className="absolute inset-0 bg-blue-50/30 animate-pulse pointer-events-none"></div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Points History Record */}
        <div className="lg:col-span-1 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold text-slate-800">Points Record</h3>
          </div>
          <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              {user.pointHistory.length > 0 ? user.pointHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${tx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                      {tx.amount > 0 ? '＋' : '－'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{tx.reason}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-black tabular-nums ${tx.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                </div>
              )) : (
                <p className="text-center text-slate-400 py-10 text-sm">No transactions yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="text-xl font-bold text-slate-800">Available Redemptions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableRewards.map((reward) => {
              const isRedeemed = user.redeemedRewardIds.includes(reward.id);
              const canAfford = user.points >= reward.cost;
              return (
                <div key={reward.id} className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between transition-all group ${isRedeemed ? 'opacity-60 bg-slate-50' : 'hover:shadow-xl hover:border-blue-200'}`}>
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] mx-auto flex items-center justify-center text-4xl mb-6 shadow-inner group-hover:scale-110 transition-transform">
                      {reward.icon}
                    </div>
                    <h5 className="font-bold text-slate-800">{reward.title}</h5>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 leading-relaxed px-4">{reward.description}</p>
                  </div>
                  <button 
                    onClick={() => onRedeem(reward)}
                    disabled={isRedeemed || !canAfford}
                    className={`w-full py-4 rounded-2xl text-xs font-black transition-all shadow-lg relative overflow-hidden ${
                      isRedeemed 
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                        : canAfford
                          ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 active:translate-y-0'
                          : 'bg-slate-50 text-slate-300 border border-slate-100 shadow-none'
                    }`}
                  >
                    {isRedeemed ? 'REDEEMED' : `${reward.cost} PTS`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Badge Gallery */}
      <section>
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-bold text-slate-800">Official Badges</h3>
           <div className="h-px flex-1 mx-8 bg-slate-100"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {allBadges.map((badge) => {
            const isEarned = user.earnedBadgeIds.includes(badge.id);
            return (
              <div key={badge.id} className={`p-10 rounded-[2.5rem] border text-center transition-all group ${
                isEarned 
                  ? 'bg-white border-slate-100 shadow-sm' 
                  : 'bg-slate-50 border-transparent opacity-40 grayscale'
              }`}>
                <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-5xl mb-6 group-hover:rotate-12 transition-transform shadow-inner ${isEarned ? 'bg-blue-50' : 'bg-slate-100'} relative`}>
                  {badge.icon}
                  {isEarned && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white animate-in zoom-in duration-300">✓</div>
                  )}
                </div>
                <h6 className="font-bold text-slate-800">{badge.title}</h6>
                <p className="text-[10px] text-slate-400 mt-2 font-medium leading-tight h-8">{badge.description}</p>
                <div className={`mt-4 pt-4 border-t border-slate-50 text-[9px] font-black uppercase tracking-widest ${isEarned ? 'text-blue-500' : 'text-slate-300'}`}>
                  {isEarned ? 'UNLOCKED' : badge.requirementDescription}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-150%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
};
