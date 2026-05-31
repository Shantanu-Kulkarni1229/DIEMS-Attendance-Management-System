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

const getLectureTiming = (record) => {
  if (record?.startTime || record?.endTime) {
    return `${record?.startTime || '--'} - ${record?.endTime || '--'}`;
  }

  const start = record?.lectureSession?.startDateTime;
  const end = record?.lectureSession?.endDateTime;
  if (start || end) {
    return `${formatClock(start)} - ${formatClock(end)}`;
  }

  return 'Timing unavailable';
};

export default function Overview({ profile, dashboardData, loading = false, theme = 'light' }) {
  const assignedClassrooms = Array.isArray(dashboardData?.assignedClassrooms) ? dashboardData.assignedClassrooms : [];
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
      subtitle: 'Recent sheets',
      icon: '📈',
      color: 'text-violet-700',
      bg: 'bg-violet-50',
      meta: `${attendanceRecords.length} sheets tracked`
    }
  ];

  return (
    <div className="space-y-4 md:space-y-5 max-w-6xl mx-auto">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">{loading ? 'Loading dashboard...' : `Welcome back, ${profile?.name || 'Teacher'}`}</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">{loading ? 'Fetching latest data...' : 'A compact attendance snapshot for today.'}</p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          Live overview
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {loading ? (
          [0,1,2].map((i) => <SkeletonCard key={i} className="h-24 md:h-28 rounded-xl" />)
        ) : (
          stats.map((stat) => (
            <article key={stat.title} className={`group rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${stat.bg} ${stat.color}`}>
                  {stat.icon}
                </div>
                <span className={`text-[11px] font-semibold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-400'}`}>Live</span>
              </div>
              <p className={`text-xs md:text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'} mt-3`}>{stat.title}</p>
              <h3 className={`text-2xl md:text-3xl font-black leading-none mt-1.5 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{stat.value}</h3>
              <p className={`text-[11px] md:text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'} mt-1.5`}>{stat.subtitle}</p>
              <p className={`text-[11px] md:text-xs font-semibold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-600'} mt-2`}>{stat.meta}</p>
            </article>
          ))
        )}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-5 gap-4 md:gap-5">
        <div className="space-y-4 xl:col-span-2">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-slate-800">Assigned Classrooms</h2>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{assignedClassrooms.length}</span>
            </div>
            <div className="p-3 space-y-2">
              {loading ? (
                [0,1,2].map((i) => <SkeletonCard key={i} className="h-9 rounded-lg" />)
              ) : (
                (assignedClassrooms.length ? assignedClassrooms.map((item) => (
                  <div key={item._id} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs md:text-sm text-slate-700 font-medium flex items-center justify-between">
                    <span>{item.name}</span>
                    <span className="text-[10px] md:text-xs text-slate-500">{item.year || 'Year'}</span>
                  </div>
                )) : <p className="text-sm text-slate-500 px-1">No assigned classrooms found.</p>)
              )}
            </div>
          </section>

          <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-slate-800">Assigned Subjects</h2>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{assignedSubjects.length}</span>
            </div>
            <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
              {loading ? (
                [0,1,2,3].map((i) => <SkeletonCard key={i} className="h-10 rounded-lg" />)
              ) : (
                (assignedSubjects.length ? assignedSubjects.map((item) => (
                  <div key={item._id} className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs md:text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                      <span className={`text-[9px] md:text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${(item.category || 'lecture') === 'practical' ? 'bg-violet-100 text-violet-700' : 'bg-sky-100 text-sky-700'}`}>
                        {(item.category || 'lecture') === 'practical' ? 'Practical' : 'Theory'}
                      </span>
                    </div>
                    <p className="text-[11px] md:text-xs text-slate-500 mt-0.5">{item.code || 'No code'}</p>
                  </div>
                )) : <p className="text-sm text-slate-500 px-1">No assigned subjects found.</p>)
              )}
            </div>
          </section>
        </div>

        <section className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm md:text-base font-bold text-slate-800">Recent Attendance Sheets</h2>
            <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide">Latest {Math.min(attendanceRecords.length, 6)}</span>
          </div>

          {attendanceRecords.length ? (
            <div className="space-y-2.5 max-h-[28rem] overflow-y-auto pr-1">
              {attendanceRecords.slice(0, 6).map((record) => {
                const total = Array.isArray(record.records) ? record.records.length : 0;
                const present = Array.isArray(record.records) ? record.records.filter((entry) => entry.status === 'present').length : 0;
                const percent = total ? Math.round((present / total) * 100) : 0;
                const dateText = formatDate(record.date || record.lectureSession?.date);
                const timingText = getLectureTiming(record);
                return (
                  <article key={record._id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm md:text-base">{record.subject?.name || 'Attendance record'}</h3>
                        <p className="text-xs md:text-sm text-slate-500">{record.classroom?.name || 'Classroom'}</p>
                        <p className="text-[11px] md:text-xs text-slate-600 mt-1">Date: {dateText}</p>
                        <p className="text-[11px] md:text-xs text-slate-600">Lecture: {timingText}</p>
                      </div>
                      <span className="text-xs md:text-sm font-semibold text-slate-700">{present}/{total} present</span>
                    </div>
                    <div className="mt-2.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
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
