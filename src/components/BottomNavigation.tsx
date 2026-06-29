import React from 'react';
import { LayoutDashboard, PlusCircle, UsersRound, Settings } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: 'overview' | 'add' | 'funds' | 'settings';
  setActiveTab: (tab: 'overview' | 'add' | 'funds' | 'settings') => void;
}

export default function BottomNavigation({ activeTab, setActiveTab }: BottomNavigationProps) {
  return (
    <nav className="bg-white/95 border-t border-slate-100/80 px-4 py-3 pb-5 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-20 bottom-nav-shadow rounded-t-[28px]">
      <div className="flex justify-between items-center">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex flex-col items-center space-y-1 py-1.5 px-2 rounded-xl transition-all duration-300 ${
            activeTab === 'overview'
              ? 'text-teal-600 font-bold bg-teal-50/80 scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="btn-tab-overview"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Tổng quan</span>
        </button>

        <button
          onClick={() => setActiveTab('add')}
          className={`flex-1 flex flex-col items-center space-y-1 py-1.5 px-2 rounded-xl transition-all duration-300 ${
            activeTab === 'add'
              ? 'text-pink-600 font-bold bg-pink-50/80 scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="btn-tab-add"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Thêm chi</span>
        </button>

        <button
          onClick={() => setActiveTab('funds')}
          className={`flex-1 flex flex-col items-center space-y-1 py-1.5 px-2 rounded-xl transition-all duration-300 ${
            activeTab === 'funds'
              ? 'text-indigo-600 font-bold bg-indigo-50/80 scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="btn-tab-funds"
        >
          <UsersRound className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Quỹ chung</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex flex-col items-center space-y-1 py-1.5 px-2 rounded-xl transition-all duration-300 ${
            activeTab === 'settings'
              ? 'text-purple-600 font-bold bg-purple-50/80 scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          id="btn-tab-settings"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Cài đặt</span>
        </button>
      </div>
    </nav>
  );
}
