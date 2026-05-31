import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Overview from './Overview/Overview';
import LeaveRequests from './LeaveRequests';
import AttendanceRecords from './AttendanceRecords';
import PasswordSetupModal from './components/PasswordSetupModal';
import MarkAttendanceModal from './components/MarkAttendanceModal';
import { get, API_BASE } from '../services/apiClient';
import { io } from 'socket.io-client';

const leaveSlotLabels = {
  'Full Day': 'Full Day',
  '10:15': '10:15 AM - 11:15 AM',
  '11:15': '11:15 AM - 12:15 PM',
  '13:15': '1:15 PM - 2:15 PM',
  '14:15': '2:15 PM - 3:15 PM',
  '15:30': '3:30 PM - 4:30 PM',
  '16:30': '4:30 PM - 5:30 PM'
};

const formatLeaveSlots = (value) => {
  if (Array.isArray(value)) {
    if (value.includes('Full Day')) return 'Full Day';
    return value.map((slot) => leaveSlotLabels[slot] || slot).join(', ');
  }
  return leaveSlotLabels[value] || value || 'Full Day';
};

export default function TeacherDashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [profile, setProfile] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [todaySessions, setTodaySessions] = useState([]);
  const [showMarkAttendance, setShowMarkAttendance] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('teacher-theme') || 'light');
  const [leaveNotice, setLeaveNotice] = useState(null);
  const [leaveRequestsRefreshTick, setLeaveRequestsRefreshTick] = useState(0);

  const mergeTeacherPayload = (dashboardPayload, contextPayload) => ({
    ...(dashboardPayload || {}),
    ...(contextPayload || {}),
    teacher: dashboardPayload?.teacher || contextPayload?.teacher || null,
    assignedClassrooms: Array.isArray(contextPayload?.assignedClassrooms) && contextPayload.assignedClassrooms.length
      ? contextPayload.assignedClassrooms
      : (Array.isArray(dashboardPayload?.assignedClassrooms) ? dashboardPayload.assignedClassrooms : []),
    assignedSubjects: Array.isArray(contextPayload?.assignedSubjects) && contextPayload.assignedSubjects.length
      ? contextPayload.assignedSubjects
      : (Array.isArray(dashboardPayload?.assignedSubjects) ? dashboardPayload.assignedSubjects : []),
    studentsByClassroom: contextPayload?.studentsByClassroom || dashboardPayload?.studentsByClassroom || {},
    canMarkAttendance: !!(contextPayload?.canMarkAttendance ?? dashboardPayload?.canMarkAttendance)
  });

  const refreshTeacherData = async () => {
    setDashboardLoading(true);
    try {
      const [dashboardPayload, contextPayload] = await Promise.all([
        get('/api/teacher/dashboard'),
        get('/api/teacher/attendance-context')
      ]);
      setDashboardData(mergeTeacherPayload(dashboardPayload, contextPayload));
    } catch (error) {
      setDashboardData(null);
    } finally {
      setDashboardLoading(false);
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

  useEffect(() => {
    localStorage.setItem('teacher-theme', theme);
  }, [theme]);

  useEffect(() => {
    const teacherId = profile?._id || profile?.id;
    if (!teacherId) return undefined;

    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });

    socket.on('leave:new', (payload) => {
      const recipients = Array.isArray(payload?.recipientTeacherIds) ? payload.recipientTeacherIds.map(String) : [];
      if (!recipients.includes(String(teacherId))) return;

      setLeaveNotice(payload);
      setLeaveRequestsRefreshTick((value) => value + 1);
    });

    return () => socket.disconnect();
  }, [profile?._id, profile?.id]);

  useEffect(() => {
    if (!leaveNotice) return undefined;
    const timer = setTimeout(() => setLeaveNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [leaveNotice]);

  const handleMarkAttendance = (classItem = null) => {
    setSelectedClass(classItem);
    setShowMarkAttendance(true);
  };

  return (
    <div className={`teacher-theme teacher-theme-${theme} h-screen flex font-sans relative overflow-hidden ${theme === 'dark' ? 'bg-slate-950' : 'bg-sky-50/50'}`}>
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-sky-100/40 rounded-full blur-3xl pointer-events-none"></div>

      {isFirstLogin && <PasswordSetupModal onClose={() => setIsFirstLogin(false)} theme={theme} />}
      
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        onMarkAttendanceClick={() => handleMarkAttendance(null)}
        profile={profile}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 relative z-10 w-full h-screen lg:pl-72`}>
        <Navbar setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} profile={profile} theme={theme} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && <Overview onMarkAttendance={handleMarkAttendance} profile={profile} dashboardData={dashboardData} todaySessions={todaySessions} loading={dashboardLoading} theme={theme} />}
            {currentPage === 'leave-requests' && <LeaveRequests onChanged={refreshTeacherData} loading={dashboardLoading} theme={theme} refreshToken={leaveRequestsRefreshTick} />}
            {currentPage === 'attendance-theory' && <AttendanceRecords dashboardData={dashboardData} mode="lecture" loading={dashboardLoading} theme={theme} />}
            {currentPage === 'attendance-practical' && <AttendanceRecords dashboardData={dashboardData} mode="practical" loading={dashboardLoading} theme={theme} />}
            {/* Placeholder for other pages */}
            {currentPage !== 'dashboard' && currentPage !== 'leave-requests' && currentPage !== 'attendance-theory' && currentPage !== 'attendance-practical' && (
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

      {leaveNotice && (
        <div className={`fixed right-4 top-20 z-50 max-w-sm rounded-2xl border px-4 py-3 shadow-lg ${theme === 'dark' ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-800'}`}>
          <p className="text-sm font-semibold">New leave request</p>
          <p className="mt-1 text-xs text-slate-500">
            {leaveNotice.student?.name || 'Student'} • {leaveNotice.classroom?.name || 'Class'} • {formatLeaveSlots(leaveNotice.leave?.duration)}
          </p>
          <p className="mt-2 text-xs text-slate-500">{leaveNotice.leave?.reason || 'No reason provided'}</p>
          <button type="button" onClick={() => { setCurrentPage('leave-requests'); setLeaveNotice(null); }} className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700">
            View leave requests
          </button>
        </div>
      )}

      {showMarkAttendance && (
        <MarkAttendanceModal 
          onClose={() => setShowMarkAttendance(false)} 
          initialData={selectedClass} 
          dashboardData={dashboardData}
          onSaved={refreshTeacherData}
          theme={theme}
        />
      )}
    </div>
  );
}
