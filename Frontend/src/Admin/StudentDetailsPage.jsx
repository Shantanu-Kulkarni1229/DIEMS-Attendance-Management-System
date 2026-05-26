import { useEffect, useMemo, useState } from 'react';
import { get, remove } from '../services/apiClient';
import StudentEditModal from './components/StudentEditModal';

export default function StudentDetailsPage() {
  const studentId = window.location.pathname.split('/').filter(Boolean).pop();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await get('/api/admin/students');
        const found = Array.isArray(data) ? data.find((s) => String(s._id) === String(studentId)) : null;
        if (!found) throw new Error('Student not found');
        setStudent(found);
      } catch (err) {
        setError(err.message || 'Failed to load student');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  const initials = useMemo(() => String(student?.name || 'S').slice(0, 2).toUpperCase(), [student]);

  const handleDelete = async () => {
    if (!student?._id) return;
    if (!window.confirm(`Delete student ${student.name}?`)) return;
    try {
      await remove(`/api/admin/students/${student._id}`);
      window.location.href = '/admin';
    } catch (err) {
      setMessage(err.message || 'Failed to delete student');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading student details...</div>;
  }

  if (error || !student) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Student not found'}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <button onClick={() => window.location.href = '/admin'} className="text-sm font-semibold text-sky-600 hover:text-sky-700 mb-4">← Back to Admin</button>
            <h1 className="text-4xl font-bold text-slate-800">Student Details</h1>
            <p className="text-slate-600 mt-2">Full profile, class assignment, and login status.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowEdit(true)} className="px-5 py-3 rounded-xl bg-sky-600 text-white font-semibold shadow-lg shadow-sky-600/20">Edit</button>
            <button onClick={handleDelete} className="px-5 py-3 rounded-xl bg-white border border-red-200 text-red-600 font-semibold hover:bg-red-50">Delete</button>
          </div>
        </div>

        {message && <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{message}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center text-2xl font-bold mb-4">{initials}</div>
            <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
            <p className="text-slate-500 mt-1">{student.email}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-800">Class:</span> {student.className || 'N/A'}</p>
              <p><span className="font-semibold text-slate-800">Division:</span> {student.division || 'N/A'}</p>
              <p><span className="font-semibold text-slate-800">Password state:</span> {student.mustChangePassword ? 'Reset pending' : 'Normal'}</p>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Identity</h3>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-semibold text-slate-800">PRN:</span> {student.prn || 'N/A'}</p>
                <p><span className="font-semibold text-slate-800">Roll No:</span> {student.rollNo || 'N/A'}</p>
                <p><span className="font-semibold text-slate-800">Phone:</span> {student.phone || 'N/A'}</p>
                <p><span className="font-semibold text-slate-800">Parent email:</span> {student.parentEmail || 'N/A'}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Academic Status</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-2 rounded-full bg-sky-100 text-sky-700 text-sm">{student.className || 'No class'}</span>
                <span className="px-3 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm">{student.division || 'No division'}</span>
                <span className="px-3 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm">Active learner</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEdit && <StudentEditModal student={student} onClose={() => setShowEdit(false)} onSaved={(items) => setStudent(items.find((s) => String(s._id) === String(studentId)) || student)} />}
    </div>
  );
}
