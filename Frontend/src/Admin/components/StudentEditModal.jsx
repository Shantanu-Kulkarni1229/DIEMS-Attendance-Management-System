import { useState } from 'react';
import { get, patch } from '../../services/apiClient';

export default function StudentEditModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    prn: student?.prn || '',
    rollNo: student?.rollNo || '',
    className: student?.className || '',
    division: student?.division || '',
    phone: student?.phone || '',
    parentEmail: student?.parentEmail || '',
    mustChangePassword: !!student?.mustChangePassword
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  if (!student) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      await patch(`/api/admin/students/${student._id}`, form);
      const freshStudents = await get('/api/admin/students');
      onSaved?.(Array.isArray(freshStudents) ? freshStudents : []);
      onClose();
    } catch (error) {
      setMessage(error.message || 'Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-white overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-sky-500 font-semibold">Student Details</p>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">{student.name}</h2>
            <p className="text-sm text-slate-500 mt-1">Edit student profile and login settings.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          <div className="lg:col-span-1 bg-slate-50 px-6 py-6 border-b lg:border-b-0 lg:border-r border-slate-100">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white p-5 shadow-lg shadow-sky-500/20">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl mb-4">
                {String(student.name || 'S').slice(0, 2).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold">{student.name}</h3>
              <p className="text-sm text-white/80 mt-1">{student.email}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-white/15">{student.branch || 'No branch'}</span>
                <span className="px-2.5 py-1 rounded-full bg-white/15">{student.className || 'No class'}</span>
                <span className="px-2.5 py-1 rounded-full bg-white/15">{student.mustChangePassword ? 'Password reset pending' : 'Active'}</span>
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
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">PRN</label>
                <input value={form.prn} onChange={(e) => setForm((p) => ({ ...p, prn: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Roll No</label>
                <input value={form.rollNo} onChange={(e) => setForm((p) => ({ ...p, rollNo: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Class/Semester</label>
                <input value={form.className} onChange={(e) => setForm((p) => ({ ...p, className: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Division</label>
                <input value={form.division} onChange={(e) => setForm((p) => ({ ...p, division: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Parent Email</label>
                <input value={form.parentEmail} onChange={(e) => setForm((p) => ({ ...p, parentEmail: e.target.value }))} className="w-full rounded-xl border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-300" />
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
