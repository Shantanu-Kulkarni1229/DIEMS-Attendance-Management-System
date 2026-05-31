import React from 'react';

export default function Navbar({ setSidebarOpen, sidebarOpen, profile, theme = 'light' }) {
  const displayName = profile?.name || 'Teacher';
  const displayRole = profile?.role || 'Faculty';
  const initials = String(displayName || 'T')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'T';

  return (
    <header className={`sticky top-0 z-20 backdrop-blur-xl px-4 md:px-8 py-4 ${theme === 'dark' ? 'bg-slate-900/90 border-b border-slate-700 shadow-[0_4px_24px_rgba(0,0,0,0.35)]' : 'bg-white/70 border-b border-white/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)]'}`}>
      <div className="flex items-center justify-between">
        
        {/* Left: Mobile Toggle, Brand & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button 
            className={`lg:hidden p-2 rounded-lg ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className={`flex items-center gap-2 md:gap-3 rounded-xl border shadow-sm px-2.5 py-1.5 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white/90 border-slate-200/80'}`}>
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white ring-1 ring-blue-100 p-1">
              <img src="/image.png" alt="DIEMS College Logo" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className={`text-[11px] uppercase tracking-[0.2em] font-bold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>DIEMS</p>
              <p className={`text-[12px] font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-700'}`}>Teacher Portal</p>
            </div>
          </div>

          <div className={`hidden md:flex items-center transition-colors rounded-full px-4 py-2 w-96 border focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-800 border-slate-700' : 'bg-slate-100/80 hover:bg-slate-100 border-slate-200/60'}`}>
            <svg className={`w-5 h-5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search students, classes..." 
              className={`bg-transparent border-none focus:ring-0 text-sm ml-2 w-full outline-none ${theme === 'dark' ? 'text-slate-100 placeholder-slate-500' : 'text-slate-700 placeholder-slate-400'}`}
            />
          </div>
        </div>

        {/* Right: Notifications & Profile */}
        <div className="flex items-center gap-4 md:gap-6">
          <button className={`relative p-2 rounded-full transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>

          <div className={`flex items-center gap-3 pl-4 cursor-pointer group ${theme === 'dark' ? 'md:border-l border-slate-700' : 'md:border-l border-slate-200'}`}>
            <div className="hidden md:block text-right">
              <p className={`text-sm font-bold leading-none ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{displayName}</p>
              <p className={`text-[11px] font-medium mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>{displayRole}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md ring-2 ring-white group-hover:shadow-lg transition-shadow">
              {initials}
            </div>
            <svg className={`w-4 h-4 transition-colors hidden md:block ${theme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

      </div>
    </header>
  );
}
