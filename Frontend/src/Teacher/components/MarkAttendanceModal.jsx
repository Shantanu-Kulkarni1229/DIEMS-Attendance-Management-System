import React, { useEffect, useMemo, useState } from 'react';
import { get, patch, post } from '../../services/apiClient';

const toInputDate = (date = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function MarkAttendanceModal({ onClose, initialData, onSaved }) {
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [absentInput, setAbsentInput] = useState('');
  const [highlightedRows, setHighlightedRows] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(initialData?.sessionId || '');
  const [date, setDate] = useState(toInputDate());
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadInit = async () => {
      try {
        const dashboard = await get('/api/teacher/dashboard');
        const classes = Array.isArray(dashboard?.teacher?.assignedClassrooms) ? dashboard.teacher.assignedClassrooms : [];
        const subs = Array.isArray(dashboard?.assignedSubjects) ? dashboard.assignedSubjects : [];
        setClassrooms(classes);
        setSubjects(subs);

        if (classes[0]) setSelectedClassroomId(classes[0]._id);
        if (subs[0]) setSelectedSubjectId(subs[0]._id);

        if (initialData && initialData.sessionId) {
          setSelectedSessionId(initialData.sessionId);
          if (initialData.classroomId) setSelectedClassroomId(initialData.classroomId);
          if (initialData.subjectId) setSelectedSubjectId(initialData.subjectId);
          if (initialData.date) setDate(toInputDate(initialData.date));
        }

        // Best-effort preselect based on schedule card text
        if (initialData && initialData.class) {
          const byName = classes.find((c) => String(c.name).toLowerCase() === String(initialData.class).toLowerCase());
          if (byName) setSelectedClassroomId(byName._id);
        }
        if (initialData && initialData.subject) {
          const clean = String(initialData.subject || '').split('(')[0].trim().toLowerCase();
          const bySubject = subs.find((s) => String(s.name).trim().toLowerCase() === clean);
          if (bySubject) setSelectedSubjectId(bySubject._id);
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to load your assigned classes/subjects.' });
      } finally {
        setLoading(false);
      }
    };

    loadInit();
  }, [initialData]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClassroomId) {
        setStudents([]);
        return;
      }
      try {
        const data = await get(`/api/teacher/classrooms/${selectedClassroomId}/students`);
        const mapped = (Array.isArray(data) ? data : []).map((s) => ({
          id: s._id,
          roll: s.rollNo || s.prn || String(s._id).slice(-4),
          name: s.name,
          present: true
        }));
        setStudents(mapped);
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to load students.' });
      }
    };

    loadStudents();
  }, [selectedClassroomId]);

  const selectedClassroom = useMemo(
    () => classrooms.find((c) => c._id === selectedClassroomId),
    [classrooms, selectedClassroomId]
  );

  const selectedSubject = useMemo(
    () => subjects.find((s) => s._id === selectedSubjectId),
    [subjects, selectedSubjectId]
  );

  const toggleAttendance = (studentId) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, present: !s.present } : s)));
    setHighlightedRows((prev) => prev.filter((r) => r !== studentId));
  };

  const applyAbsentees = () => {
    const rollsToMarkAbsent = absentInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (rollsToMarkAbsent.length === 0) return;

    const toHighlight = [];
    setStudents((prev) =>
      prev.map((s) => {
        if (rollsToMarkAbsent.includes(String(s.roll))) {
          toHighlight.push(s.id);
          return { ...s, present: false };
        }
        return s;
      })
    );
    setHighlightedRows(toHighlight);
    setAbsentInput('');
  };

  const resetAll = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, present: true })));
    setHighlightedRows([]);
  };

  const saveAttendance = async () => {
    if (!selectedClassroomId || !selectedSubjectId || !date) {
      setMessage({ type: 'error', text: 'Please select class, subject, and date.' });
      return;
    }
    if (!students.length) {
      setMessage({ type: 'error', text: 'No students found for selected class.' });
      return;
    }

    const records = students.map((s) => ({
      student: s.id,
      status: s.present ? 'present' : 'absent'
    }));

    setSaving(true);
    setMessage(null);
    try {
      if (selectedSessionId) {
        await post(`/api/timetable/teacher/sessions/${selectedSessionId}/attendance`, { records });
      } else {
        await post('/api/teacher/mark-attendance', {
          date,
          classroom: selectedClassroomId,
          subject: selectedSubjectId,
          records
        });
      }
      setMessage({ type: 'success', text: 'Attendance saved successfully.' });
      if (typeof onSaved === 'function') {
        await onSaved();
      }
      setTimeout(() => onClose(), 700);
    } catch (error) {
      // prefer backend-sent structured messages when present
      const payload = error && error.payload ? error.payload : null;
      const backendMessage = payload && (payload.message || (Array.isArray(payload.errors) ? payload.errors.join('; ') : null));

      if (selectedSessionId) {
        setMessage({ type: 'error', text: backendMessage || error.message || 'Failed to save session attendance.' });
        setSaving(false);
        return;
      }

      // If already created for this day/class/subject, patch existing record.
      if (error.status === 409) {
        try {
          const existing = await get(`/api/teacher/attendance-records?classroom=${selectedClassroomId}&subject=${selectedSubjectId}&date=${date}`);
          const record = Array.isArray(existing) ? existing[0] : null;
          if (!record || !record._id) throw new Error('Existing attendance not found for patch.');
          await patch(`/api/teacher/update-attendance/${record._id}`, { records });
          setMessage({ type: 'success', text: 'Existing attendance updated for selected date.' });
          if (typeof onSaved === 'function') {
            await onSaved();
          }
          setTimeout(() => onClose(), 700);
        } catch (patchError) {
          const pPayload = patchError && patchError.payload ? patchError.payload : null;
          const pMsg = pPayload && (pPayload.message || (Array.isArray(pPayload.errors) ? pPayload.errors.join('; ') : null));
          setMessage({ type: 'error', text: pMsg || patchError.message || 'Failed to patch existing attendance.' });
        }
      } else {
        setMessage({ type: 'error', text: backendMessage || error.message || 'Failed to save attendance.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.present).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Mark Attendance</h2>
            <p className="text-sm text-slate-500 mt-0.5">Review and submit attendance</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        <div className="px-6 py-4 bg-sky-50/50 border-b border-sky-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</p>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!!selectedSessionId} className="w-full px-3 py-2 border border-slate-200 rounded-lg disabled:bg-slate-100 disabled:text-slate-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Class</p>
            <select value={selectedClassroomId} onChange={(e) => setSelectedClassroomId(e.target.value)} disabled={!!selectedSessionId} className="w-full px-3 py-2 border border-slate-200 rounded-lg disabled:bg-slate-100 disabled:text-slate-500">
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>{c.name}{c.year ? ` (${c.year})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</p>
            <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} disabled={!!selectedSessionId} className="w-full px-3 py-2 border border-slate-200 rounded-lg disabled:bg-slate-100 disabled:text-slate-500">
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {loading ? (
            <p className="text-sm text-slate-500">Loading classes and subjects...</p>
          ) : (
            <>
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 relative overflow-hidden">
                <label className="block text-sm font-bold text-slate-800 mb-3 relative z-10">Quick Mark Absentees</label>
                <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={absentInput}
                      onChange={(e) => setAbsentInput(e.target.value)}
                      placeholder="Enter roll numbers separated by commas"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                    />
                  </div>
                  <button onClick={applyAbsentees} className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors whitespace-nowrap">
                    Apply Absentees
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-slate-600">
                  {selectedClassroom ? `Class: ${selectedClassroom.name}` : 'No class selected'}
                  {selectedSubject ? ` | Subject: ${selectedSubject.name}` : ''}
                </div>
                <div className="flex gap-4 text-sm font-semibold">
                  <div className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Present: {presentCount}</div>
                  <div className="text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">Absent: {absentCount}</div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 w-24">Roll No</th>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3 w-32 text-center">Present</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${!student.present ? 'bg-red-50/30' : ''} ${highlightedRows.includes(student.id) ? 'bg-red-100/50 animate-pulse-once' : ''}`}
                        onClick={() => toggleAttendance(student.id)}
                      >
                        <td className="px-6 py-3 font-medium text-slate-700">{student.roll}</td>
                        <td className="px-6 py-3 text-slate-800">{student.name}</td>
                        <td className="px-6 py-3 text-center">
                          <div className="inline-flex items-center justify-center">
                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${student.present ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                              {student.present && (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-6 text-center text-slate-500">No students found for selected classroom.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
          <button onClick={resetAll} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            Reset All
          </button>

          <div className="flex gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button
              onClick={saveAttendance}
              disabled={saving || loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
