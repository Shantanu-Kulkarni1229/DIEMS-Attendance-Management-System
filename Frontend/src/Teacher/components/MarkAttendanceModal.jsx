import React, { useEffect, useMemo, useState } from 'react';
import { get, patch, post } from '../../services/apiClient';

const MANUAL_SLOTS = {
  Lecture: [
    { label: '10:15 AM - 11:15 AM', startTime: '10:15', endTime: '11:15' },
    { label: '11:15 AM - 12:15 PM', startTime: '11:15', endTime: '12:15' },
    { label: '1:15 PM - 2:15 PM', startTime: '13:15', endTime: '14:15' },
    { label: '2:15 PM - 3:15 PM', startTime: '14:15', endTime: '15:15' },
    { label: '3:30 PM - 4:30 PM', startTime: '15:30', endTime: '16:30' },
    { label: '4:30 PM - 5:30 PM', startTime: '16:30', endTime: '17:30' }
  ],
  Practical: [
    { label: '10:15 AM - 12:15 PM', startTime: '10:15', endTime: '12:15' },
    { label: '1:15 PM - 3:15 PM', startTime: '13:15', endTime: '15:15' },
    { label: '3:30 PM - 5:30 PM', startTime: '15:30', endTime: '17:30' }
  ]
};

const BATCH_SIZE = 20;

const toInputDate = (date = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const compareRollNumbers = (left, right) => String(left || '').localeCompare(String(right || ''), undefined, { numeric: true, sensitivity: 'base' });

const getBatchPrefix = (classroomName = '') => {
  const normalized = String(classroomName || '').trim();
  const suffixMatch = normalized.match(/([A-Z])\s*(?:\([^)]*\))?$/i);
  if (suffixMatch && suffixMatch[1]) return suffixMatch[1].toUpperCase();
  if (normalized.includes('-')) {
    const lastPart = normalized.split('-').pop().trim();
    if (lastPart) return lastPart.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'A';
  }
  return 'A';
};

const buildPracticalBatches = (students = [], classroomName = '') => {
  const sortedStudents = [...students].sort((left, right) => compareRollNumbers(left.roll, right.roll));
  const prefix = getBatchPrefix(classroomName);
  const batches = [];

  sortedStudents.forEach((student, index) => {
    const batchIndex = Math.floor(index / BATCH_SIZE);
    if (!batches[batchIndex]) {
      batches[batchIndex] = {
        id: `${prefix}-${batchIndex + 1}`,
        label: `${prefix}-${batchIndex + 1}`,
        startRoll: student.roll,
        endRoll: student.roll,
        students: []
      };
    }
    batches[batchIndex].students.push(student);
    batches[batchIndex].endRoll = student.roll;
  });

  return batches.filter(Boolean);
};

export default function MarkAttendanceModal({ onClose, initialData, onSaved, dashboardData }) {
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsByClassroom, setStudentsByClassroom] = useState({});
  const [absentInput, setAbsentInput] = useState('');
  const [highlightedRows, setHighlightedRows] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [sessionType, setSessionType] = useState('Lecture');
  const [selectedSlot, setSelectedSlot] = useState(MANUAL_SLOTS.Lecture[0]);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [date, setDate] = useState(toInputDate());
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const normalizeClassroom = (item) => {
    if (!item) return null;
    return {
      _id: String(item._id || item.id),
      name: item.name || item.className || item.label || 'Classroom',
      year: item.year || item.semester || ''
    };
  };

  const normalizeSubject = (item) => {
    if (!item) return null;
    return {
      _id: String(item._id || item.id),
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
        } catch (contextError) {
          context = null;
        }

        const dashboardClasses = Array.isArray(dashboardData?.assignedClassrooms)
          ? dashboardData.assignedClassrooms
          : Array.isArray(dashboardData?.teacher?.assignedClassrooms)
            ? dashboardData.teacher.assignedClassrooms
            : [];
        const dashboardSubjects = Array.isArray(dashboardData?.assignedSubjects)
          ? dashboardData.assignedSubjects
          : [];
        const dashboardStudentsByClassroom = dashboardData?.studentsByClassroom || {};

        const classes = (Array.isArray(context?.assignedClassrooms) && context.assignedClassrooms.length ? context.assignedClassrooms : dashboardClasses)
          .map(normalizeClassroom)
          .filter(Boolean);
        const subs = (Array.isArray(context?.assignedSubjects) && context.assignedSubjects.length ? context.assignedSubjects : dashboardSubjects)
          .map(normalizeSubject)
          .filter(Boolean);

        setClassrooms(classes);
        setSubjects(subs);

        const rawStudentsMap = context?.studentsByClassroom || dashboardStudentsByClassroom || {};
        const studentsMap = Object.keys(rawStudentsMap || {}).reduce((acc, key) => {
          acc[String(key)] = rawStudentsMap[key];
          return acc;
        }, {});
        setStudentsByClassroom(studentsMap);

        const preferredClassroom =
          (initialData?.classroomId && classes.find((c) => c._id === initialData.classroomId)) ||
          (initialData?.class && classes.find((c) => String(c.name).toLowerCase() === String(initialData.class).toLowerCase())) ||
          classes.find((c) => Array.isArray(studentsMap[c._id]) && studentsMap[c._id].length > 0) ||
          classes[0];

        if (preferredClassroom) setSelectedClassroomId(preferredClassroom._id);
        if (subs[0]) setSelectedSubjectId(subs[0]._id);

        if (initialData?.class) {
          const byName = classes.find((c) => String(c.name).toLowerCase() === String(initialData.class).toLowerCase());
          if (byName) setSelectedClassroomId(byName._id);
        }
        if (initialData?.subject) {
          const clean = String(initialData.subject || '').split('(')[0].trim().toLowerCase();
          const bySubject = subs.find((s) => String(s.name).trim().toLowerCase() === clean);
          if (bySubject) setSelectedSubjectId(bySubject._id);
        }
        if (initialData?.date) {
          setDate(toInputDate(initialData.date));
        }
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to load your assigned classes/subjects.' });
      } finally {
        setLoading(false);
      }
    };

    loadInit();
  }, [
    (dashboardData && Array.isArray(dashboardData.assignedClassrooms) ? dashboardData.assignedClassrooms.length : 0),
    (dashboardData && Array.isArray(dashboardData.assignedSubjects) ? dashboardData.assignedSubjects.length : 0),
    initialData?.date || null,
    initialData?.class || null,
    initialData?.subject || null
  ]);

  useEffect(() => {
    const slots = MANUAL_SLOTS[sessionType] || MANUAL_SLOTS.Lecture;
    if (!slots.some((slot) => slot.startTime === selectedSlot.startTime && slot.endTime === selectedSlot.endTime)) {
      setSelectedSlot(slots[0]);
    }
  }, [sessionType, selectedSlot.startTime, selectedSlot.endTime]);

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

  const selectedClassroom = useMemo(
    () => classrooms.find((c) => c._id === selectedClassroomId),
    [classrooms, selectedClassroomId]
  );

  const selectedSubject = useMemo(
    () => subjects.find((s) => s._id === selectedSubjectId),
    [subjects, selectedSubjectId]
  );

  const practicalBatches = useMemo(
    () => (sessionType === 'Practical' ? buildPracticalBatches(students, selectedClassroom?.name) : []),
    [sessionType, students, selectedClassroom?.name]
  );

  const selectedPracticalStudents = useMemo(() => {
    if (sessionType !== 'Practical') return students;
    if (!selectedBatchIds.length) return [];
    const batchSet = new Set(selectedBatchIds);
    return practicalBatches
      .filter((batch) => batchSet.has(batch.id))
      .flatMap((batch) => batch.students);
  }, [sessionType, students, practicalBatches, selectedBatchIds]);

  useEffect(() => {
    if (sessionType === 'Practical') {
      setSelectedBatchIds(practicalBatches.map((batch) => batch.id));
    } else {
      setSelectedBatchIds([]);
    }
  }, [sessionType, practicalBatches]);

  const toggleAttendance = (studentId) => {
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, present: !s.present } : s)));
    setHighlightedRows((prev) => prev.filter((id) => id !== studentId));
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

  const toggleBatchSelection = (batchId) => {
    setSelectedBatchIds((prev) => (
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    ));
  };

  const selectAllBatches = () => {
    setSelectedBatchIds(practicalBatches.map((batch) => batch.id));
  };

  const clearBatchSelection = () => {
    setSelectedBatchIds([]);
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

    if (sessionType === 'Practical' && !selectedPracticalStudents.length) {
      setMessage({ type: 'error', text: 'Please select at least one practical batch.' });
      return;
    }

    const attendanceStudents = sessionType === 'Practical' ? selectedPracticalStudents : students;
    const records = attendanceStudents.map((s) => ({
      student: s.id,
      status: s.present ? 'present' : 'absent'
    }));

    setSaving(true);
    setMessage(null);
    try {
      await post('/api/teacher/mark-attendance', {
        date,
        classroom: selectedClassroomId,
        subject: selectedSubjectId,
        sessionType,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        practicalBatchIds: sessionType === 'Practical' ? selectedBatchIds : [],
        records
      });
      setMessage({ type: 'success', text: 'Attendance saved successfully.' });
      if (typeof onSaved === 'function') {
        await onSaved();
      }
      setTimeout(() => onClose(), 700);
    } catch (error) {
      const payload = error && error.payload ? error.payload : null;
      const backendMessage = payload && (payload.message || (Array.isArray(payload.errors) ? payload.errors.join('; ') : null));

      if (error.status === 409) {
        try {
          const conflictPayload = error && error.payload ? error.payload : null;
          const canPatch = conflictPayload ? conflictPayload.canPatch !== false : true;
          let recordId = conflictPayload && conflictPayload.existingAttendanceId ? conflictPayload.existingAttendanceId : null;

          if (!canPatch) {
            throw new Error((conflictPayload && conflictPayload.message) || 'Attendance is already marked by another teacher for this date.');
          }

          if (!recordId) {
            const existing = await get(
              `/api/teacher/attendance-records?classroom=${selectedClassroomId}&subject=${selectedSubjectId}&date=${date}&sessionType=${encodeURIComponent(sessionType)}&startTime=${selectedSlot.startTime}&endTime=${selectedSlot.endTime}`
            );
            const record = Array.isArray(existing) ? existing.find((item) => item && item._id) : null;
            recordId = record && record._id ? record._id : null;
          }

          if (!recordId) {
            throw new Error((conflictPayload && conflictPayload.message) || 'Existing attendance not found for patch.');
          }

          await patch(`/api/teacher/update-attendance/${recordId}`, { records });
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

  const presentCount = selectedPracticalStudents.filter((s) => s.present).length;
  const absentCount = selectedPracticalStudents.length - presentCount;
  const displayedStudents = sessionType === 'Practical' ? selectedPracticalStudents : students;

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
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Class</p>
            <select value={selectedClassroomId} onChange={(e) => setSelectedClassroomId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg">
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>{c.name}{c.year ? ` (${c.year})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</p>
            <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg">
              {subjects.map((s) => (
                <option key={s._id} value={s._id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-6 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-sky-50/50 border-b border-sky-100">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Session Type</p>
            <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white">
              <option value="Lecture">Lecture (1 Hour)</option>
              <option value="Practical">Practical / Lab (2 Hours)</option>
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Time Slot</p>
            <select
              value={`${selectedSlot.startTime}-${selectedSlot.endTime}`}
              onChange={(e) => {
                const chosen = (MANUAL_SLOTS[sessionType] || []).find((slot) => `${slot.startTime}-${slot.endTime}` === e.target.value);
                if (chosen) setSelectedSlot(chosen);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              {(MANUAL_SLOTS[sessionType] || []).map((slot) => (
                <option key={`${slot.startTime}-${slot.endTime}`} value={`${slot.startTime}-${slot.endTime}`}>
                  {slot.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {sessionType === 'Practical' && (
          <div className="px-6 pb-4 bg-sky-50/50 border-b border-sky-100">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Practical Batches</p>
                  <p className="text-sm text-slate-600">Select one or more batches for this lab session</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={selectAllBatches} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                    Select All
                  </button>
                  <button type="button" onClick={clearBatchSelection} className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors">
                    Clear
                  </button>
                </div>
              </div>

              {practicalBatches.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {practicalBatches.map((batch) => {
                    const isSelected = selectedBatchIds.includes(batch.id);
                    return (
                      <button
                        key={batch.id}
                        type="button"
                        onClick={() => toggleBatchSelection(batch.id)}
                        className={`text-left rounded-xl border px-4 py-3 transition-all ${isSelected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-800">{batch.label}</p>
                            <p className="text-xs text-slate-500">Rolls {batch.startRoll} - {batch.endRoll}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {batch.students.length}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No students available to build practical batches.</p>
              )}
            </div>
          </div>
        )}

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
                  {sessionType === 'Practical' && selectedBatchIds.length ? ` | Batches: ${selectedBatchIds.join(', ')}` : ''}
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
                    {displayedStudents.map((student) => (
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
                    {displayedStudents.length === 0 && (
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
