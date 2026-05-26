import { useEffect, useMemo, useState } from 'react';
import { get, remove } from '../services/apiClient';
import TeacherEditModal from './components/TeacherEditModal';

export default function TeacherDetailsPage() {
  const teacherId = window.location.pathname.split('/').filter(Boolean).pop();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await get('/api/admin/teachers');
        const found = Array.isArray(data) ? data.find((t) => String(t._id) === String(teacherId)) : null;
        if (!found) throw new Error('Teacher not found');
        setTeacher(found);
      } catch (err) {
        setError(err.message || 'Failed to load teacher');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teacherId]);

  const initials = useMemo(() => String(teacher?.name || 'T').slice(0, 2).toUpperCase(), [teacher]);

  const handleDelete = async () => {
    if (!teacher?._id) return;
    if (!window.confirm(`Delete teacher ${teacher.name}?`)) return;
    try {
      await remove(`/api/admin/teachers/${teacher._id}`);
      window.location.href = '/admin';
    } catch (err) {
      setMessage(err.message || 'Failed to delete teacher');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading teacher details...</div>;
  }

  if (error || !teacher) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Teacher not found'}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <button onClick={() => window.location.href = '/admin'} className="text-sm font-semibold text-sky-600 hover:text-sky-700 mb-4">← Back to Admin</button>
            <h1 className="text-4xl font-bold text-slate-800">Teacher Details</h1>
            <p className="text-slate-600 mt-2">Full profile, assignments, and access status.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowEdit(true)} className="px-5 py-3 rounded-xl bg-sky-600 text-white font-semibold shadow-lg shadow-sky-600/20">Edit</button>
            <button onClick={handleDelete} className="px-5 py-3 rounded-xl bg-white border border-red-200 text-red-600 font-semibold hover:bg-red-50">Delete</button>
          </div>
        </div>

        {message && <div className="mb-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{message}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center text-2xl font-bold mb-4">{initials}</div>
            <h2 className="text-2xl font-bold text-slate-900">{teacher.name}</h2>
            <p className="text-slate-500 mt-1">{teacher.email}</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p><span className="font-semibold text-slate-800">Branch:</span> {teacher.branch || 'N/A'}</p>
              <p><span className="font-semibold text-slate-800">Password state:</span> {teacher.mustChangePassword ? 'Reset pending' : 'Normal'}</p>
              <p><span className="font-semibold text-slate-800">Created by:</span> {teacher.createdBy || 'System'}</p>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Assigned Classes</h3>
              <div className="flex flex-wrap gap-2">
                {(teacher.assignedClassrooms || []).map((c) => (
                  <span key={c._id || c} className="px-3 py-2 rounded-full bg-sky-100 text-sky-700 text-sm">{c.name || c}</span>
                ))}
                {!teacher.assignedClassrooms?.length && <p className="text-sm text-slate-400">No classes assigned.</p>}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-lg border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Assigned Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {(teacher.assignedSubjects || []).map((s) => (
                  <span key={s._id || s} className="px-3 py-2 rounded-full bg-blue-100 text-blue-700 text-sm">{s.name || s}</span>
                ))}
                {!teacher.assignedSubjects?.length && <p className="text-sm text-slate-400">No subjects assigned.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEdit && <TeacherEditModal teacher={teacher} onClose={() => setShowEdit(false)} onSaved={(items) => setTeacher(items.find((t) => String(t._id) === String(teacherId)) || teacher)} />}
    </div>
  );
}
