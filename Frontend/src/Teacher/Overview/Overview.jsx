import React from 'react';
import { SkeletonCard, SkeletonTableRow, ButtonSpinner } from '../components/Skeletons';

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatClock = (value) => {
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

const formatFileSize = (value) => {
  if (!value || Number.isNaN(Number(value))) return '';
  const size = Number(value);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

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
  // Compute weighted overall attendance: total present across all sheets / total students across all sheets
  const { totalPresentAcrossSheets, totalStudentsAcrossSheets } = attendanceRecords.reduce((acc, record) => {
    const total = Array.isArray(record.records) ? record.records.length : 0;
    const present = Array.isArray(record.records) ? record.records.filter((entry) => entry.status === 'present').length : 0;
    acc.totalPresentAcrossSheets += present;
    acc.totalStudentsAcrossSheets += total;
    return acc;
  }, { totalPresentAcrossSheets: 0, totalStudentsAcrossSheets: 0 });

  const overallAttendancePercent = totalStudentsAcrossSheets
    ? Math.round((totalPresentAcrossSheets / totalStudentsAcrossSheets) * 100)
    : 0;

  const theoryCount = assignedSubjects.filter((subject) => (subject.category || 'lecture') === 'lecture').length;
  const practicalCount = assignedSubjects.filter((subject) => (subject.category || 'lecture') === 'practical').length;

  const stats = [
    {
      title: 'Assigned Classes',
      value: String(assignedClassrooms.length),
      subtitle: 'Current workload',
      icon: '🏫',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      meta: 'Live assignment data'
    },
    {
      title: 'Teaching Subjects',
      value: String(assignedSubjects.length),
      subtitle: 'Theory + practical mix',
      icon: '📚',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      meta: `${theoryCount} theory • ${practicalCount} practical`
    },
    {
      title: 'Average Attendance',
      value: `${overallAttendancePercent}%`,
      subtitle: 'From recent records',
      icon: '📈',
      color: 'text-violet-700',
      bg: 'bg-violet-50',
      meta: `${attendanceRecords.length} sheets tracked`
    }
  ];

  return (
    <div className="space-y-6 md:space-y-7">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{loading ? 'Loading dashboard...' : `Welcome back, ${profile?.name || 'Teacher'}`}</h1>
        <p className="text-sm text-slate-500 mt-1">{loading ? 'Fetching latest data...' : 'Here is your latest classroom and attendance overview.'}</p>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          [0,1,2].map((i) => <SkeletonCard key={i} className="h-28" />)
        ) : (
          stats.map((stat) => (
            <article key={stat.title} className={`group rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
                <span className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-400'}`}>Live</span>
              </div>
              <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'} mt-4`}>{stat.title}</p>
              <h3 className={`text-3xl font-black leading-none mt-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{stat.value}</h3>
              <p className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'} mt-2`}>{stat.subtitle}</p>
              <p className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-600'} mt-3`}>{stat.meta}</p>
            </article>
          ))
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="space-y-5">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Assigned Classrooms</h2>
            </div>
            <div className="p-4 space-y-2">
              {loading ? (
                [0,1,2].map((i) => <SkeletonCard key={i} className="h-10" />)
              ) : (
                (assignedClassrooms.length ? assignedClassrooms.map((item) => (
                  <div key={item._id} className="px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium flex items-center justify-between">
                    <span>{item.name}</span>
                    <span className="text-xs text-slate-500">{item.year || 'Year'}</span>
                  </div>
                )) : <p className="text-sm text-slate-500 px-1">No assigned classrooms found.</p>)
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Assigned Subjects</h2>
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
                  {req.attachmentUrl && (
                    <a href={req.attachmentUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                      View Attachment
                      <span className="text-[10px] text-slate-400">
                        {req.attachmentName ? `${req.attachmentName}${req.attachmentSize ? ` · ${formatFileSize(req.attachmentSize)}` : ''}` : ''}
                      </span>
                    </a>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : req.date}</p>
                    <p className="text-[10px] text-slate-500">{req.leaveType || req.duration || req.status}</p>
                  </div>
                )) : <p className="text-sm text-slate-500 px-1">No assigned subjects found.</p>)
              )}
            </div>
          </section>
        </div>

        <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Recent Attendance Sheets</h2>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Latest {Math.min(attendanceRecords.length, 6)}</span>
          </div>

          {attendanceRecords.length ? (
            <div className="space-y-3 max-h-130 overflow-y-auto pr-1">
              {attendanceRecords.slice(0, 6).map((record) => {
                const total = Array.isArray(record.records) ? record.records.length : 0;
                const present = Array.isArray(record.records) ? record.records.filter((entry) => entry.status === 'present').length : 0;
                const percent = total ? Math.round((present / total) * 100) : 0;
                const dateText = formatDate(record.date || record.lectureSession?.date);
                const timingText = getLectureTiming(record);
                return (
                  <article key={record._id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800">{record.subject?.name || 'Attendance record'}</h3>
                        <p className="text-sm text-slate-500">{record.classroom?.name || 'Classroom'}</p>
                        <p className="text-xs text-slate-600 mt-1">Date: {dateText}</p>
                        <p className="text-xs text-slate-600">Lecture: {timingText}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{present}/{total} present</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-linear-to-r from-emerald-500 to-sky-500" style={{ width: `${percent}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No attendance records found.</p>
          )}
        </section>
      </section>
    </div>
  );
}
