import { useState, useEffect } from 'react';
import { getStudentAttendance } from '../../../services/dashboardApi';

const StudentDashboard = () => {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        const data = await getStudentAttendance();
        setAttendance(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading attendance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
        <p className="text-red-700 font-bold">Error loading attendance</p>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const overallPercentage = attendance?.overallPercentage || 0;
  const isAtRisk = overallPercentage < 75;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900">My Attendance</h1>
        <p className="text-slate-600 mt-2">Track your attendance and stay informed</p>
      </div>

      {/* Overall Attendance Card */}
      <div className={`rounded-2xl p-8 border-2 ${
        isAtRisk
          ? 'bg-red-50 border-red-300'
          : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-300'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-sm font-bold uppercase tracking-wider ${
              isAtRisk ? 'text-red-700' : 'text-emerald-700'
            }`}>
              Overall Attendance
            </p>
            <h2 className={`text-6xl font-black mt-2 ${
              isAtRisk ? 'text-red-900' : 'text-emerald-900'
            }`}>
              {overallPercentage}%
            </h2>
          </div>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl ${
            isAtRisk
              ? 'bg-red-200 text-red-700'
              : 'bg-emerald-200 text-emerald-700'
          }`}>
            {isAtRisk ? '⚠️' : '✓'}
          </div>
        </div>

        {isAtRisk && (
          <p className="text-red-700 font-semibold text-sm">
            ⚠️ Your attendance is below 75%. Contact your teacher for more information.
          </p>
        )}
      </div>

      {/* Subject-wise Breakdown */}
      <div>
        <h3 className="text-2xl font-bold text-slate-900 mb-4">Subject-wise Attendance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attendance?.subjectWise?.map((subject) => (
            <div key={subject.subjectId} className="bg-white rounded-xl border-2 border-sky-200 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-sky-700">{subject.subjectName}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{subject.percentage}%</p>
                </div>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-white ${
                  subject.percentage >= 75
                    ? 'bg-emerald-500'
                    : subject.percentage >= 60
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}>
                  {Math.round(subject.percentage)}%
                </div>
              </div>
              <div className="w-full bg-sky-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    subject.percentage >= 75
                      ? 'bg-emerald-500'
                      : subject.percentage >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${subject.percentage}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {subject.present} / {subject.total} sessions attended
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border-2 border-sky-200 p-6">
          <p className="text-sm font-bold text-sky-700 uppercase mb-2">Total Classes</p>
          <p className="text-3xl font-black text-slate-900">{attendance?.totalClasses || 0}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border-2 border-emerald-300 p-6">
          <p className="text-sm font-bold text-emerald-700 uppercase mb-2">Present</p>
          <p className="text-3xl font-black text-emerald-900">{attendance?.presentDays || 0}</p>
        </div>
        <div className="bg-red-50 rounded-xl border-2 border-red-300 p-6">
          <p className="text-sm font-bold text-red-700 uppercase mb-2">Absent</p>
          <p className="text-3xl font-black text-red-900">{attendance?.absentDays || 0}</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border-2 border-sky-300 rounded-2xl p-6">
        <p className="text-sm font-bold text-sky-700 mb-2">📌 Attendance Policy</p>
        <p className="text-sm text-slate-700">
          Maintain at least 75% attendance throughout the semester. Below this threshold may affect your academic standing.
        </p>
      </div>
    </div>
  );
};

export default StudentDashboard;
