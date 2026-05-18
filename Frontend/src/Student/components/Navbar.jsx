import React from 'react';

export default function Navbar({ setSidebarOpen, sidebarOpen }) {
  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] px-4 md:px-8 py-4">
      <div className="flex items-center justify-between">
        
        {/* Left: Mobile Toggle & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button 
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="hidden md:flex items-center bg-slate-100/80 hover:bg-slate-100 transition-colors rounded-full px-4 py-2 w-96 border border-slate-200/60 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search subjects, classes..." 
              className="bg-transparent border-none focus:ring-0 text-sm ml-2 w-full text-slate-700 placeholder-slate-400 outline-none"
            />
          </div>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-4 md:gap-6">
          <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 md:border-l border-slate-200 cursor-pointer group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-sky-500 text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white group-hover:shadow-lg transition-shadow">
              AS
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-slate-800 leading-none">Aniket Shinde</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">SYA - Computer</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors hidden md:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

      </div>
    </header>
  );
}
