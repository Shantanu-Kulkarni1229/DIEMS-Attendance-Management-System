import { useState, useEffect } from 'react';
import { markAttendance, getTeacherAttendanceRecords, getClassrooms, getSubjects } from '../../../services/dashboardApi';

const TeacherDashboard = () => {
  const [section, setSection] = useState('mark'); // mark, manage, reports
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentStatuses, setStudentStatuses] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classroomsData, subjectsData] = await Promise.all([
          getClassrooms(),
          getSubjects(),
        ]);
        setClassrooms(classroomsData);
        setSubjects(subjectsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!selectedClassroom || !selectedSubject) {
      setError('Please select classroom and subject');
      return;
    }

    try {
      setSubmitting(true);
      await markAttendance({
        classroomId: selectedClassroom,
        subjectId: selectedSubject,
        date: selectedDate,
        studentStatuses,
      });
      setError(null);
      setStudentStatuses({});
      alert('Attendance marked successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && section !== 'reports') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900">Attendance Management</h1>
        <p className="text-slate-600 mt-2">Mark and manage student attendance</p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-3 border-b-2 border-sky-200">
        {[
          { id: 'mark', label: '✏️ Mark Attendance', icon: '✅' },
          { id: 'manage', label: '📝 Manage Records', icon: '📋' },
          { id: 'reports', label: '📊 Reports', icon: '📈' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            className={`px-6 py-3 font-bold text-sm border-b-4 transition-all ${
              section === tab.id
                ? 'border-sky-600 text-sky-700 bg-sky-50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
          <p className="text-red-700 font-bold">Error: {error}</p>
        </div>
      )}

      {/* Mark Attendance Section */}
      {section === 'mark' && (
        <form onSubmit={handleMarkAttendance} className="space-y-6">
          {/* Form Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Classroom</label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              >
                <option value="">Select classroom...</option>
                {classrooms.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              >
                <option value="">Select subject...</option>
                {subjects.map((subj) => (
                  <option key={subj._id} value={subj._id}>
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Attendance List */}
          <div className="bg-white rounded-xl border-2 border-sky-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Student Attendance</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 hover:bg-sky-50 rounded-lg">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setStudentStatuses({
                        ...studentStatuses,
                        [`student${i}`]: e.target.checked ? 'present' : 'absent',
                      })
                    }
                    className="w-5 h-5 border-2 border-sky-300 rounded"
                  />
                  <span className="flex-1 font-semibold text-slate-900">Student {i}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    studentStatuses[`student${i}`] === 'present'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {studentStatuses[`student${i}`] === 'present' ? '✓ Present' : 'Absent'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-4 bg-gradient-to-r from-sky-600 to-sky-500 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50"
          >
            {submitting ? '📤 Submitting...' : '✓ Mark Attendance'}
          </button>
        </form>
      )}

      {/* Manage Records Section */}
      {section === 'manage' && (
        <div className="space-y-4">
          <p className="text-slate-600">Edit previously marked attendance records</p>
          <div className="bg-white rounded-xl border-2 border-sky-200 p-6">
            <p className="text-slate-600">No records to display yet</p>
          </div>
        </div>
      )}

      {/* Reports Section */}
      {section === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border-2 border-sky-300 p-6">
            <p className="text-sm font-bold text-sky-700 uppercase mb-2">Total Classes Marked</p>
            <p className="text-4xl font-black text-slate-900">24</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-300 p-6">
            <p className="text-sm font-bold text-emerald-700 uppercase mb-2">This Month</p>
            <p className="text-4xl font-black text-slate-900">5</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300 p-6">
            <p className="text-sm font-bold text-purple-700 uppercase mb-2">Average Attendance</p>
            <p className="text-4xl font-black text-slate-900">87%</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
