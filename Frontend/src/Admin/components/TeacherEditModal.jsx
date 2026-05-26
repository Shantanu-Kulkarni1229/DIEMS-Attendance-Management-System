import { useMemo, useState } from 'react';
import { get, patch } from '../../services/apiClient';

export default function TeacherEditModal({ teacher, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: teacher?.name || '',
    email: teacher?.email || '',
    mustChangePassword: !!teacher?.mustChangePassword,
    assignedClassrooms: (teacher?.assignedClassrooms || []).map((c) => c?._id || c).filter(Boolean),
    subjects: (teacher?.assignedSubjects || []).map((s) => s?._id || s).filter(Boolean)
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const classroomLabels = useMemo(() => (teacher?.assignedClassrooms || []).map((c) => c?.name || String(c)), [teacher]);
  const subjectLabels = useMemo(() => (teacher?.assignedSubjects || []).map((s) => s?.name || String(s)), [teacher]);

  if (!teacher) return null;

  const toggleValue = (key, id) => {
    setForm((prev) => {
      const values = prev[key];
      return {
        ...prev,
        [key]: values.includes(id) ? values.filter((v) => v !== id) : [...values, id]
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        mustChangePassword: form.mustChangePassword,
        assignedClassrooms: form.assignedClassrooms,
        subjects: form.subjects
      };
      await patch(`/api/admin/teachers/${teacher._id}`, payload);
      const freshTeachers = await get('/api/admin/teachers');
      onSaved?.(Array.isArray(freshTeachers) ? freshTeachers : []);
      onClose();
    } catch (error) {
      setMessage(error.message || 'Failed to save teacher.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-white overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-500 font-semibold">Teacher Details</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">{teacher.name}</h2>
            <p className="text-sm text-slate-500 mt-1">Edit profile, assignment, and access settings.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          <div className="lg:col-span-1 bg-slate-50 px-6 py-6 border-b lg:border-b-0 lg:border-r border-slate-100">
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white p-5 shadow-lg shadow-sky-500/20">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl mb-4">
                {String(teacher.name || 'T').slice(0, 2).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold">{teacher.name}</h3>
              <p className="text-sm text-white/80 mt-1">{teacher.email}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-white/15">{teacher.branch || 'No branch'}</span>
                <span className="px-2.5 py-1 rounded-full bg-white/15">{teacher.mustChangePassword ? 'Password reset pending' : 'Active'}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Assigned Classes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {classroomLabels.length ? classroomLabels.map((label) => (
                    <span key={label} className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700">{label}</span>
                  )) : <span className="text-slate-400">No classes assigned</span>}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Assigned Subjects</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {subjectLabels.length ? subjectLabels.map((label) => (
                    <span key={label} className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">{label}</span>
                  )) : <span className="text-slate-400">No subjects assigned</span>}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="lg:col-span-2 p-6 space-y-5">
            {message && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{message}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Assigned Classes</label>
              <div className="flex flex-wrap gap-2">
                {(teacher.assignedClassrooms || []).map((cls) => {
                  const id = cls?._id || cls;
                  const label = cls?.name || String(cls);
                  const active = form.assignedClassrooms.includes(id);
                  return (
                    <button key={id} type="button" onClick={() => toggleValue('assignedClassrooms', id)} className={`px-3 py-2 rounded-full text-sm border transition-colors ${active ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                      {label}
                    </button>
                  );
                })}
                {!teacher.assignedClassrooms?.length && <span className="text-sm text-slate-400">No class options available from current data.</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">Assigned Subjects</label>
              <div className="flex flex-wrap gap-2">
                {(teacher.assignedSubjects || []).map((subj) => {
                  const id = subj?._id || subj;
                  const label = subj?.name || String(subj);
                  const active = form.subjects.includes(id);
                  return (
                    <button key={id} type="button" onClick={() => toggleValue('subjects', id)} className={`px-3 py-2 rounded-full text-sm border transition-colors ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                      {label}
                    </button>
                  );
                })}
                {!teacher.assignedSubjects?.length && <span className="text-sm text-slate-400">No subject options available from current data.</span>}
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-slate-700">
              <input type="checkbox" checked={form.mustChangePassword} onChange={(e) => setForm((p) => ({ ...p, mustChangePassword: e.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-300" />
              Force password change on next login
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-lg shadow-sky-500/20 disabled:opacity-70">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
