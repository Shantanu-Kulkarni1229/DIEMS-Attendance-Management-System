import React, { useEffect, useState } from 'react';
import { getAdminTimetable, substituteLecture } from '../../services/apiClient';

export default function Timetable() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [substituteFor, setSubstituteFor] = useState(null);
  const [subTeacherId, setSubTeacherId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminTimetable();
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load timetable');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openSubstitute = (session) => {
    setSubstituteFor(session);
    setSubTeacherId('');
  };

  const handleSubstitute = async () => {
    if (!substituteFor || !subTeacherId) return;
    setActionLoading(true);
    try {
      await substituteLecture(substituteFor._id, { actualTeacherId: subTeacherId });
      await load();
      setSubstituteFor(null);
    } catch (err) {
      alert(err.payload?.message || err.message || 'Failed to substitute');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white/90 rounded-2xl p-6 border border-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Timetable & Substitutions</h2>
        <div className="text-sm text-slate-500">Manage session assignments</div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading...</p>}
      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded p-2 mb-3">{error}</div>}

      <div className="space-y-3">
        {sessions.length === 0 && !loading && <p className="text-sm text-slate-500">No timetable sessions found for the selected period.</p>}
        {sessions.map((s) => (
          <div key={s._id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
            <div>
              <div className="font-semibold text-slate-800">{s.subject?.name || 'Subject'} — {s.classroom?.name || 'Class'}</div>
              <div className="text-xs text-slate-500">{new Date(s.startDateTime).toLocaleString()} — {new Date(s.endDateTime).toLocaleTimeString()}</div>
              <div className="text-xs text-slate-400">Assigned: {s.plannedTeacher?.name || 'TBD'}{s.actualTeacher ? ` (Sub: ${s.actualTeacher.name})` : ''}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openSubstitute(s)} className="px-3 py-1 text-sm rounded border border-slate-200 hover:bg-slate-100">Substitute</button>
            </div>
          </div>
        ))}
      </div>

      {substituteFor && (
        <div className="mt-4 p-4 border-t border-slate-100">
          <h3 className="font-semibold text-slate-800">Substitute for: {substituteFor.subject?.name} — {substituteFor.classroom?.name}</h3>
          <div className="mt-2 flex gap-2 items-center">
            <input value={subTeacherId} onChange={(e) => setSubTeacherId(e.target.value)} placeholder="Enter teacher id or email" className="px-3 py-2 border rounded w-full" />
            <button onClick={handleSubstitute} disabled={actionLoading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-70">{actionLoading ? 'Saving...' : 'Save'}</button>
            <button onClick={() => setSubstituteFor(null)} className="px-3 py-2 border rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
