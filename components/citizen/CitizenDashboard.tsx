
import React, { useEffect, useState } from 'react';
import { CivicReport, ReportStatus, User, Badge } from '../../types';

interface CitizenDashboardProps {
  user: User;
  reports: CivicReport[];
  onNavigate: (page: string) => void;
  recentImpact?: { points: number; newBadges: Badge[] } | null;
  onClearImpact?: () => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({ user, reports, onNavigate, recentImpact, onClearImpact }) => {
  const [showToast, setShowToast] = useState(false);
  const recentReports = reports.filter(r => r.reporterId === user.id).slice(0, 3);
  
  // Real-time calculation logic
  const progressPercent = Math.round(((user.points % 250) / 250) * 100);
  const pointsToNext = 250 - (user.points % 250);

  useEffect(() => {
    if (recentImpact) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
        if (onClearImpact) onClearImpact();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [recentImpact]);

  return (
    <div className="space-y-8 p-8 max-w-7xl mx-auto animate-in fade-in duration-500 relative">
      
      {/* Success Impact Overlay */}
      {showToast && recentImpact && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-6 animate-in zoom-in-95 fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] p-8 overflow-hidden relative group">
            <div className="absolute top-0 left-0 w-full h-1 cold-gradient"></div>
            
            <div className="flex items-center space-x-6 relative z-10">
              <div className="w-16 h-16 cold-gradient rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-200 animate-bounce">
                <span className="text-3xl">✨</span>
              </div>
              
              <div className="flex-1">
                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Impact Signal Received</h4>
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Transmission Successful</h3>
                <div className="flex items-center space-x-2 mt-1">
                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                   <p className="text-xs font-bold text-slate-500">Verified Submission • <span className="text-emerald-600">+{recentImpact.points} Impact Points</span></p>
                </div>
              </div>

              <button onClick={() => setShowToast(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">✕</button>
            </div>

            {recentImpact.newBadges.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Achievements Unlocked</p>
                <div className="flex flex-wrap gap-3">
                  {recentImpact.newBadges.map((badge, idx) => (
                    <div key={idx} className="flex items-center space-x-3 bg-blue-50/50 border border-blue-100 rounded-2xl px-4 py-3 animate-in zoom-in-50 duration-500" style={{ animationDelay: `${500 + (idx * 150)}ms` }}>
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="text-[10px] font-black text-slate-800 leading-none">{badge.title}</p>
                        <p className="text-[8px] font-bold text-blue-600 uppercase tracking-tighter mt-1">Official Recognition</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decorative background pulse */}
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button 
          onClick={() => onNavigate('new-report')}
          className="bg-blue-600 text-white p-8 rounded-3xl text-left shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform flex flex-col justify-between h-48"
        >
          <span className="text-3xl font-light">＋</span>
          <div>
            <h3 className="text-xl font-bold">Report Issue</h3>
            <p className="text-blue-100 text-sm">Submit a new civic problem</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('my-reports')}
          className="bg-white border border-slate-100 p-8 rounded-3xl text-left shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-48"
        >
          <span className="text-3xl text-slate-400 font-light">📋</span>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Track Reports</h3>
            <p className="text-slate-400 text-sm">View your submissions</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('rewards')}
          className="bg-purple-600 text-white p-8 rounded-3xl text-left shadow-lg shadow-purple-200 hover:scale-[1.02] transition-transform flex flex-col justify-between h-48"
        >
          <span className="text-3xl font-light">🎗</span>
          <div>
            <h3 className="text-xl font-bold">Rewards</h3>
            <p className="text-purple-100 text-sm">Check your achievements</p>
          </div>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Reports', value: reports.filter(r => r.reporterId === user.id).length, sub: 'All time', color: 'text-green-500' },
          { label: 'Verified', value: reports.filter(r => r.reporterId === user.id && r.status === ReportStatus.VERIFIED).length, sub: 'Successfully resolved', color: 'text-blue-500' },
          { label: 'Civic Score', value: user.points.toLocaleString(), sub: `Level ${user.level}`, color: 'text-purple-500' },
          { label: 'Badges Earned', value: user.earnedBadgeIds.length, sub: 'Achievements', color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <p className="text-slate-400 text-xs font-medium mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-slate-800">{stat.value}</p>
            <p className={`text-[10px] font-bold mt-1 ${stat.color}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reports List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Reports</h3>
          <div className="space-y-4">
            {recentReports.length > 0 ? recentReports.map((report) => (
              <div key={report.id} className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group hover:border-blue-200 transition-colors cursor-pointer">
                <div className="w-20 h-20 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                   {report.image ? <img src={report.image} className="w-full h-full object-cover" alt="Issue" /> : <div className="w-full h-full flex items-center justify-center opacity-30">📷</div>}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{report.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      report.status === ReportStatus.IN_PROGRESS ? 'bg-amber-100 text-amber-600' : 
                      report.status === ReportStatus.VERIFIED ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {report.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{report.description}</p>
                  <div className="flex items-center space-x-3 mt-2 text-[10px] text-slate-400">
                    <span className="font-semibold">{report.category}</span>
                    <span>•</span>
                    <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-slate-400 text-sm text-center py-8">No recent activity. Start by reporting an issue!</p>
            )}
          </div>
        </div>

        {/* Impact Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Impact Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-500">Level Progress</span>
                <span className="text-blue-600">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-400 text-center font-medium">{pointsToNext} points to Level {user.level + 1}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 p-8 rounded-3xl text-white shadow-lg shadow-orange-100">
            <h4 className="text-lg font-bold mb-2">Active Impact</h4>
            <div className="flex items-center space-x-3 bg-white/20 p-4 rounded-2xl backdrop-blur-md">
              <span className="text-3xl">✨</span>
              <div>
                <p className="text-sm font-bold">Real-time Citizen</p>
                <p className="text-[10px] text-white/80">Every report makes a difference.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
