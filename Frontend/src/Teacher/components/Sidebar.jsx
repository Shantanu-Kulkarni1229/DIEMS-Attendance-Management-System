import React from 'react';

export default function Sidebar({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, onMarkAttendanceClick }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
    { id: 'mark-attendance', label: 'Mark Attendance', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
    { id: 'edit-attendance', label: 'Edit Attendance', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
    { id: 'approve-leave', label: 'Approve Leave', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
    { id: 'my-classes', label: 'My Classes', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
    { id: 'reports', label: 'Reports', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
    { id: 'profile', label: 'Profile', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
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
      <div className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-white/70 backdrop-blur-xl border-r border-white/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-30 transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 leading-tight">DIEMS</h2>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Attendance System</p>
          </div>
          <button 
            className="lg:hidden ml-auto p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            onClick={() => setSidebarOpen(false)}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
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
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 rounded-r-full" />
                )}
                <svg className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
                  {item.icon}
                </svg>
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Promo Card */}
        <div className="px-4 pb-4">
          <div className="p-5 bg-gradient-to-br from-sky-50 to-blue-50/50 rounded-2xl border border-sky-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-blue-200 rounded-full opacity-30 blur-2xl group-hover:bg-blue-300 transition-colors"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-20 h-20 bg-sky-200 rounded-full opacity-30 blur-2xl group-hover:bg-sky-300 transition-colors"></div>
            
            <h3 className="text-sm font-bold text-slate-800 mb-1.5 relative z-10 leading-tight">Smart Teaching<br/>Better Engagement</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed relative z-10 mb-4">Track attendance, manage classes and support student success.</p>
            
            <div className="flex justify-center relative z-10">
              <div className="w-full h-24 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-white/60 flex items-center justify-center relative overflow-hidden group-hover:shadow-md transition-all">
                <div className="absolute inset-0 bg-gradient-to-t from-sky-50/50 to-transparent"></div>
                <div className="relative text-3xl flex items-center justify-center space-x-2">
                  <span className="transform -rotate-12 hover:rotate-0 transition-transform">💻</span>
                  <span className="transform rotate-12 hover:rotate-0 transition-transform">🎓</span>
                  <span className="absolute bottom-1 right-2 text-xl">🪴</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-200/60">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
