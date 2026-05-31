import { useEffect, useMemo, useState } from 'react';
import { get, patch, post } from '../../services/apiClient';
import { SkeletonCard, SkeletonTableRow, ButtonSpinner } from './Skeletons';

const toInputDate = (date = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addOneHour = (time) => {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return '10:00';
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date();
  next.setHours(hours, minutes, 0, 0);
  next.setHours(next.getHours() + 1);
  return `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
};

// helper removed: end time will be chosen explicitly by user via dropdown

export default function MarkAttendanceModal({ onClose, initialData, onSaved, dashboardData, theme = 'light' }) {
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsByClassroom, setStudentsByClassroom] = useState({});
  const [absentInput, setAbsentInput] = useState('');
  const [highlightedRows, setHighlightedRows] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState(initialData?.sessionId || '');
  const [date, setDate] = useState(toInputDate());
  const [startTime, setStartTime] = useState(initialData?.startTime || '09:00');
  const [endTime, setEndTime] = useState(initialData?.endTime || '11:15');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dashboardAssignedClassrooms = useMemo(() => {
    if (Array.isArray(dashboardData?.assignedClassrooms)) return dashboardData.assignedClassrooms;
    if (Array.isArray(dashboardData?.teacher?.assignedClassrooms)) return dashboardData.teacher.assignedClassrooms;
    return [];
  }, [dashboardData]);

  const dashboardAssignedSubjects = useMemo(() => (Array.isArray(dashboardData?.assignedSubjects) ? dashboardData.assignedSubjects : []), [dashboardData]);
  const dashboardStudentsByClassroom = useMemo(() => dashboardData?.studentsByClassroom || {}, [dashboardData]);
  const initialSessionId = initialData?.sessionId || null;

  const normalizeClassroom = (item) => {
    if (!item) return null;
    return {
      _id: item._id || item.id,
      name: item.name || item.className || item.label || 'Classroom',
      year: item.year || item.semester || ''
    };
  };

  const normalizeSubject = (item) => {
    if (!item) return null;
    return {
      _id: item._id || item.id,
      name: item.name || item.subject || 'Subject',
      code: item.code || ''
    };
  };

  useEffect(() => {
    const loadInit = async () => {
      try {
        let context = null;
        try {
          context = await get('/api/teacher/attendance-context');
        } catch (error) {
          setMessage({ type: 'error', text: error.message || 'Failed to load your assigned classes and subjects.' });
          context = null;
        }

        const classes = (Array.isArray(context?.assignedClassrooms) && context.assignedClassrooms.length ? context.assignedClassrooms : dashboardAssignedClassrooms)
          .map(normalizeClassroom)
          .filter(Boolean);
        const subs = (Array.isArray(context?.assignedSubjects) && context.assignedSubjects.length ? context.assignedSubjects : dashboardAssignedSubjects)
          .map(normalizeSubject)
          .filter(Boolean);

        setClassrooms(classes);
        setSubjects(subs);
        setStudentsByClassroom(context?.studentsByClassroom || dashboardStudentsByClassroom || {});

        if (classes[0]) setSelectedClassroomId(classes[0]._id);
        if (subs[0]) setSelectedSubjectId(subs[0]._id);

        if (initialData?.sessionId) {
          setSelectedSessionId(initialData.sessionId);
          if (initialData.classroomId) setSelectedClassroomId(initialData.classroomId);
          if (initialData.subjectId) setSelectedSubjectId(initialData.subjectId);
          if (initialData.date) setDate(toInputDate(initialData.date));
          if (initialData.startTime) {
            setStartTime(initialData.startTime);
            const computedEnd = initialData.endTime || addOneHour(initialData.startTime);
            setEndTime(computedEnd);
          }
          if (initialData.endTime && !initialData.startTime) setEndTime(initialData.endTime);
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to load your assigned classes/subjects.' });
      } finally {
        setLoading(false);
      }
    };

    loadInit();
  }, [dashboardAssignedClassrooms, dashboardAssignedSubjects, dashboardStudentsByClassroom, initialSessionId]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClassroomId) {
        setStudents([]);
        return;
      }

      const cachedStudents = studentsByClassroom[selectedClassroomId];
      if (Array.isArray(cachedStudents)) {
        const mapped = cachedStudents.map((s) => ({
          id: s._id,
          roll: s.rollNo || s.prn || String(s._id).slice(-4),
          name: s.name,
          present: true
        }));
        setStudents(mapped);
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
  }, [selectedClassroomId, studentsByClassroom]);

  const selectedClassroom = useMemo(() => classrooms.find((c) => c._id === selectedClassroomId), [classrooms, selectedClassroomId]);
  const selectedSubject = useMemo(() => subjects.find((s) => s._id === selectedSubjectId), [subjects, selectedSubjectId]);

  const handleStartTimeChange = (value) => {
    setStartTime(value);
  };

  const toggleAttendance = (studentId) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, present: !s.present } : s)));
    setHighlightedRows((prev) => prev.filter((r) => r !== studentId));
  };

  const applyAbsentees = () => {
    const raw = String(absentInput || '').trim();
    if (!raw) return;

    // split on commas, semicolons, newlines or whitespace
    const tokens = raw.split(/[,;\n\s]+/).map((t) => t.trim()).filter(Boolean);
    if (!tokens.length) return;

    const toHighlight = [];

    setStudents((prev) => prev.map((s) => {
      const rollRaw = String(s.roll || '');
      const rollLower = rollRaw.toLowerCase();
      const rollDigits = rollRaw.replace(/\D/g, '');
      const rollDigitsNoZeros = rollDigits.replace(/^0+/, '') || rollDigits;

      let matched = false;
      for (const token of tokens) {
        // handle ranges like 1-5
        if (/^\d+-\d+$/.test(token)) {
          const [lo, hi] = token.split('-').map((n) => Number(n.replace(/\D/g, '')));
          const studentNum = Number(rollDigitsNoZeros);
          if (!Number.isNaN(studentNum) && studentNum >= lo && studentNum <= hi) {
            matched = true;
            break;
          }
        }

        const tLower = token.toLowerCase();
        const tDigits = token.replace(/\D/g, '');
        const tDigitsNoZeros = tDigits.replace(/^0+/, '') || tDigits;

        // exact alphanumeric match (full roll string)
        if (tLower && tLower === rollLower) { matched = true; break; }

        if (tDigits) {
          // For short numeric tokens (1-2 digits) only match exact numeric roll (ignoring leading zeros)
          if (tDigits.length <= 2) {
            if (rollDigitsNoZeros === tDigitsNoZeros) { matched = true; break; }
          } else {
            // For longer numeric tokens allow exact or trailing match
            if (rollDigits === tDigits || rollDigits.endsWith(tDigits) || rollDigitsNoZeros === tDigitsNoZeros) { matched = true; break; }
          }
        }

        // trailing alphanumeric token match only for longer tokens (reduce accidental short matches)
        if (tLower && tLower.length >= 3 && rollLower.endsWith(tLower)) { matched = true; break; }
      }

      if (matched) {
        toHighlight.push(s.id);
        return { ...s, present: false };
      }
      return s;
    }));

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

    const records = students.map((s) => ({ student: s.id, status: s.present ? 'present' : 'absent' }));

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
          sessionType: 'manual',
          startTime,
          endTime,
          records
        });
      }

      setMessage({ type: 'success', text: 'Attendance saved successfully.' });
      if (typeof onSaved === 'function') await onSaved();
      setTimeout(() => onClose(), 700);
    } catch (error) {
      const payload = error && error.payload ? error.payload : null;
      const backendMessage = payload && (payload.message || (Array.isArray(payload.errors) ? payload.errors.join('; ') : null));

      if (error.status === 409) {
        try {
          const existing = await get(`/api/teacher/attendance-records?classroom=${selectedClassroomId}&subject=${selectedSubjectId}&date=${date}`);
          const record = Array.isArray(existing) ? existing[0] : null;
          if (!record || !record._id) throw new Error('Existing attendance not found for patch.', { cause: error });
          await patch(`/api/teacher/update-attendance/${record._id}`, { records });
          setMessage({ type: 'success', text: 'Existing attendance updated for selected date.' });
          if (typeof onSaved === 'function') await onSaved();
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

  const mainContent = loading ? (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <SkeletonCard className="h-12" />
        <SkeletonCard className="h-12" />
        <SkeletonCard className="h-12" />
      </div>
      <SkeletonCard className="h-10" />
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonTableRow key={i} cols={3} />)}
      </div>
    </div>
  ) : (
    <div>
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white p-3 sm:p-4 rounded-md border border-slate-200 shadow-sm mb-4'}`}>
        <label className={`block text-sm font-bold mb-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Quick Mark Absentees</label>
        <div className="flex gap-3">
          <input type="text" value={absentInput} onChange={(e) => setAbsentInput(e.target.value)} placeholder="Enter roll numbers separated by commas" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" />
          <button onClick={applyAbsentees} className={`${theme === 'dark' ? 'px-3 py-1 sm:px-6 sm:py-2 bg-sky-600 text-white rounded-md text-sm' : 'px-3 py-1 sm:px-6 sm:py-2 bg-slate-800 text-white rounded-md text-sm'}`}>Apply</button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-600'}`}>
          {selectedClassroom ? `Class: ${selectedClassroom.name}` : 'No class selected'}
          {selectedSubject ? ` | Subject: ${selectedSubject.name}` : ''}
        </div>
        <div className="flex gap-4 text-sm font-semibold">
          <div className={`${theme === 'dark' ? 'text-emerald-300 bg-emerald-900/40' : 'text-emerald-600 bg-emerald-50'} px-3 py-1 rounded-full`}>Present: {presentCount}</div>
          <div className={`${theme === 'dark' ? 'text-red-300 bg-red-900/40' : 'text-red-600 bg-red-50'} px-3 py-1 rounded-full`}>Absent: {absentCount}</div>
        </div>
      </div>

      <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm'}`}>
        <div className="overflow-x-auto">
          <div className="max-h-[42vh] sm:max-h-[60vh] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className={`${theme === 'dark' ? 'bg-slate-700 border-b border-slate-700 text-slate-100' : 'bg-slate-50 border-b border-slate-200 text-slate-600'} font-semibold`}>
                <tr><th className="px-3 sm:px-6 py-2 w-24">Roll No</th><th className="px-3 sm:px-6 py-2">Student Name</th><th className="px-3 sm:px-6 py-2 w-32 text-center">Present</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className={`${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} ${!student.present ? (theme === 'dark' ? 'bg-red-900/30' : 'bg-red-50/30') : ''} ${highlightedRows.includes(student.id) ? (theme === 'dark' ? 'bg-red-800/30' : 'bg-red-100/50') : ''}`}
                    onClick={() => toggleAttendance(student.id)}
                  >
                    <td className={`px-3 sm:px-6 py-2 font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-slate-700'}`}>{student.roll}</td>
                    <td className={`px-3 sm:px-6 py-2 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{student.name}</td>
                    <td className="px-3 sm:px-6 py-2 text-center">
                      <div className={`w-6 h-6 rounded border flex items-center justify-center ${student.present ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                        {student.present && (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-3 sm:px-6 py-4 text-center text-slate-500">No students found for selected classroom.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
      <div className={`${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl shadow-2xl w-full max-w-full sm:max-w-3xl md:max-w-4xl max-h-[95vh] flex flex-col overflow-hidden`}>
        <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-slate-100 bg-white text-slate-800'}`}>
          <div>
            <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Mark Attendance</h2>
            <p className={`text-sm mt-0.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>Review and submit attendance</p>
          </div>
          <button onClick={onClose} className={`${theme === 'dark' ? 'p-2 text-slate-300 hover:text-slate-100 hover:bg-slate-700/40' : 'p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100'} rounded-full`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message && (
            <div className={`mx-6 mt-4 p-3 rounded-lg text-sm ${message.type === 'success' ? (theme === 'dark' ? 'bg-green-900 text-green-300 border border-green-800' : 'bg-green-50 text-green-700 border border-green-200') : (theme === 'dark' ? 'bg-red-900 text-red-300 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200')}`}>
            {message.text}
          </div>
        )}

        <div className={`${theme === 'dark' ? 'px-4 sm:px-6 py-4 bg-slate-800/40 border-b border-slate-700 text-slate-100' : 'px-4 sm:px-6 py-4 bg-sky-50/50 border-b border-sky-100 text-slate-800'} grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm`}>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</p>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!!selectedSessionId} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-slate-500 mb-1">Start Time</p>
                <select value={startTime} onChange={(e) => {
                  const v = e.target.value;
                  setStartTime(v);
                }} disabled={!!selectedSessionId} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  <option value="">Select time</option>
                  <option value="10:15">10.15</option>
                  <option value="11:15">11.15</option>
                  <option value="13:15">1.15</option>
                  <option value="14:15">2.15</option>
                  <option value="15:30">3.30</option>
                  <option value="16:30">4.30</option>
                </select>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1">End Time</p>
                <select value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!!selectedSessionId} className={`${theme === 'dark' ? 'w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 mt-2' : 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white mt-2'}`}>
                  <option value="">Select end time</option>
                  <option value="11:15">11.15</option>
                  <option value="12:15">12.15</option>
                  <option value="14:15">2.15</option>
                  <option value="15:15">3.15</option>
                  <option value="16:30">4.30</option>
                  <option value="17:30">5.30</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Class</p>
            <select value={selectedClassroomId} onChange={(e) => setSelectedClassroomId(e.target.value)} disabled={!!selectedSessionId} className="w-full px-3 py-2 border border-slate-200 rounded-lg">
              {classrooms.map((c) => (<option key={c._id} value={c._id}>{c.name}{c.year ? ` (${c.year})` : ''}</option>))}
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</p>
            <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} disabled={!!selectedSessionId} className="w-full px-3 py-2 border border-slate-200 rounded-lg">
              {subjects.map((s) => (<option key={s._id} value={s._id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">{mainContent}</div>

              <div className={`${theme === 'dark' ? 'p-6 bg-slate-900 border-t border-slate-700 text-slate-100' : 'p-6 bg-white border-t border-slate-100'} flex items-center justify-between`}>
          <button onClick={resetAll} className={`${theme === 'dark' ? 'px-3 py-2 text-sm font-semibold text-slate-200 bg-slate-700 rounded-md sm:px-5 sm:py-2.5' : 'px-3 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-md sm:px-5 sm:py-2.5'}`}>Reset All</button>

          <div className="flex gap-3">
            <button onClick={onClose} className={`${theme === 'dark' ? 'px-3 py-2 text-sm font-semibold text-slate-200 rounded-md sm:px-5 sm:py-2.5' : 'px-3 py-2 text-sm font-semibold text-slate-700 rounded-md sm:px-5 sm:py-2.5'}`}>Cancel</button>
            <button onClick={saveAttendance} disabled={saving || loading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md sm:px-6 sm:py-2.5 flex items-center justify-center">
              {saving ? <ButtonSpinner size={4} /> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
