
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { CivicReport, ReportStatus, Department, Worker } from '../../types';

// Declare Leaflet global
declare const L: any;

interface AdminDashboardProps {
  reports: CivicReport[];
  workers: Worker[];
  onUpdateStatus: (id: string, status: ReportStatus) => void;
  onAssignWorker: (reportId: string, workerId: string) => void;
  initialTab?: 'heatmap' | 'board' | 'analytics';
}

interface MapCluster {
  id: string;
  reports: CivicReport[];
  center: { lat: number; lng: number };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  reports, 
  workers, 
  onUpdateStatus, 
  onAssignWorker,
  initialTab = 'board'
}) => {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'board' | 'analytics'>(initialTab);
  const [selectedCluster, setSelectedCluster] = useState<MapCluster | null>(null);
  const [activeReportInModal, setActiveReportInModal] = useState<CivicReport | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  
  const mapRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Sync activeTab with initialTab if it changes from outside
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Board Data Partitioning
  const boardData = useMemo(() => ({
    [ReportStatus.NEW]: reports.filter(r => r.status === ReportStatus.NEW),
    [ReportStatus.IN_PROGRESS]: reports.filter(r => r.status === ReportStatus.IN_PROGRESS),
    [ReportStatus.RESOLVED]: reports.filter(r => r.status === ReportStatus.RESOLVED),
    [ReportStatus.VERIFIED]: reports.filter(r => r.status === ReportStatus.VERIFIED),
  }), [reports]);

  // Analytics Aggregation
  const analyticsData = useMemo(() => {
    const pieData = Object.values(Department).map(dept => ({
      name: dept,
      value: reports.filter(r => r.category === dept).length
    })).filter(d => d.value > 0);

    const barData = Object.values(Department).map(dept => ({
      name: dept,
      total: reports.filter(r => r.category === dept).length,
      resolved: reports.filter(r => r.category === dept && (r.status === ReportStatus.RESOLVED || r.status === ReportStatus.VERIFIED)).length,
      active: reports.filter(r => r.category === dept && (r.status === ReportStatus.NEW || r.status === ReportStatus.IN_PROGRESS)).length
    }));

    const timeTrend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
      return {
        name: dateStr,
        volume: reports.filter(r => new Date(r.createdAt).toDateString() === d.toDateString()).length
      };
    });

    return { pieData, barData, timeTrend };
  }, [reports]);

  const clusters = useMemo(() => {
    const CLUSTER_THRESHOLD = 0.012; 
    const result: MapCluster[] = [];
    reports.forEach(report => {
      let joined = false;
      for (const cluster of result) {
        const dist = Math.sqrt(Math.pow(report.location.lat - cluster.center.lat, 2) + Math.pow(report.location.lng - cluster.center.lng, 2));
        if (dist < CLUSTER_THRESHOLD) {
          cluster.reports.push(report);
          joined = true;
          break;
        }
      }
      if (!joined) {
        result.push({ id: `c-${Math.random().toString(36).substr(2, 5)}`, reports: [report], center: { ...report.location } });
      }
    });
    return result;
  }, [reports]);

  useEffect(() => {
    const checkL = setInterval(() => { if (typeof L !== 'undefined') { setIsMapReady(true); clearInterval(checkL); } }, 100);
    return () => clearInterval(checkL);
  }, []);

  useEffect(() => {
    if (activeTab === 'heatmap' && isMapReady && mapContainerRef.current && !mapRef.current) {
      const centerLat = reports.length > 0 ? reports[0].location.lat : 12.9716;
      const centerLng = reports.length > 0 ? reports[0].location.lng : 77.5946;
      mapRef.current = L.map(mapContainerRef.current, { zoomControl: true, attributionControl: false }).setView([centerLat, centerLng], 13);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(mapRef.current);
      markerGroupRef.current = L.layerGroup().addTo(mapRef.current);
    }
    if (mapRef.current && markerGroupRef.current && isMapReady) {
      markerGroupRef.current.clearLayers();
      clusters.forEach(cluster => {
        const isCluster = cluster.reports.length > 1;
        const iconHtml = isCluster 
          ? `<div class="cluster-marker w-10 h-10 border-2 border-white shadow-lg flex items-center justify-center bg-indigo-600 text-white font-black rounded-full">${cluster.reports.length}</div>`
          : `<div class="w-6 h-6 ${cluster.reports[0].priority === 'critical' ? 'bg-red-600' : 'bg-blue-600'} rounded-full border-2 border-white shadow-md"></div>`;
        const icon = L.divIcon({ html: iconHtml, className: '', iconSize: [isCluster ? 40 : 24, isCluster ? 40 : 24] });
        L.marker([cluster.center.lat, cluster.center.lng], { icon }).addTo(markerGroupRef.current).on('click', () => {
          setSelectedCluster(cluster);
          setActiveReportInModal(cluster.reports[0]);
        });
      });
    }
  }, [activeTab, clusters, reports, isMapReady]);

  const closeModal = () => { setSelectedCluster(null); setActiveReportInModal(null); };

  const columns = [
    { status: ReportStatus.NEW, label: 'New', color: 'bg-blue-500', items: boardData[ReportStatus.NEW] },
    { status: ReportStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-amber-500', items: boardData[ReportStatus.IN_PROGRESS] },
    { status: ReportStatus.RESOLVED, label: 'Resolved', color: 'bg-emerald-500', items: boardData[ReportStatus.RESOLVED] },
    { status: ReportStatus.VERIFIED, label: 'Verified', color: 'bg-purple-600', items: boardData[ReportStatus.VERIFIED] },
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 pb-20 relative min-h-screen bg-[#f8fafc]">
      
      {/* Detail Modal */}
      {selectedCluster && activeReportInModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={closeModal}></div>
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden relative z-[110]">
            <div className="flex-1 overflow-y-auto p-8 bg-white">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">{activeReportInModal.id}</span>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${activeReportInModal.status === ReportStatus.NEW ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-teal-50 text-teal-600 border-teal-100'}`}>{activeReportInModal.status}</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{activeReportInModal.title}</h3>
                </div>
                <button onClick={closeModal} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">✕</button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="aspect-video bg-slate-100 rounded-3xl overflow-hidden border border-slate-100 relative shadow-inner">
                    {activeReportInModal.image ? <img src={activeReportInModal.image} className="w-full h-full object-cover" alt="Evidence" /> : <div className="w-full h-full flex items-center justify-center opacity-20 text-5xl">📷</div>}
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{activeReportInModal.description}</p>
                    <div className="pt-4 border-t border-slate-200/50 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest space-y-2">
                       <p>📍 {activeReportInModal.location.address}</p>
                       <p>🕒 {new Date(activeReportInModal.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Operational Control</h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-3">Update Status</label>
                      <select className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500" value={activeReportInModal.status} onChange={(e) => onUpdateStatus(activeReportInModal!.id, e.target.value as ReportStatus)}>
                        {Object.values(ReportStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-3">Assign Professional</label>
                      <select className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500" value={activeReportInModal.workerId || ''} onChange={(e) => onAssignWorker(activeReportInModal!.id, e.target.value)}>
                        <option value="">Unassigned</option>
                        {workers.filter(w => w.dept === activeReportInModal!.category).map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} {w.status === 'available' ? '🟢' : '🔴'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 mb-8">
        <div className="flex space-x-12">
          {[
            { id: 'board', label: 'Task Board', icon: '📋' },
            { id: 'heatmap', label: 'Heatmap Overview', icon: '📖' },
            { id: 'analytics', label: 'Analytics', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 text-sm font-medium transition-all relative ${activeTab === tab.id ? 'text-purple-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <div className="flex items-center space-x-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </div>
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'board' && (
        <div className="space-y-8">
          {/* Summary Headers */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {columns.map(col => (
              <div key={col.status} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                  <span className="text-slate-600 font-medium text-sm">{col.label}</span>
                </div>
                <div className="text-4xl font-bold text-slate-900">{col.items.length}</div>
              </div>
            ))}
          </div>

          {/* Kanban Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            {columns.map(col => (
              <div key={col.status} className="space-y-4">
                <div className="flex items-center justify-between px-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">{col.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{col.items.length}</span>
                </div>
                
                <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
                  {col.items.length > 0 ? col.items.map(r => {
                    const assignedWorker = r.workerId ? workers.find(w => w.id === r.workerId) : null;
                    const availableWorkersInDept = workers.filter(w => w.dept === r.category && w.status === 'available');

                    return (
                      <div 
                        key={r.id} 
                        onClick={() => { setSelectedCluster({ id: 's', reports: [r], center: r.location }); setActiveReportInModal(r); }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-lg transition-all cursor-pointer group"
                      >
                        {/* Priority Tag */}
                        <div className="mb-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.priority === 'critical' ? 'bg-red-50 text-red-500 border border-red-100' :
                            r.priority === 'high' ? 'bg-amber-50 text-amber-500 border border-amber-100' :
                            'bg-yellow-50 text-yellow-600 border border-yellow-100'
                          }`}>
                            {r.priority}
                          </span>
                        </div>

                        <h4 className="text-[15px] font-bold text-slate-900 leading-tight mb-4 group-hover:text-purple-600 transition-colors">
                          {r.title}
                        </h4>

                        {/* Card Image */}
                        <div className="aspect-video bg-slate-50 rounded-xl overflow-hidden mb-4 border border-slate-50">
                          {r.image ? (
                            <img src={r.image} className="w-full h-full object-cover" alt="Signal evidence" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center grayscale opacity-10 text-4xl">📸</div>
                          )}
                        </div>

                        {/* Quick Assignment for NEW Reports */}
                        {r.status === ReportStatus.NEW && (
                          <div className="mb-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100" onClick={e => e.stopPropagation()}>
                            <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-2">Instant Dispatch</p>
                            {availableWorkersInDept.length > 0 ? (
                              <div className="space-y-1">
                                {availableWorkersInDept.slice(0, 2).map(w => (
                                  <button
                                    key={w.id}
                                    onClick={() => onAssignWorker(r.id, w.id)}
                                    className="w-full text-left bg-white px-2 py-1 rounded-lg border border-blue-100 text-[10px] font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-between"
                                  >
                                    <span>{w.name}</span>
                                    <span className="text-[8px]">Dispatch</span>
                                  </button>
                                ))}
                                {availableWorkersInDept.length > 2 && <p className="text-[8px] text-slate-400 text-center mt-1">+{availableWorkersInDept.length - 2} more available</p>}
                              </div>
                            ) : (
                              <p className="text-[8px] text-slate-400 font-bold italic">No personnel available</p>
                            )}
                          </div>
                        )}

                        {/* Card Meta Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                            <span className="opacity-70">📍</span>
                            <span className="truncate">{r.location.address}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                            <span className="opacity-70">🕒</span>
                            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                          </div>
                          {assignedWorker && (
                            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                              <span className="opacity-70 text-xs">👤</span>
                              <div className="flex items-center space-x-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${assignedWorker.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <span className="font-bold">Worker #{assignedWorker.id.slice(-4)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Footer Category */}
                        <div className="pt-3 border-t border-slate-50">
                          <span className="text-[10px] font-bold text-slate-400">{r.category}</span>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No Signals</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HEATMAP VIEW */}
      {activeTab === 'heatmap' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm h-[650px] relative overflow-hidden">
             <div id="admin-map" ref={mapContainerRef} className="w-full h-full rounded-2xl border border-slate-200"></div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Field Personnel</h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {workers.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-xs shadow-sm border border-slate-100 relative">
                        👤
                        <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${w.status === 'available' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`}></div>
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 tracking-tight leading-none">{w.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{w.dept}</p>
                      </div>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${w.status === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Signal Volume Stream</h3>
               <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={analyticsData.timeTrend}>
                     <defs>
                       <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                         <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                     <Area type="monotone" dataKey="volume" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                     <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </div>
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8">Department Load</h3>
               <div className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={analyticsData.pieData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                       {analyticsData.pieData.map((_, index) => <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5]} />)}
                     </Pie>
                     <Tooltip />
                   </PieChart>
                 </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
