import { useState } from 'react';

const Sidebar = ({ user, profile, onLogout, onNavigate, activeSection }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigationMap = {
    SuperAdmin: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'users', label: 'Manage Users', icon: '👥' },
      { id: 'classrooms', label: 'Classrooms', icon: '🏫' },
      { id: 'subjects', label: 'Subjects', icon: '📚' },
      { id: 'reports', label: 'Attendance Reports', icon: '📈' },
    ],
    Admin: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'create-teacher', label: 'Create Teacher', icon: '👨‍🏫' },
      { id: 'manage-teachers', label: 'Manage Teachers', icon: '👨‍🏫' },
      { id: 'create-student', label: 'Create Student', icon: '👨‍🎓' },
      { id: 'manage-students', label: 'Manage Students', icon: '👨‍🎓' },
      { id: 'classrooms', label: 'Classrooms', icon: '🏫' },
    ],
    Teacher: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'mark-attendance', label: 'Mark Attendance', icon: '✅' },
      { id: 'manage-attendance', label: 'Manage Attendance', icon: '📝' },
      { id: 'classroom-list', label: 'My Classrooms', icon: '🏫' },
      { id: 'reports', label: 'Reports', icon: '📈' },
    ],
    Student: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'attendance', label: 'My Attendance', icon: '📋' },
      { id: 'statistics', label: 'Statistics', icon: '📊' },
      { id: 'alerts', label: 'Alerts', icon: '🔔' },
    ],
  };

  const navItems = navigationMap[user.role] || navigationMap.Student;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-6 left-6 z-40 p-3 bg-sky-600 text-white rounded-full shadow-lg hover:bg-sky-700 transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:static left-0 top-0 h-screen lg:h-auto w-72 bg-white border-r-2 border-sky-200 shadow-xl lg:shadow-none lg:col-span-1 transition-transform duration-300 z-30 overflow-y-auto`}
      >
        <div className="p-6 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 pb-6 border-b-2 border-sky-100">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-600 to-sky-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-sky-700">DIEMS</h3>
              <p className="text-xs text-sky-600 font-semibold">Attendance</p>
            </div>
          </div>

          {/* User Info Card */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                <p className="text-xs text-sky-600 font-semibold">{profile.label}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 truncate">{user.email}</p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2">
            <p className="text-xs font-bold text-sky-700 uppercase tracking-wider px-2 py-2">Navigation</p>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-sky-50 border-2 border-transparent hover:border-sky-200'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Divider */}
          <div className="border-t-2 border-sky-100" />

          {/* Sign Out */}
          <button
            onClick={() => {
              onLogout();
              setMobileOpen(false);
            }}
            className="w-full px-4 py-3 bg-red-50 border-2 border-red-300 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>

          {/* Footer Info */}
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-sky-200">
            <p className="text-xs text-sky-700 font-semibold">DIEMS v1.0</p>
            <p className="text-xs text-slate-500">Attendance Portal</p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-20"
        />
      )}
    </>
  );
};

export default Sidebar;
