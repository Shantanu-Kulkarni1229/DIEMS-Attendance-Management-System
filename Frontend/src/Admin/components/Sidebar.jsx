import { logout } from '../../services/session';

export default function Sidebar({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'timetable', label: 'Timetable', icon: 'timetable' },
    { id: 'create-teacher', label: 'Create Teacher', icon: 'teacher' },
    { id: 'create-student', label: 'Create Student', icon: 'student' },
    { id: 'reports', label: 'Reports', icon: 'reports' },
  ];

  const getIcon = (iconType) => {
    const iconMap = {
      dashboard: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        </svg>
      ),
      teacher: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      student: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.228 6.228 2 10.228 2 15s4.228 8.772 10 8.772 10-4.228 10-8.772c0-4.772-4.228-8.747-10-8.747z" />
        </svg>
      ),
      reports: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      timetable: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      logout: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
    };
    return iconMap[iconType];
  };

  return (
    <aside className="w-64 bg-white/60 backdrop-blur border-r border-sky-100 shadow-lg flex flex-col fixed left-0 top-0 h-screen overflow-y-auto rounded-r-3xl">
      {/* Branding */}
      <div className="p-6 border-b border-sky-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-full bg-gradient-to-br from-sky-400 to-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-sky-600">DIEMS</h1>
            <p className="text-xs text-slate-500 font-medium">Attendance Mgmt</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
            }`}
          >
            <span className="flex-shrink-0">{getIcon(item.icon)}</span>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Promotional Card */}
      <div className="p-4 m-4 bg-gradient-to-br from-sky-100 to-blue-100 rounded-2xl border border-sky-200">
        <div className="mb-3">
          <h3 className="text-sm font-bold text-sky-900">Smart Attendance</h3>
          <p className="text-xs text-sky-700">Better Insights</p>
        </div>
        <p className="text-xs text-slate-700 mb-4 leading-relaxed">Track, analyze and improve academic attendance effortlessly.</p>
        <div className="flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 opacity-50" viewBox="0 0 200 180">
            <rect x="30" y="80" width="60" height="50" rx="8" fill="#0ea5e9" opacity="0.3" />
            <rect x="110" y="60" width="60" height="70" rx="8" fill="#0284c7" opacity="0.3" />
            <rect x="30" y="40" width="140" height="15" rx="4" fill="#7dd3fc" opacity="0.5" />
            <circle cx="140" cy="30" r="4" fill="#38bdf8" opacity="0.6" />
            <circle cx="50" cy="160" r="3" fill="#0284c7" opacity="0.5" />
            <path d="M 20 120 Q 60 100 100 110 T 180 115" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-sky-100">
        <button type="button" onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
          <span className="flex-shrink-0">{getIcon('logout')}</span>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
