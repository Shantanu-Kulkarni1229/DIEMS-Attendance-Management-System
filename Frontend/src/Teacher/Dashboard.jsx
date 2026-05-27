import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Overview from './Overview/Overview';
import PasswordSetupModal from './components/PasswordSetupModal';
import MarkAttendanceModal from './components/MarkAttendanceModal';
import { get } from '../services/apiClient';

export default function TeacherDashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [profile, setProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [todaySessions, setTodaySessions] = useState([]);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);

  const refreshTeacherData = async () => {
    try {
      const data = await get('/api/teacher/dashboard');
      setDashboardData(data || null);
    } catch (error) {
      setDashboardData(null);
    }

    try {
      const sessions = await get('/api/timetable/teacher/today');
      setTodaySessions(Array.isArray(sessions) ? sessions : []);
    } catch (error) {
      setTodaySessions([]);
    }
  };

  useEffect(() => {
    const loadMe = async () => {
      try {
        const me = await get('/api/auth/me');
        setProfile(me?.user || null);
        setIsFirstLogin(!!(me && me.user && me.user.mustChangePassword));
      } catch (error) {
        // no-op for now; login-protected routes will already gate access
      }

      await refreshTeacherData();
    };
    loadMe();
  }, []);

  const handleMarkAttendance = (classItem = null) => {
    setSelectedClass(classItem);
    setShowMarkAttendance(true);
  };

  return (
    <div className="min-h-screen bg-sky-50/50 flex font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-sky-100/40 rounded-full blur-3xl pointer-events-none"></div>

      {isFirstLogin && <PasswordSetupModal onClose={() => setIsFirstLogin(false)} />}
      
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        onMarkAttendanceClick={() => handleMarkAttendance(null)}
        profile={profile}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 relative z-10 w-full lg:w-auto`}>
        <Navbar setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} profile={profile} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && <Overview onMarkAttendance={handleMarkAttendance} profile={profile} dashboardData={dashboardData} todaySessions={todaySessions} />}
            {/* Placeholder for other pages */}
            {currentPage !== 'dashboard' && (
              <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/60 shadow-sm">
                <svg className="w-16 h-16 mb-4 text-sky-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <h2 className="text-xl font-medium text-slate-600 mb-2">{currentPage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
                <p>This module is under construction.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {showMarkAttendance && (
        <MarkAttendanceModal 
          onClose={() => setShowMarkAttendance(false)} 
          initialData={selectedClass} 
          dashboardData={dashboardData}
          onSaved={refreshTeacherData}
        />
      )}
    </div>
  );
}
