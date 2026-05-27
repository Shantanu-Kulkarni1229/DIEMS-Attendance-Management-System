import React, { useEffect, useState } from 'react';
import { get, patch } from '../../services/apiClient';

const fallbackStats = [
  { title: "Today's Classes", value: "4", subtitle: "Scheduled", icon: "📅", color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Total Students", value: "186", subtitle: "Across all classes", icon: "👥", color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "Attendance Marked", value: "2", subtitle: "Classes Completed", icon: "✅", color: "text-purple-600", bg: "bg-purple-50" },
  { title: "Pending Classes", value: "2", subtitle: "To Mark", icon: "🕒", color: "text-orange-600", bg: "bg-orange-50" },
];

const fallbackSchedule = [
  { time: "09:00 AM - 10:00 AM", subject: "ML (Theory)", class: "SYA", status: "Completed" },
  { time: "11:00 AM - 12:00 PM", subject: "CN (Theory)", class: "TYB", status: "Pending" },
  { time: "01:00 PM - 02:00 PM", subject: "IOT (Theory)", class: "SYB", status: "Pending" },
  { time: "03:00 PM - 04:00 PM", subject: "CD (Theory)", class: "FE-A", status: "Pending" },
];

const formatTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatDateHeader = (value = new Date()) => {
  return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric', weekday: 'long' });
};

const leaveRequestsFallback = [
  { initials: "AS", name: "Aniket Shinde", classInfo: "SYA - ML (Theory)", date: "21 May 2025", duration: "Full Day", color: "bg-blue-100 text-blue-700" },
  { initials: "PR", name: "Prajakta Rajput", classInfo: "TYB - CN (Theory)", date: "22 May 2025", duration: "1st Half", color: "bg-purple-100 text-purple-700" },
  { initials: "SK", name: "Sahil Kale", classInfo: "SYB - IOT (Theory)", date: "23 May 2025", duration: "Full Day", color: "bg-orange-100 text-orange-700" },
];

const quickActions = [
  { title: "Mark Attendance", subtitle: "Mark attendance for your classes", icon: "📅", color: "text-blue-600" },
  { title: "Edit Attendance", subtitle: "Edit or update existing records", icon: "✏️", color: "text-emerald-600" },
  { title: "Approve Leave", subtitle: "Review and approve student leaves", icon: "👤", color: "text-orange-600" },
  { title: "View Reports", subtitle: "View attendance reports & analytics", icon: "📄", color: "text-purple-600" },
];

const weeklyOverview = [
  { day: "Mon", date: "19 May", fraction: "4/4", status: "Marked", color: "text-emerald-600" },
  { day: "Tue", date: "20 May", fraction: "3/4", status: "Marked", color: "text-emerald-600" },
  { day: "Wed", date: "21 May", fraction: "2/4", status: "Marked", color: "text-emerald-600", active: true },
  { day: "Thu", date: "22 May", fraction: "0/4", status: "Pending", color: "text-orange-500" },
  { day: "Fri", date: "23 May", fraction: "0/4", status: "Pending", color: "text-orange-500" },
  { day: "Sat", date: "24 May", fraction: "-", status: "No Classes", color: "text-slate-400" },
  { day: "Sun", date: "25 May", fraction: "-", status: "No Classes", color: "text-slate-400" },
];

const buildTeacherStats = (dashboardData) => {
  const assignedSubjects = Array.isArray(dashboardData?.assignedSubjects) ? dashboardData.assignedSubjects : [];
  const attendanceRecords = Array.isArray(dashboardData?.attendanceRecords) ? dashboardData.attendanceRecords : [];
  const assignedClassrooms = Array.isArray(dashboardData?.assignedClassrooms) ? dashboardData.assignedClassrooms : [];

  if (!assignedSubjects.length && !attendanceRecords.length && !assignedClassrooms.length) {
    return fallbackStats;
  }

  const recentMarked = attendanceRecords.filter((record) => !!record?.records?.length).length;
  const pendingToMark = Math.max(assignedClassrooms.length - recentMarked, 0);

  return [
    { title: 'Assigned Classes', value: String(assignedClassrooms.length), subtitle: 'From your profile', icon: '🏫', color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Teaching Subjects', value: String(assignedSubjects.length), subtitle: 'Live backend data', icon: '📚', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Recent Attendance', value: String(attendanceRecords.length), subtitle: 'Latest records', icon: '🧾', color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Pending Classes', value: String(pendingToMark), subtitle: 'Based on recent activity', icon: '🕒', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];
};

const buildScheduleItems = (dashboardData) => {
  const attendanceRecords = Array.isArray(dashboardData?.attendanceRecords) ? dashboardData.attendanceRecords : [];
  if (!attendanceRecords.length) return fallbackSchedule;

  return attendanceRecords.slice(0, 4).map((record, index) => {
    const presentCount = Array.isArray(record.records) ? record.records.filter((entry) => entry.status === 'present').length : 0;
    const totalCount = Array.isArray(record.records) ? record.records.length : 0;
    return {
      time: record.date ? new Date(record.date).toLocaleDateString() : `Record ${index + 1}`,
      subject: record.subject?.name ? `${record.subject.name}${record.subject.code ? ` (${record.subject.code})` : ''}` : 'Attendance record',
      class: record.classroom?.name || 'Classroom',
      status: totalCount ? `Marked ${presentCount}/${totalCount}` : 'Marked'
    };
  });
};

const buildTimelineItems = (todaySessions) => {
  if (!Array.isArray(todaySessions) || !todaySessions.length) return fallbackSchedule;

  return todaySessions.map((session) => {
    const effectiveTeacher = session.actualTeacher || session.plannedTeacher;
    const isCompleted = session.status === 'completed';
    const isCancelled = session.status === 'cancelled';
    return {
      sessionId: session._id,
      classroomId: session.classroom?._id,
      subjectId: session.subject?._id,
      date: session.date,
      time: `${formatTime(session.startDateTime)} - ${formatTime(session.endDateTime)}`,
      subject: session.subject?.name ? `${session.subject.name}${session.subject?.code ? ` (${session.subject.code})` : ''}` : 'Subject',
      class: session.classroom?.name || 'Classroom',
      status: isCancelled ? 'Cancelled' : (isCompleted ? 'Completed' : 'Pending'),
      isSubstituted: !!session.actualTeacher,
      teacherName: effectiveTeacher?.name || 'Teacher'
    };
  });
};

export default function Overview({ onMarkAttendance, profile, dashboardData, todaySessions }) {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveMessage, setLeaveMessage] = useState('');
  const [sessionAttendance, setSessionAttendance] = useState(null);
  const [attendancePanelOpen, setAttendancePanelOpen] = useState(false);
  const [attendancePanelLoading, setAttendancePanelLoading] = useState(false);
  const [attendancePanelError, setAttendancePanelError] = useState('');
  const statsToShow = buildTeacherStats(dashboardData);
  const scheduleItems = buildTimelineItems(todaySessions);
  const hasTimetableSessions = Array.isArray(todaySessions) && todaySessions.length > 0;
  const leaveItems = leaveRequests.length ? leaveRequests : leaveRequestsFallback;

  useEffect(() => {
    const loadLeaves = async () => {
      try {
        const data = await get('/api/teacher/leave-requests');
        setLeaveRequests(Array.isArray(data) ? data : []);
      } catch (error) {
        setLeaveRequests([]);
      }
    };
    loadLeaves();
  }, []);

  const handleLeaveAction = async (leaveId, status) => {
    setLeaveMessage('');
    try {
      await patch(`/api/teacher/leave-requests/${leaveId}`, { status });
      const data = await get('/api/teacher/leave-requests');
      setLeaveRequests(Array.isArray(data) ? data : []);
      setLeaveMessage(`Leave ${status.toLowerCase()} successfully.`);
    } catch (error) {
      const payload = error && error.payload ? error.payload : null;
      const backendMessage = payload && (payload.message || (Array.isArray(payload.errors) ? payload.errors.join('; ') : null));
      setLeaveMessage(backendMessage || error.message || 'Failed to update leave request.');
    }
  };

  const openSessionAttendance = async (item) => {
    if (!item?.sessionId) return;
    setAttendancePanelOpen(true);
    setAttendancePanelLoading(true);
    setAttendancePanelError('');
    setSessionAttendance(null);
    try {
      const rows = await get(`/api/teacher/attendance-records?lectureSession=${item.sessionId}`);
      const attendance = Array.isArray(rows) && rows.length ? rows[0] : null;
      if (!attendance) {
        setAttendancePanelError('Attendance record not found for this session.');
      } else {
        setSessionAttendance(attendance);
      }
    } catch (error) {
      const payload = error && error.payload ? error.payload : null;
      const backendMessage = payload && (payload.message || (Array.isArray(payload.errors) ? payload.errors.join('; ') : null));
      setAttendancePanelError(backendMessage || error.message || 'Failed to load session attendance details.');
    } finally {
      setAttendancePanelLoading(false);
    }
  };

  const presentCount = Array.isArray(sessionAttendance?.records)
    ? sessionAttendance.records.filter((r) => r.status === 'present').length
    : 0;
  const totalCount = Array.isArray(sessionAttendance?.records) ? sessionAttendance.records.length : 0;
  const absentCount = Math.max(totalCount - presentCount, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Good Morning, {profile?.name || 'Teacher'} <span className="text-2xl animate-wave origin-bottom-right">👋</span>
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your classes today.</p>
      </div>

      {/* Assigned Classrooms & Subjects */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-white shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Assigned Classrooms</h3>
          <p className="text-xs text-slate-500 mb-3">Classes you are responsible for</p>
          <div className="flex flex-col gap-2">
            {(Array.isArray(dashboardData?.assignedClassrooms) && dashboardData.assignedClassrooms.length) ? (
              dashboardData.assignedClassrooms.map((c) => (
                <div key={c._id} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-700">
                  {c.name}{c.year ? ` (${c.year})` : ''}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No assigned classrooms found.</p>
            )}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-white shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Assigned Subjects</h3>
          <p className="text-xs text-slate-500 mb-3">Subjects you teach</p>
          <div className="flex flex-col gap-2">
            {(Array.isArray(dashboardData?.assignedSubjects) && dashboardData.assignedSubjects.length) ? (
              dashboardData.assignedSubjects.map((s) => (
                <div key={s._id} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-100 text-sm text-slate-700">
                  {s.name}{s.code ? ` (${s.code})` : ''}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No assigned subjects found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsToShow.map((stat, i) => (
          <div key={i} className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white shadow-sm hover:shadow-md transition-all flex items-start gap-4 group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800 leading-none mb-1">{stat.value}</h3>
              <p className="text-xs font-medium text-slate-400">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Class Schedule */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur rounded-2xl p-6 border border-white shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Today's Class Schedule</h2>
            <span className="text-sm font-medium text-slate-500">{formatDateHeader()}</span>
          </div>

          <div className="space-y-4">
            {scheduleItems.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-colors gap-4">
                <div className="flex items-center gap-6">
                  <div className="w-32">
                    <p className="text-sm font-semibold text-slate-700">{item.time.split(' - ')[0]}</p>
                    <p className="text-xs text-slate-500">- {item.time.split(' - ')[1]}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{item.subject}</h4>
                    <p className="text-sm text-slate-500">{item.class}</p>
                    {item.isSubstituted && (
                      <p className="text-xs text-indigo-600 font-semibold mt-1">Substitute Lecture: {item.teacherName}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.status === 'Cancelled'
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.status}
                  </span>
                  
                  {item.status === 'Completed' ? (
                    <button onClick={() => openSessionAttendance(item)} className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors min-w-[140px]">
                      View Attendance
                    </button>
                  ) : item.status === 'Cancelled' ? (
                    <button disabled className="px-4 py-2 text-sm font-semibold text-slate-400 bg-slate-100 rounded-lg transition-colors min-w-[140px] cursor-not-allowed">
                      Cancelled
                    </button>
                  ) : (
                    <button 
                      onClick={() => onMarkAttendance(item)}
                      className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 hover:border-blue-600 hover:bg-blue-50 rounded-lg transition-all min-w-[140px]"
                    >
                      Mark Attendance
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!hasTimetableSessions && (
            <p className="mt-4 text-xs text-slate-500 text-center">Showing fallback schedule. Generate today sessions from timetable for live timeline.</p>
          )}
          
          <button className="mt-6 text-sm font-semibold text-blue-600 flex items-center gap-1 mx-auto hover:text-blue-700">
            View Full Schedule <span className="text-lg">›</span>
          </button>
        </div>

        {/* Leave Requests */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Leave Requests</h2>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
          </div>

          {leaveMessage && (
            <div className="mb-4 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              {leaveMessage}
            </div>
          )}

          <div className="flex-1 space-y-4">
            {leaveItems.map((req, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${req.color || 'bg-slate-100 text-slate-700'}`}>
                  {req.initials || String(req.student?.name || req.name || 'L').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{req.student?.name || req.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{req.classroom?.name || req.classInfo}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : req.date}</p>
                    <p className="text-[10px] text-slate-500">{req.duration || req.status}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => handleLeaveAction(req._id, 'Approved')} className="w-7 h-7 rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button type="button" onClick={() => handleLeaveAction(req._id, 'Rejected')} className="w-7 h-7 rounded border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-auto pt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 self-start">
            View All Requests ›
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, i) => (
              <button key={i} className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-all group">
                <div className={`text-2xl mb-3 ${action.color} group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h4 className="text-xs font-bold text-slate-800 mb-1">{action.title}</h4>
                <p className="text-[10px] text-slate-500 leading-tight">{action.subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Weekly Overview</h2>
            <select className="text-sm font-medium text-blue-600 bg-transparent border-none outline-none cursor-pointer pr-4">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          
          <div className="flex justify-between items-end gap-2 h-full pb-2">
            {weeklyOverview.map((day, i) => (
              <div key={i} className={`flex flex-col items-center p-2 rounded-xl flex-1 transition-colors ${day.active ? 'bg-blue-50 border border-blue-100' : 'border border-transparent'}`}>
                <p className={`text-xs font-bold ${day.active ? 'text-blue-700' : 'text-slate-800'}`}>{day.day}</p>
                <p className="text-[10px] text-slate-400 mb-3">{day.date.split(' ')[0]} {day.date.split(' ')[1]}</p>
                
                <p className={`text-sm font-bold ${day.active ? 'text-blue-700' : day.color}`}>{day.fraction}</p>
                <p className={`text-[10px] font-medium mt-1 ${day.active ? 'text-blue-600' : day.color}`}>{day.status}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="pt-8 pb-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-200/60 mt-8">
        <p>© 2025 DIEMS. All rights reserved.</p>
        <div className="flex items-center gap-1.5 mt-2 md:mt-0">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Professional ERP Access Portal
        </div>
      </footer>

      {attendancePanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Session Attendance Details</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {sessionAttendance?.subject?.name || sessionAttendance?.lectureSession?.subject?.name || 'Subject'}
                  {' | '}
                  {sessionAttendance?.classroom?.name || sessionAttendance?.lectureSession?.classroom?.name || 'Classroom'}
                </p>
              </div>
              <button onClick={() => setAttendancePanelOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">Present: {presentCount}</span>
              <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 border border-red-100 font-semibold">Absent: {absentCount}</span>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-semibold">Total: {totalCount}</span>
            </div>

            <div className="p-6 overflow-y-auto">
              {attendancePanelLoading && <p className="text-sm text-slate-500">Loading attendance details...</p>}
              {!attendancePanelLoading && attendancePanelError && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{attendancePanelError}</div>
              )}
              {!attendancePanelLoading && !attendancePanelError && (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                      <tr>
                        <th className="px-4 py-3">Roll</th>
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(sessionAttendance?.records || []).map((record) => (
                        <tr key={record._id || record.student?._id || record.student}>
                          <td className="px-4 py-3 text-slate-700">{record.student?.rollNo || record.student?.prn || '-'}</td>
                          <td className="px-4 py-3 text-slate-800">{record.student?.name || 'Student'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${record.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
