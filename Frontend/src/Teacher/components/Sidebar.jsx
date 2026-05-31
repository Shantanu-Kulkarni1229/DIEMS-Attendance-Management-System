import React, { useState } from 'react';
import { logout } from '../../services/session';

export default function Sidebar({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, onMarkAttendanceClick, profile, theme = 'light', setTheme }) {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { id: 'mark-attendance', label: 'Mark Attendance', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> }
  ];

  const moreNavItems = [
    { id: 'leave-requests', label: 'Leave Requests', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> }
  ];

  const theoryReportItems = [
    { id: 'attendance-theory', label: 'Theory Attendance', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8m4 5H4a1 1 0 01-1-1V6a1 1 0 011-1h16a1 1 0 011 1v10a1 1 0 01-1 1z" /> }
  ];

  const practicalReportItems = [
    { id: 'attendance-practical', label: 'Practical Attendance', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L5 12.25 6.41 10.84 9.75 14.17 17.59 6.33 19 7.75 9.75 17z" /> }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-screen w-72 backdrop-blur-xl z-30 transition-transform duration-300 flex flex-col ${theme === 'dark' ? 'bg-slate-900/95 border-r border-slate-700 shadow-[4px_0_24px_rgba(0,0,0,0.35)]' : 'bg-white/70 border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)]'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-lg shadow-blue-100/70 ring-1 ring-blue-100 p-1.5 flex items-center justify-center overflow-hidden">
            <img src="/image.png" alt="DIEMS College Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className={`text-xl font-bold tracking-tight leading-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>DIEMS</h2>
            <p className={`text-[10px] font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Attendance System</p>
          </div>
          <button 
            className={`lg:hidden ml-auto p-1.5 rounded-lg ${theme === 'dark' ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-hidden px-4 py-4 space-y-1">
          <div className={`px-4 pb-2 text-[10px] font-bold uppercase tracking-[0.25em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Main</div>
          {mainNavItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'mark-attendance') {
                    onMarkAttendanceClick();
                  } else {
                    setCurrentPage(item.id);
                  }
                  if(window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? (theme === 'dark' ? 'bg-slate-800 text-sky-300 font-semibold' : 'bg-blue-50 text-blue-700 font-semibold')
                    : (theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium')
                }`}
              >
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full ${theme === 'dark' ? 'bg-sky-400' : 'bg-blue-600'}`} />
                )}
                <svg className={`w-5 h-5 transition-colors ${isActive ? (theme === 'dark' ? 'text-sky-300' : 'text-blue-600') : (theme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}

          <div className={`px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[0.25em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>More</div>
          {moreNavItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? (theme === 'dark' ? 'bg-slate-800 text-sky-300 font-semibold' : 'bg-blue-50 text-blue-700 font-semibold')
                    : (theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium')
                }`}
              >
                {isActive && (
                  <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full ${theme === 'dark' ? 'bg-sky-400' : 'bg-blue-600'}`} />
                )}
                <svg className={`w-5 h-5 transition-colors ${isActive ? (theme === 'dark' ? 'text-sky-300' : 'text-blue-600') : (theme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}

          <div className={`px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[0.25em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Theory Attendance</div>
          {theoryReportItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? (theme === 'dark' ? 'bg-slate-800 text-sky-300 font-semibold' : 'bg-blue-50 text-blue-700 font-semibold')
                    : (theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium')
                }`}
              >
                {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full ${theme === 'dark' ? 'bg-sky-400' : 'bg-blue-600'}`} />}
                <svg className={`w-5 h-5 transition-colors ${isActive ? (theme === 'dark' ? 'text-sky-300' : 'text-blue-600') : (theme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}

          <div className={`px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-[0.25em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Practical Attendance</div>
          {practicalReportItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? (theme === 'dark' ? 'bg-slate-800 text-sky-300 font-semibold' : 'bg-blue-50 text-blue-700 font-semibold')
                    : (theme === 'dark' ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium')
                }`}
              >
                {isActive && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full ${theme === 'dark' ? 'bg-sky-400' : 'bg-blue-600'}`} />}
                <svg className={`w-5 h-5 transition-colors ${isActive ? (theme === 'dark' ? 'text-sky-300' : 'text-blue-600') : (theme === 'dark' ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-slate-600')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}
        </div>

        <div className={`px-4 py-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200/60'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-[0.25em] mb-2 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Theme</p>
          <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100/70 border border-slate-200'}`}>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${theme === 'light' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              White
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${theme === 'dark' ? 'bg-slate-700 text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200/60'}`}>
          <button type="button" onClick={logout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${theme === 'dark' ? 'text-slate-300 hover:text-red-300 hover:bg-red-950/50' : 'text-slate-600 hover:text-red-600 hover:bg-red-50'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
          <p className={`mt-3 text-center text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Made with ❤️ by Team Pravartak</p>
        </div>
      </div>
    </>
  );
}
