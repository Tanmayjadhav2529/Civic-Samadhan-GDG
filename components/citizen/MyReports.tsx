
import React, { useState } from 'react';
import { CivicReport, ReportStatus, Department, StatusHistoryItem } from '../../types';

interface MyReportsProps {
  reports: CivicReport[];
}

export const MyReports: React.FC<MyReportsProps> = ({ reports }) => {
  const [filter, setFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredReports = reports.filter(r => filter === 'ALL' || r.status === filter);

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.NEW: return 'bg-blue-50 text-blue-600 border-blue-100';
      case ReportStatus.IN_PROGRESS: return 'bg-amber-50 text-amber-600 border-amber-100';
      case ReportStatus.RESOLVED: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case ReportStatus.VERIFIED: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case ReportStatus.ESCALATED: return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getCategoryIcon = (category: Department) => {
    switch (category) {
      case Department.ELECTRICITY: return '💡';
      case Department.SANITATION: return '🗑️';
      case Department.ROADS: return '🛣️';
      case Department.WATER: return '💧';
      case Department.PARKS: return '🌳';
      default: return '📍';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">My Submissions</h2>
          <p className="text-sm text-slate-500 font-medium">Track the progress of your reported issues</p>
        </div>
        
        <div className="flex flex-wrap bg-white p-1 rounded-2xl border border-slate-100 shadow-sm self-start">
          {['ALL', ...Object.values(ReportStatus)].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                filter === s 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div 
              key={report.id} 
              className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group overflow-hidden"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-48 h-48 bg-slate-100 rounded-3xl overflow-hidden flex-shrink-0 relative">
                  {report.image ? (
                    <img src={report.image} className="w-full h-full object-cover" alt={report.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">
                      {getCategoryIcon(report.category)}
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-sm font-black text-slate-800 shadow-sm">
                    {getCategoryIcon(report.category)}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase border tracking-widest ${getStatusColor(report.status)}`}>
                      {report.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      SIGNAL ID: {report.id.slice(-6)}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {report.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed font-medium">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-slate-50">
                    <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400">
                      <span className="text-sm">📍</span>
                      <span className="truncate max-w-[200px]">{report.location.address}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-400">
                      <span className="text-sm">🕒</span>
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    {report.workerId && (
                      <div className="flex items-center space-x-2 text-[11px] font-black text-blue-500 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100/50">
                        <span className="text-sm">👤</span>
                        <span className="uppercase tracking-tighter">Specialist Assigned</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex md:flex-col items-center justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-50 pt-6 md:pt-0 md:pl-10 gap-6 min-w-[120px]">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Impact pts</p>
                    <p className="text-3xl font-black text-slate-800 tabular-nums">+{report.impactScore}</p>
                  </div>
                  <button 
                    onClick={() => toggleExpand(report.id)}
                    className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      expandedId === report.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                        : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    {expandedId === report.id ? 'Close Log' : 'Event Log'}
                  </button>
                </div>
              </div>

              {/* Status Timeline History */}
              {expandedId === report.id && (
                <div className="mt-8 pt-8 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center space-x-4 mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Timeline</h4>
                    <div className="h-px flex-1 bg-slate-100"></div>
                  </div>
                  <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                    {report.statusHistory.map((event, idx) => (
                      <div key={idx} className="relative group/item">
                        <div className={`absolute -left-8 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-all ${
                          idx === report.statusHistory.length - 1 ? 'bg-blue-600 scale-125 z-10 animate-pulse' : 'bg-slate-200'
                        }`}>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider ${getStatusColor(event.status)}`}>
                              {event.status.replace('_', ' ')}
                            </span>
                            <p className="text-sm font-bold text-slate-700 mt-2">{event.note}</p>
                          </div>
                          <p className="text-[10px] font-black text-slate-300 uppercase tabular-nums">
                            {new Date(event.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white border border-slate-100 rounded-[3rem] p-24 text-center space-y-6">
            <div className="text-7xl grayscale opacity-20 animate-bounce">📋</div>
            <div>
              <h4 className="text-2xl font-black text-slate-800">Operational Silence</h4>
              <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2 font-medium">
                No telemetry data matches the selected filter. Submit a report to initialize city tracking.
              </p>
            </div>
            <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 transition-all">
              Initiate Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
