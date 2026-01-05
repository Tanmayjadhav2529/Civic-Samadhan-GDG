
import React from 'react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  role: 'CITIZEN' | 'ADMIN';
}

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, role }) => {
  const citizenItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'new-report', label: 'New Report', icon: '＋' },
    { id: 'my-reports', label: 'My Reports', icon: '📋' },
    { id: 'rewards', label: 'Rewards', icon: '🎗' },
  ];

  const adminItems = [
    { id: 'admin-dashboard', label: 'Command Center', icon: '🛡️' },
    { id: 'analytics', label: 'Detailed Insights', icon: '📊' },
  ];

  const items = role === 'CITIZEN' ? citizenItems : adminItems;

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-blue-600">Civic Samadhan</h1>
        <p className="text-xs text-slate-400 font-medium">{role === 'CITIZEN' ? 'Citizen Portal' : 'Admin Portal'}</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
              activePage === item.id 
                ? 'bg-blue-50 text-blue-600 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 bg-slate-50 rounded-2xl">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Help & Support</p>
          <button className="text-xs text-blue-600 font-semibold mt-2 hover:underline">Contact Municipality</button>
        </div>
      </div>
    </aside>
  );
};
