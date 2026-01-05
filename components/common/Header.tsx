
import React, { useState, useRef, useEffect } from 'react';
import { Notification } from '../../types';

interface HeaderProps {
  user: any;
  activePage: string;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, activePage, onLogout, notifications, onMarkAllRead }) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard';
      case 'new-report': return 'Report New Issue';
      case 'my-reports': return 'My Reports';
      case 'rewards': return 'Civic Rewards';
      case 'admin-dashboard': return 'Command Center';
      case 'analytics': return 'Detailed Insights';
      default: return 'Civic Samadhan';
    }
  };

  const getPageSub = () => {
    switch (activePage) {
      case 'dashboard': return 'Welcome back! Track and report civic issues';
      case 'new-report': return 'Help improve your community';
      case 'rewards': return 'Your achievements and rewards';
      default: return 'Municipal Intelligence Platform';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type: Notification['type']) => {
    switch (type) {
      case 'status': return '📋';
      case 'badge': return '🏆';
      case 'reward': return '🎁';
      case 'system': return '⚙️';
      default: return '🔔';
    }
  };

  return (
    <header className="bg-white border-b border-slate-50 px-8 h-24 flex items-center justify-between sticky top-0 z-40">
      <div className="animate-in fade-in slide-in-from-left-4 duration-500">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{getPageTitle()}</h2>
        <p className="text-sm text-slate-400 font-medium">{getPageSub()}</p>
      </div>

      <div className="flex items-center space-x-8">
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center relative transition-all duration-300 ${isNotifOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`} 
            title="Notifications"
          >
            <span className="text-xl">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in duration-300">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-4 w-96 bg-white rounded-[2rem] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50 animate-in slide-in-from-top-4 fade-in duration-300">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Inbox</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{unreadCount} unread signals</p>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={onMarkAllRead}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-6 border-b border-slate-50 last:border-0 flex items-start space-x-4 transition-colors hover:bg-slate-50/50 ${!n.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                           <p className={`text-xs font-black truncate ${!n.read ? 'text-slate-900' : 'text-slate-600'}`}>
                             {n.title}
                           </p>
                           <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap ml-2">
                             {formatTime(n.timestamp)}
                           </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 opacity-40 grayscale">📭</div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No active signals</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/50 text-center">
                 <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">View All Archive</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4 pl-8 border-l border-slate-100">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{user.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              {user.role === 'ADMIN' ? 'Municipal Officer' : `Level ${user.level} Citizen`}
            </p>
          </div>
          <button 
            onClick={onLogout}
            className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-100 hover:scale-105 transition-all group relative"
            title="Logout"
          >
            {user.name.charAt(0)}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-xs">🚪</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
