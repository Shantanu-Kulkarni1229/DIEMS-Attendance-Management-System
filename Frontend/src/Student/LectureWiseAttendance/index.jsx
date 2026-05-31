import { useMemo, useState } from 'react';

const TABS = [
  { id: 'daily', label: 'Daily' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'semester', label: 'Semester' }
];

const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatMonth = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
};

const formatTimeRange = (record) => {
  const start = record?.lectureSession?.startDateTime || record?.startTime;
  const end = record?.lectureSession?.endDateTime || record?.endTime;
  if (!start && !end) return '--';

  if (record?.lectureSession?.startDateTime || record?.lectureSession?.endDateTime) {
    const startDate = start ? new Date(start) : null;
    const endDate = end ? new Date(end) : null;
    const startText = startDate && !Number.isNaN(startDate.getTime())
      ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--';
    const endText = endDate && !Number.isNaN(endDate.getTime())
      ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '--';
    return `${startText} - ${endText}`;
  }

  return `${start || '--'} - ${end || '--'}`;
};

const getStatusTone = (status) => {
  if (status === 'present') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'absent') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const getAttendanceTone = (percentage) => {
  if (percentage >= 75) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (percentage >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
};

const lecturesNeededFor75 = (present, total) => {
  if (!total) return 0;
  const required = Math.ceil(((0.75 * total) - present) / 0.25);
  return Math.max(0, required);
};

const semesterLabelForDate = (value) => {
  if (!value) return 'Semester';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Semester';
  const year = date.getFullYear();
  const half = date.getMonth() < 6 ? 'I' : 'II';
  return `Semester ${half} ${year}`;
};

const groupBy = (items, keyFn) => {
  const groups = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return Array.from(groups.entries()).map(([groupKey, groupItems]) => ({ groupKey, groupItems }));
};

const getStudentAttendanceEntries = (records, studentId) => {
  if (!studentId || !Array.isArray(records)) return [];

  return records
    .map((record) => {
      const studentEntry = Array.isArray(record?.records)
        ? record.records.find((entry) => String(entry?.student?._id || entry?.student) === String(studentId))
        : null;

      if (!studentEntry) return null;

      const sessionDate = record?.lectureSession?.startDateTime || record?.date;

      return {
        id: record?._id,
        date: sessionDate,
        subject: record?.subject,
        classroom: record?.classroom,
        sessionType: record?.sessionType || record?.lectureSession?.status || 'Lecture',
        startTime: record?.startTime,
        endTime: record?.endTime,
        lectureSession: record?.lectureSession,
        status: studentEntry.status || 'absent',
        attendanceSource: studentEntry.attendanceSource || 'manual',
        leaveId: studentEntry.leaveId || null
      };
    })
    .filter(Boolean)
    .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0));
};

const buildViewGroups = (entries, tab) => {
  if (!entries.length) return [];

  if (tab === 'daily') {
    return groupBy(entries, (entry) => formatDate(entry.date)).map(({ groupKey, groupItems }) => ({
      label: groupKey,
      entries: groupItems,
      total: groupItems.length,
      present: groupItems.filter((entry) => entry.status === 'present').length,
      absent: groupItems.filter((entry) => entry.status === 'absent').length
    }));
  }

  if (tab === 'monthly') {
    const monthlyEntries = groupBy(entries, (entry) => formatMonth(entry.date));
    return monthlyEntries.map(({ groupKey, groupItems }) => ({
      label: groupKey,
      entries: groupItems,
      total: groupItems.length,
      present: groupItems.filter((entry) => entry.status === 'present').length,
      absent: groupItems.filter((entry) => entry.status === 'absent').length
    }));
  }

  const semesterEntries = groupBy(entries, (entry) => semesterLabelForDate(entry.date));
  return semesterEntries.map(({ groupKey, groupItems }) => ({
    label: groupKey,
    entries: groupItems,
    total: groupItems.length,
    present: groupItems.filter((entry) => entry.status === 'present').length,
    absent: groupItems.filter((entry) => entry.status === 'absent').length
  }));
};

const getSummaryLabel = (percentage) => {
  if (percentage >= 75) return 'Strong';
  if (percentage >= 60) return 'Watch';
  return 'Low';
};

export default function LectureWiseAttendance({ attendanceData, profile, loading = false, error = '' }) {
  const [activeTab, setActiveTab] = useState('daily');
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const studentId = profile?._id || profile?.id || storedUser?._id || storedUser?.id || storedUser?.prn || profile?.prn || '';

  const attendance = attendanceData?.attendance || {};
  const overall = attendance.overall || {};
  const subjects = Array.isArray(attendance.subjects) ? attendance.subjects : [];
  const records = Array.isArray(attendanceData?.records) ? attendanceData.records : [];

  const studentEntries = useMemo(() => getStudentAttendanceEntries(records, studentId), [records, studentId]);

  const overallPresent = Number.isFinite(Number(overall.present)) ? Number(overall.present) : 0;
  const overallTotal = Number.isFinite(Number(overall.total)) ? Number(overall.total) : 0;
  const overallPercentage = Number.isFinite(Number(overall.percentage)) ? Number(overall.percentage) : 0;
  const overallNeeded = lecturesNeededFor75(overallPresent, overallTotal);

  const subjectRows = useMemo(() => {
    return subjects
      .map((subject) => {
        const total = Number.isFinite(Number(subject.total)) ? Number(subject.total) : 0;
        const present = Number.isFinite(Number(subject.present)) ? Number(subject.present) : 0;
        const percentage = Number.isFinite(Number(subject.percentage)) ? Number(subject.percentage) : 0;
        return {
          subject: subject.subject,
          total,
          present,
          absent: Math.max(0, total - present),
          percentage,
          needed: lecturesNeededFor75(present, total),
          status: getSummaryLabel(percentage)
        };
      })
      .sort((left, right) => right.percentage - left.percentage);
  }, [subjects]);

  const viewGroups = useMemo(() => buildViewGroups(studentEntries, activeTab), [studentEntries, activeTab]);

  const activeRows = studentEntries.length;
  const dailyAttendance = studentEntries.filter((entry) => {
    const date = entry.date ? new Date(entry.date) : null;
    const today = new Date();
    return date && !Number.isNaN(date.getTime()) && date.toDateString() === today.toDateString();
  }).length;

  const monthlyAttendance = studentEntries.filter((entry) => {
    const date = entry.date ? new Date(entry.date) : null;
    const today = new Date();
    return date && !Number.isNaN(date.getTime()) && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }).length;

  const semesterAttendance = studentEntries.filter((entry) => semesterLabelForDate(entry.date).includes(String(new Date().getFullYear()))).length;

  const strongestSubject = subjectRows[0] || null;
  const weakestSubject = subjectRows.length ? subjectRows[subjectRows.length - 1] : null;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
        <div className="absolute inset-0 bg-linear-to-br from-sky-50 via-white to-cyan-50" />
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -bottom-16 left-16 h-48 w-48 rounded-full bg-teal-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 rounded-full border border-sky-100 bg-white/90 px-3 py-1.5 shadow-sm">
              <div className="h-8 w-8 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
                <img src="/image.png" alt="DIEMS logo" className="h-full w-full object-contain p-1" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Lecture Wise Attendance</span>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">Attendance Sheet</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">Subject wise attendance, lecture tracking, and period summaries in one sheet.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-136">
            <div className="rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Overall</p>
              <p className="mt-1.5 text-xl font-semibold text-slate-900">{overallPercentage.toFixed(1)}%</p>
              <p className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getAttendanceTone(overallPercentage)}`}>{getSummaryLabel(overallPercentage)}</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Lectures</p>
              <p className="mt-1.5 text-xl font-semibold text-slate-900">{overallTotal}</p>
              <p className="mt-2 text-xs text-slate-500">Total</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Attended</p>
              <p className="mt-1.5 text-xl font-semibold text-emerald-700">{overallPresent}</p>
              <p className="mt-2 text-xs text-slate-500">Present</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Need</p>
              <p className="mt-1.5 text-xl font-semibold text-slate-900">{overallNeeded}</p>
              <p className="mt-2 text-xs text-slate-500">to reach 75%</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Daily</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-semibold text-slate-900">{dailyAttendance}</div>
              <div className="mt-1 text-sm text-slate-500">Today</div>
            </div>
            <span className="rounded-2xl bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">{getSummaryLabel((dailyAttendance / Math.max(activeRows, 1)) * 100)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Monthly</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-semibold text-slate-900">{monthlyAttendance}</div>
              <div className="mt-1 text-sm text-slate-500">This month</div>
            </div>
            <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{getSummaryLabel((monthlyAttendance / Math.max(activeRows, 1)) * 100)}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Semester</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-semibold text-slate-900">{semesterAttendance}</div>
              <div className="mt-1 text-sm text-slate-500">Current semester</div>
            </div>
            <span className="rounded-2xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">{getSummaryLabel((semesterAttendance / Math.max(activeRows, 1)) * 100)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Period view</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Daily / Monthly / Semester</h2>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Live</div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Days</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{activeTab === 'daily' ? viewGroups.length : studentEntries.length}</p>
            <p className="mt-1 text-sm text-slate-500">{activeTab === 'daily' ? 'Daily buckets' : 'Lecture entries'}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Coverage</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{activeRows}</p>
            <p className="mt-1 text-sm text-slate-500">Tracked lectures</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Focus</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{subjectRows.length}</p>
            <p className="mt-1 text-sm text-slate-500">Subjects in sheet</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Time line</p>
              <p className="mt-1 text-sm text-slate-600">Select the attendance window to review.</p>
            </div>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none"
            >
              {TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Subject wise</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Excel sheet view</h2>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{subjectRows.length} subjects</div>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-500">Loading attendance data...</p>}
        {!loading && error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        {!loading && !error && subjectRows.length > 0 ? (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-4 font-semibold">Subject</th>
                  <th className="px-4 py-4 font-semibold text-center">Total Lectures</th>
                  <th className="px-4 py-4 font-semibold text-center">Attended</th>
                  <th className="px-4 py-4 font-semibold text-center">Percentage</th>
                  <th className="px-4 py-4 font-semibold text-center">Need for 75%</th>
                  <th className="px-4 py-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {subjectRows.map((row) => (
                  <tr key={row.subject} className="hover:bg-slate-50/80">
                    <td className="px-4 py-4 font-semibold text-slate-800">{row.subject}</td>
                    <td className="px-4 py-4 text-center text-slate-700">{row.total}</td>
                    <td className="px-4 py-4 text-center font-semibold text-emerald-700">{row.present}</td>
                    <td className="px-4 py-4 text-center font-semibold text-slate-800">{row.percentage.toFixed(1)}%</td>
                    <td className="px-4 py-4 text-center text-slate-700">{row.needed}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${getAttendanceTone(row.percentage)}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
            No subject attendance found.
          </div>
        )}

        {strongestSubject && weakestSubject && (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Top</p>
              <div className="mt-2 text-lg font-semibold text-slate-900">{strongestSubject.subject}</div>
              <div className="mt-1 text-sm text-slate-600">{strongestSubject.percentage.toFixed(1)}%</div>
            </div>
            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Low</p>
              <div className="mt-2 text-lg font-semibold text-slate-900">{weakestSubject.subject}</div>
              <div className="mt-1 text-sm text-slate-600">{weakestSubject.percentage.toFixed(1)}%</div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 xl:col-span-1 md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Trend</p>
              <div className="mt-2 text-sm text-slate-700">Use the sheet below to compare lecture performance across the selected time line.</div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Lecture detail</p>
              <p className="mt-1 text-sm text-slate-600">More visibility per lecture for the daily view.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">{activeTab === 'daily' ? 'Daily log' : activeTab === 'monthly' ? 'Monthly log' : 'Semester log'}</span>
          </div>

          <div className="mt-4 space-y-3 max-h-192 overflow-y-auto pr-1">
            {viewGroups.length ? viewGroups.map((group) => (
              <div key={group.groupKey} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{group.present}/{group.total} present</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getAttendanceTone((group.present / Math.max(group.total, 1)) * 100)}`}>
                    {((group.present / Math.max(group.total, 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-200">
                  <div
                    className="h-2 rounded-full bg-linear-to-r from-emerald-500 to-sky-500"
                    style={{ width: `${Math.max(4, Math.min((group.present / Math.max(group.total, 1)) * 100, 100))}%` }}
                  />
                </div>
                {activeTab === 'daily' && (
                  <div className="mt-4 space-y-2">
                    {group.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                        <div>
                          <div className="font-semibold text-slate-800">{entry.subject?.name || 'Subject'}</div>
                          <div className="text-xs text-slate-500">{formatTimeRange(entry)} • {entry.classroom?.name || 'Classroom'}</div>
                        </div>
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusTone(entry.status)}`}>
                          {entry.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                No attendance entries found.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
