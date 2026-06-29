import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 px-6 py-4.5 border-b border-stone-100 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center shadow-xs shrink-0">
          <Heart className="w-5 h-5 text-pink-400 fill-pink-300" />
        </div>
        <div>
          <h1 className="font-serif italic text-2xl text-slate-700 leading-none">Gia đình Hoàng Uyên</h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">Quản lý chi tiêu</p>
        </div>
      </div>
      <div className="flex items-center space-x-1 bg-teal-50 px-2.5 py-1 rounded-full text-teal-600 text-xs font-semibold">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Gia đình</span>
      </div>
    </header>
  );
}
