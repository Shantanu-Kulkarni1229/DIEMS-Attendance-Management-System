import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Overview from './Overview/Overview';
import LectureWiseAttendance from './LectureWiseAttendance';
import LeaveRequest from './LeaveRequest';
import PasswordSetupModal from './components/PasswordSetupModal';
import { get } from '../services/apiClient';

export default function StudentDashboard() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [profile, setProfile] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [attendanceError, setAttendanceError] = useState('');

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const me = await get('/api/auth/me');
        setProfile(me?.user || null);
        setIsFirstLogin(!!(me && me.user && me.user.mustChangePassword));
      } catch (error) {
        setAttendanceError(error.message || 'Failed to load profile');
      }

      try {
        const attendance = await get('/api/student/attendance');
        setAttendanceData(attendance);
      } catch (error) {
        setAttendanceError(error.message || 'Failed to load attendance');
      } finally {
        setLoadingAttendance(false);
      }
    };
    bootstrap();
  }, []);

  return (
    <div className="min-h-screen bg-sky-50/40 flex font-sans relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-sky-100/40 rounded-full blur-3xl pointer-events-none"></div>

      {isFirstLogin && <PasswordSetupModal onClose={() => setIsFirstLogin(false)} />}
      
      {/* Sidebar */}
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        profile={profile}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 relative z-10 w-full lg:w-auto`}>
        <Navbar setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} profile={profile} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className={currentPage === 'lecture-wise-attendance' || currentPage === 'leave-request' ? 'max-w-none' : 'max-w-7xl mx-auto'}>
            {currentPage === 'dashboard' && <Overview attendanceData={attendanceData} loading={loadingAttendance} error={attendanceError} profile={profile} />}
            {currentPage === 'lecture-wise-attendance' && <LectureWiseAttendance attendanceData={attendanceData} loading={loadingAttendance} error={attendanceError} profile={profile} />}
            {currentPage === 'leave-request' && <LeaveRequest profile={profile} />}
          </div>
        </main>
      </div>
    </div>
  );
}
