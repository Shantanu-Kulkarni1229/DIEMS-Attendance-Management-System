import { useEffect, useMemo, useState } from 'react';
import { getStudentTodayLectures } from '../../services/apiClient';

const attendanceBand = (percentage) => {
  if (percentage >= 75) return { label: 'Strong', message: 'On track' };
  if (percentage >= 60) return { label: 'Watch', message: 'Close' };
  return { label: 'Low', message: 'Alert' };
};

const formatPercentage = (value) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const normalizeLecture = (lecture) => ({
  id: lecture?._id || lecture?.sessionId || lecture?.attendanceId,
  subject: lecture?.lectureSession?.subject || lecture?.subject,
  classroom: lecture?.lectureSession?.classroom || lecture?.classroom,
  startDateTime: lecture?.lectureSession?.startDateTime || lecture?.startDateTime || lecture?.date,
  endDateTime: lecture?.lectureSession?.endDateTime || lecture?.endDateTime,
  status: lecture?.lectureSession?.status || lecture?.status || 'scheduled'
});

const getSubjectName = (subject) => subject?.name || subject || 'Unknown subject';

const getClassroomName = (classroom) => classroom?.name || classroom || 'Unknown classroom';

export default function Overview({ attendanceData, loading, error, profile }) {
  const user = profile || JSON.parse(localStorage.getItem('user') || '{}');
  const [todayLectures, setTodayLectures] = useState([]);
  const [lectureError, setLectureError] = useState('');
  const [currentTime] = useState(() => new Date().getTime());

  useEffect(() => {
    let active = true;

    const loadLectures = async () => {
      try {
        const data = await getStudentTodayLectures();
        if (!active) return;
        setTodayLectures(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        if (!active) return;
        setTodayLectures([]);
        setLectureError(fetchError.message || 'Failed to load today\'s lectures.');
      }
    };

    loadLectures();

    return () => {
      active = false;
    };
  }, []);

  const attendance = attendanceData?.attendance || {};
  const overall = attendance.overall || {};
  const subjects = useMemo(() => (Array.isArray(attendance.subjects) ? attendance.subjects : []), [attendance.subjects]);

  const overallPercentage = Number.isFinite(Number(overall.percentage)) ? Number(overall.percentage) : 0;
  const totalClasses = Number.isFinite(Number(overall.total)) ? Number(overall.total) : 0;
  const presentClasses = Number.isFinite(Number(overall.present)) ? Number(overall.present) : 0;
  const absentClasses = Math.max(0, totalClasses - presentClasses);
  const subjectCount = subjects.length;

  const subjectRows = useMemo(() => {
    return subjects
      .map((subject) => {
        const total = Number.isFinite(Number(subject.total)) ? Number(subject.total) : 0;
        const present = Number.isFinite(Number(subject.present)) ? Number(subject.present) : 0;
        const percentage = Number.isFinite(Number(subject.percentage)) ? Number(subject.percentage) : 0;
        return {
          name: subject.subject,
          total,
          present,
          absent: Math.max(0, total - present),
          percentage,
          status: percentage >= 75 ? 'On track' : percentage >= 60 ? 'Watch' : 'Needs attention'
        };
      })
      .sort((left, right) => right.percentage - left.percentage);
  }, [subjects]);

  const strongestSubject = subjectRows[0] || null;
  const weakestSubject = subjectRows.length ? subjectRows[subjectRows.length - 1] : null;
  const attentionSubjects = subjectRows.filter((subject) => subject.percentage < 75).slice(0, 3);
  const band = attendanceBand(overallPercentage);

  const lectureRows = useMemo(() => {
    return todayLectures
      .map(normalizeLecture)
      .sort((left, right) => new Date(left.startDateTime || 0) - new Date(right.startDateTime || 0));
  }, [todayLectures]);

  const nextLecture = lectureRows.find((lecture) => lecture.startDateTime && new Date(lecture.startDateTime).getTime() >= currentTime) || lectureRows[0] || null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl md:p-8">
        <div className="absolute inset-0 bg-linear-to-br from-sky-50 via-white to-cyan-50" />
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -bottom-24 left-24 h-56 w-56 rounded-full bg-teal-200/20 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)] lg:items-center">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 shadow-sm">
              Student Overview
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Welcome back, {user.name || 'Student'}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Quick overview from live student data.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
                {band.label}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
                {attendanceData?.classroom?.name || 'Classroom not assigned'}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
                {subjectCount} subjects tracked
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700">
                {lectureRows.length} lectures today
              </span>
            </div>

            {loading && <p className="text-sm text-slate-500">Loading attendance data...</p>}
            {!loading && error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="relative mx-auto flex w-full max-w-sm flex-col items-center rounded-[1.75rem] border border-white/80 bg-white/90 p-6 text-center shadow-lg shadow-sky-100/50">
            <div className="relative mb-4 flex h-36 w-36 items-center justify-center">
              <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                  cx="60"
                  cy="60"
                  r="48"
                  fill="none"
                  stroke={overallPercentage >= 75 ? '#10b981' : overallPercentage >= 60 ? '#f59e0b' : '#f43f5e'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="301.6"
                  strokeDashoffset={301.6 - (301.6 * overallPercentage) / 100}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-semibold tracking-tight text-slate-900">{formatPercentage(overallPercentage)}</span>
                <span className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">overall</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-900">{presentClasses}/{totalClasses}</p>
              <p className="text-sm text-slate-500">{absentClasses} absent</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Overall</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-semibold text-slate-900">{formatPercentage(overallPercentage)}</div>
            </div>
            <div className={`rounded-2xl px-3 py-2 text-xs font-semibold ${overallPercentage >= 75 ? 'bg-emerald-50 text-emerald-700' : overallPercentage >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
              {band.label}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Classes</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-semibold text-slate-900">{totalClasses}</div>
            </div>
            <div className="text-right text-sm text-slate-500">
              <div><span className="font-semibold text-emerald-600">{presentClasses}</span> P</div>
              <div><span className="font-semibold text-rose-600">{absentClasses}</span> A</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Today</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-semibold text-slate-900">{lectureRows.length}</div>
            </div>
            <div className="text-right text-sm text-slate-500">
              <div className="font-medium text-slate-800">Next</div>
              <div>{nextLecture ? formatTime(nextLecture.startDateTime) : '--'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Subjects</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Quick view</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {subjectCount || 0}
            </div>
          </div>

          {subjectRows.length ? (
            <div className="mt-6 space-y-4">
              {subjectRows.slice(0, 4).map((subject) => (
                <div key={subject.name} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{getSubjectName(subject.name)}</div>
                      <div className="mt-1 text-sm text-slate-500">{subject.present}/{subject.total}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${subject.percentage >= 75 ? 'bg-emerald-50 text-emerald-700' : subject.percentage >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                      {formatPercentage(subject.percentage)}
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200/80">
                    <div
                      className={`h-2 rounded-full ${subject.percentage >= 75 ? 'bg-emerald-500' : subject.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.max(4, Math.min(subject.percentage, 100))}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>{subject.status}</span>
                    <span>{subject.absent}</span>
                  </div>
                </div>
              ))}

              {attentionSubjects.length > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-amber-900">
                  <span className="font-semibold">Watch:</span> {attentionSubjects.map((subject) => getSubjectName(subject.name)).join(', ')}
                </div>
              )}

              {strongestSubject && weakestSubject && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Top</p>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{getSubjectName(strongestSubject.name)}</div>
                    <div className="mt-1 text-sm text-slate-600">{formatPercentage(strongestSubject.percentage)}</div>
                  </div>
                  <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Low</p>
                    <div className="mt-2 text-lg font-semibold text-slate-900">{getSubjectName(weakestSubject.name)}</div>
                    <div className="mt-1 text-sm text-slate-600">{formatPercentage(weakestSubject.percentage)}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
              No subject data yet.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Today</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Lectures</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Live
            </div>
          </div>

          {lectureError && <p className="mt-4 text-sm text-red-600">{lectureError}</p>}

          {lectureRows.length ? (
            <div className="mt-6 space-y-3">
              {lectureRows.slice(0, 4).map((lecture) => (
                <div key={lecture.id || `${lecture.subject}-${lecture.startDateTime}`} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{getSubjectName(lecture.subject)}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {getClassroomName(lecture.classroom)} {lecture.startDateTime ? `• ${formatDateTime(lecture.startDateTime)}` : ''}
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${lecture.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : lecture.status === 'ongoing' ? 'bg-sky-50 text-sky-700' : 'bg-slate-200 text-slate-700'}`}>
                      {String(lecture.status || 'scheduled').toUpperCase()}
                    </div>
                  </div>
                  {lecture.endDateTime && (
                    <div className="mt-2 text-xs text-slate-500">
                      Ends at {formatTime(lecture.endDateTime)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500">
              No lectures.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
