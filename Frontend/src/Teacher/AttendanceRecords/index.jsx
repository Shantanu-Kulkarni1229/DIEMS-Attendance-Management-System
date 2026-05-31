import { useEffect, useMemo, useState } from 'react';
import { get, post } from '../../services/apiClient';
import { SkeletonCard, SkeletonTableRow, ButtonSpinner } from '../components/Skeletons';

const RANGE_PRESETS = [
  { id: 'day', label: 'Day Wise' },
  { id: 'month', label: 'Month Wise' },
  { id: 'two-month', label: '2 Month Wise' },
  { id: 'semester', label: 'Semester Wise' }
];

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const monthStart = (offsetMonths = 0) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - offsetMonths);
  date.setHours(0, 0, 0, 0);
  return date;
};

const semesterStart = () => {
  const date = new Date();
  const month = date.getMonth();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  date.setMonth(month < 6 ? 0 : 6);
  return date;
};

const toIsoDate = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return value;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const fallback = new Date(value);
  if (!Number.isNaN(fallback.getTime())) return fallback.toISOString().slice(0, 10);
  return '';
};

const getRangeForPreset = (preset) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  if (preset === 'day') {
    const todayDate = new Date();
    const start = new Date(todayDate);
    start.setHours(0, 0, 0, 0);
    return { from: start, to: end };
  }
  if (preset === 'two-month') return { from: monthStart(1), to: end };
  if (preset === 'semester') return { from: semesterStart(), to: end };
  return { from: monthStart(0), to: end };
};

const calculateSummaryRows = (students = [], records = [], creditTotals = {}) => {
  const rowMap = new Map();
  const sessionMap = new Map();

  records.forEach((record) => {
    const sessionKey = record.lectureSession?._id || `${record.date}-${record.classroom?._id || record.classroom}-${record.subject?._id || record.subject}-${record.startTime || ''}-${record.endTime || ''}`;
    if (!sessionMap.has(sessionKey)) sessionMap.set(sessionKey, record);
  });

  const distinctSessions = Array.from(sessionMap.values());

  students.forEach((student) => {
    rowMap.set(student._id, {
      id: student._id,
      rollNo: student.rollNo || student.prn || '--',
      name: student.name || 'Student',
      totalLectures: 0,
      attendedLectures: 0
    });
  });

  distinctSessions.forEach((record) => {
    // compute duration for the session
    let durationHours = 1;
    try {
      if (record.lectureSession && record.lectureSession.startDateTime && record.lectureSession.endDateTime) {
        const sd = new Date(record.lectureSession.startDateTime);
        const ed = new Date(record.lectureSession.endDateTime);
        durationHours = Math.max(1, Math.round((ed - sd) / 3600000));
      } else if (record.date && record.startTime && record.endTime) {
        const day = new Date(record.date);
        const [sh, sm] = (record.startTime || '').split(':').map(Number);
        const [eh, em] = (record.endTime || '').split(':').map(Number);
        const sd = new Date(day); sd.setHours(sh || 0, sm || 0, 0, 0);
        const ed = new Date(day); ed.setHours(eh || 0, em || 0, 0, 0);
        durationHours = Math.max(1, Math.round((ed - sd) / 3600000));
      }
    } catch (err) {
      durationHours = 1;
    }

    const isPractical = (record.subject && (record.subject.category || '').toLowerCase() === 'practical');
    const weight = isPractical ? Math.round(durationHours / 2) : Math.round(durationHours);

    const studentStatus = new Map((record.records || []).map((entry) => [entry.student?._id || entry.student, entry.status]));
    students.forEach((student) => {
      const row = rowMap.get(student._id);
      if (!row) return;
      row.totalLectures += weight;
      if (studentStatus.get(student._id) === 'present') {
        row.attendedLectures += weight;
      }
    });
  });

  return Array.from(rowMap.values()).map((row) => {
    const creditLectures = Number(creditTotals[row.id] || 0);
    const effectiveAttended = Math.min(row.attendedLectures + creditLectures, row.totalLectures);
    const effectiveAbsent = Math.max(row.totalLectures - effectiveAttended, 0);
    const percentage = row.totalLectures ? ((effectiveAttended / row.totalLectures) * 100).toFixed(2) : '0.00';

    return {
      ...row,
      creditLectures,
      attendedLectures: effectiveAttended,
      absentLectures: effectiveAbsent,
      percentage
    };
  });
};

export default function AttendanceRecords({ dashboardData, mode = 'lecture', loading: parentLoading = false, theme = 'light' }) {
  const [preset, setPreset] = useState('day');
  const [customFrom, setCustomFrom] = useState(toIsoDate(monthStart(0)));
  const [customTo, setCustomTo] = useState(toIsoDate(new Date()));
  const [dayWiseDate, setDayWiseDate] = useState(toIsoDate(new Date()));
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const effectiveLoading = parentLoading || loading;
  const [message, setMessage] = useState('');
  const [records, setRecords] = useState([]);
  const [creditRows, setCreditRows] = useState([]);
  const [creditInputByStudent, setCreditInputByStudent] = useState({});
  const [submittingStudentId, setSubmittingStudentId] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentsByClassroom, setStudentsByClassroom] = useState({});

  const assignedClassrooms = Array.isArray(dashboardData?.assignedClassrooms) ? dashboardData.assignedClassrooms : [];
  const assignedSubjects = Array.isArray(dashboardData?.assignedSubjects) ? dashboardData.assignedSubjects : [];

  const filteredSubjects = useMemo(() => {
    const targetCategory = mode === 'practical' ? 'practical' : 'lecture';
    return assignedSubjects.filter((subject) => (subject.category || 'lecture') === targetCategory);
  }, [assignedSubjects, mode]);

  const selectedClassroom = useMemo(() => assignedClassrooms.find((classroom) => classroom._id === selectedClassroomId), [assignedClassrooms, selectedClassroomId]);
  const selectedSubject = useMemo(() => filteredSubjects.find((subject) => subject._id === selectedSubjectId), [filteredSubjects, selectedSubjectId]);
  const activeRange = useMemo(() => {
    if (preset === 'day') {
      return { from: dayWiseDate, to: dayWiseDate };
    }
    if (preset === 'custom') {
      return { from: customFrom, to: customTo };
    }
    const range = getRangeForPreset(preset);
    return { from: toIsoDate(range.from), to: toIsoDate(range.to) };
  }, [preset, customFrom, customTo, dayWiseDate]);

  useEffect(() => {
    if (!selectedClassroomId && assignedClassrooms[0]) {
      setSelectedClassroomId(assignedClassrooms[0]._id);
    }
  }, [assignedClassrooms, selectedClassroomId]);

  useEffect(() => {
    if (!selectedSubjectId && filteredSubjects[0]) {
      setSelectedSubjectId(filteredSubjects[0]._id);
    }
  }, [filteredSubjects, selectedSubjectId]);

  useEffect(() => {
    const loadClassStudents = async () => {
      if (!selectedClassroomId) return;
      if (Array.isArray(dashboardData?.studentsByClassroom?.[selectedClassroomId])) {
        setStudentsByClassroom((prev) => ({ ...prev, [selectedClassroomId]: dashboardData.studentsByClassroom[selectedClassroomId] }));
        return;
      }

      try {
        const data = await get(`/api/teacher/classrooms/${selectedClassroomId}/students`);
        setStudentsByClassroom((prev) => ({ ...prev, [selectedClassroomId]: Array.isArray(data) ? data : [] }));
      } catch (error) {
        setStudentsByClassroom((prev) => ({ ...prev, [selectedClassroomId]: [] }));
      }
    };

    loadClassStudents();
  }, [dashboardData, selectedClassroomId]);

  const loadRecords = async () => {
    if (!selectedClassroomId || !selectedSubjectId) {
      setMessage('Select a classroom and subject first.');
      return;
    }

    const range = preset === 'custom'
      ? { from: customFrom, to: customTo }
      : (preset === 'day' ? { from: dayWiseDate, to: dayWiseDate } : getRangeForPreset(preset));

    setLoading(true);
    setMessage('');
    try {
      const params = new URLSearchParams({
        classroom: selectedClassroomId,
        subject: selectedSubjectId,
        from: toIsoDate(range.from),
        to: toIsoDate(range.to)
      });
      if (preset === 'day') {
        params.delete('from');
        params.delete('to');
        params.set('date', dayWiseDate);
      }

      const creditsParams = new URLSearchParams({
        classroom: selectedClassroomId,
        subject: selectedSubjectId
      });
      if (preset === 'day') {
        creditsParams.set('date', dayWiseDate);
      } else {
        creditsParams.set('from', toIsoDate(range.from));
        creditsParams.set('to', toIsoDate(range.to));
      }

      const [attendanceData, creditsData] = await Promise.all([
        get(`/api/teacher/attendance-records?${params.toString()}`),
        get(`/api/teacher/attendance-credits?${creditsParams.toString()}`)
      ]);

      setRecords(Array.isArray(attendanceData) ? attendanceData : []);
      setCreditRows(Array.isArray(creditsData) ? creditsData : []);
    } catch (error) {
      setRecords([]);
      setCreditRows([]);
      setMessage(error.message || 'Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClassroomId && selectedSubjectId) {
      loadRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassroomId, selectedSubjectId, preset, dayWiseDate]);

  useEffect(() => {
    if (preset === 'custom' && selectedClassroomId && selectedSubjectId) {
      loadRecords();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customFrom, customTo]);

  const students = Array.isArray(studentsByClassroom[selectedClassroomId]) ? studentsByClassroom[selectedClassroomId] : [];
  const creditTotalsByStudent = useMemo(() => {
    const totals = {};
    creditRows.forEach((entry) => {
      const sid = entry?.student?._id || entry?.student;
      if (!sid) return;
      totals[sid] = Number(totals[sid] || 0) + Number(entry?.lectures || 0);
    });
    return totals;
  }, [creditRows]);

  const summaryRows = useMemo(() => calculateSummaryRows(students, records, creditTotalsByStudent), [students, records, creditTotalsByStudent]);

  const filteredSummaryRows = useMemo(() => {
    const q = String(studentSearchQuery || '').trim().toLowerCase();
    if (!q) return summaryRows;
    return summaryRows.filter((row) => {
      const name = String(row.name || '').toLowerCase();
      const rollNo = String(row.rollNo || '').toLowerCase();
      return name.includes(q) || rollNo.includes(q);
    });
  }, [summaryRows, studentSearchQuery]);

  const handleCreditInputChange = (studentId, value) => {
    const parsed = Math.max(0, Number.parseInt(value || '0', 10) || 0);
    setCreditInputByStudent((prev) => ({ ...prev, [studentId]: parsed }));
  };

  const incrementCreditInput = (studentId) => {
    const current = Number(creditInputByStudent[studentId] || 0);
    handleCreditInputChange(studentId, current + 1);
  };

  const decrementCreditInput = (studentId) => {
    const current = Number(creditInputByStudent[studentId] || 0);
    handleCreditInputChange(studentId, Math.max(0, current - 1));
  };

  const submitRowAttendanceCredit = async (studentId) => {
    if (!selectedClassroomId || !selectedSubjectId) {
      setMessage('Select classroom and subject before adding attendance credits.');
      return;
    }

    const lectures = Number(creditInputByStudent[studentId] || 0);
    if (!Number.isInteger(lectures) || lectures <= 0) {
      setMessage('Enter a valid lecture count (1,2,3...) for this student.');
      return;
    }

    setSubmittingStudentId(studentId);
    setMessage('');
    try {
      await post('/api/teacher/attendance-credits', {
        classroom: selectedClassroomId,
        subject: selectedSubjectId,
        date: dayWiseDate,
        credits: [{ student: studentId, lectures }]
      });

      setCreditInputByStudent((prev) => ({ ...prev, [studentId]: 0 }));
      setMessage('Attendance added successfully.');
      await loadRecords();
    } catch (error) {
      setMessage(error.message || 'Failed to add attendance credits.');
    } finally {
      setSubmittingStudentId('');
    }
  };

  const totalLectures = useMemo(() => {
    const unique = new Set(records.map((record) => record.lectureSession?._id || `${record.date}-${record.startTime}-${record.endTime}`));
    return unique.size;
  }, [records]);

  const totalAttendedLectures = useMemo(() => summaryRows.reduce((acc, row) => acc + Number(row.attendedLectures || 0), 0), [summaryRows]);
  const totalMissedLectures = useMemo(() => summaryRows.reduce((acc, row) => acc + Number(row.absentLectures || 0), 0), [summaryRows]);
  const totalManualCredits = useMemo(() => creditRows.reduce((acc, row) => acc + Number(row.lectures || 0), 0), [creditRows]);

  const attendanceTakenByTeacher = records.length;
  const classLabel = selectedClassroom?.name || 'Classroom';
  const subjectLabel = selectedSubject ? `${selectedSubject.name}${selectedSubject.code ? ` (${selectedSubject.code})` : ''}` : 'Subject';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Attendance Records</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${mode === 'practical' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'}`}>
            {mode === 'practical' ? 'Practical' : 'Theory'}
          </span>
        </div>
        <p className="text-sm text-slate-500">Class-wise attendance sheet with monthly, 2-month, and semester views.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-xl p-3 shadow-sm`}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Class</p>
          <p className="mt-1 text-sm font-bold truncate">{classLabel}</p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-xl p-3 shadow-sm`}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Subject</p>
          <p className="mt-1 text-sm font-bold truncate">{subjectLabel}</p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-xl p-3 shadow-sm`}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Lectures</p>
          <p className="mt-1 text-sm font-bold text-emerald-700">{totalLectures}</p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-xl p-3 shadow-sm`}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Attended</p>
          <p className="mt-1 text-sm font-bold text-blue-700">{totalAttendedLectures}</p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-xl p-3 shadow-sm`}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Missed</p>
          <p className="mt-1 text-sm font-bold text-red-700">{totalMissedLectures}</p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-xl p-3 shadow-sm`}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Manual Add</p>
          <p className="mt-1 text-sm font-bold text-violet-700">{totalManualCredits}</p>
        </div>
      </div>

      <div className={`rounded-2xl border shadow-sm p-4 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className="flex flex-col xl:flex-row xl:items-end gap-4">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="block text-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Classroom</span>
              <select value={selectedClassroomId} onChange={(e) => setSelectedClassroomId(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg">
                {assignedClassrooms.map((classroom) => (
                  <option key={classroom._id} value={classroom._id}>{classroom.name}{classroom.year ? ` (${classroom.year})` : ''}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</span>
              <select value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg">
                {filteredSubjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>{subject.name}{subject.code ? ` (${subject.code})` : ''}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">View</span>
              <select value={preset} onChange={(e) => setPreset(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg">
                {RANGE_PRESETS.map((presetItem) => (
                  <option key={presetItem.id} value={presetItem.id}>{presetItem.label}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Day Wise Date</span>
              <input type="date" value={dayWiseDate} onChange={(e) => setDayWiseDate(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg" />
            </label>
          </div>

            <div className="flex flex-wrap gap-2">
            <button onClick={() => setPreset('day')} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${preset === 'day' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}>Day Wise</button>
            <button onClick={() => setPreset('month')} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${preset === 'month' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}>Month Wise</button>
            <button onClick={() => setPreset('two-month')} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${preset === 'two-month' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}>2 Month Wise</button>
            <button onClick={() => setPreset('semester')} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${preset === 'semester' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'}`}>Semester Wise</button>
            <button onClick={loadRecords} disabled={effectiveLoading} className="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 text-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
              {effectiveLoading ? <ButtonSpinner size={4} /> : 'Refresh'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">From</span>
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg" />
          </label>
        </div>
      </div>

      {message && <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">{message}</div>}

      <div className={`rounded-2xl border overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
        <div className={`px-5 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-slate-700 text-slate-100' : 'border-slate-100 text-slate-800'}`}>
          <div>
            <h2 className="text-lg font-bold">Excel Style Summary</h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>{loading ? 'Loading records...' : `${filteredSummaryRows.length} students`}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={studentSearchQuery}
              onChange={(e) => setStudentSearchQuery(e.target.value)}
              placeholder="Search student by name or roll..."
              className="w-64 max-w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <div className="text-sm text-slate-500">{formatDate(activeRange.from)} - {formatDate(activeRange.to)}</div>
          </div>
        </div>

          <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${theme === 'dark' ? 'bg-slate-700 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-600'} font-semibold`}>
              <tr>
                <th className={`px-3 sm:px-4 py-3 sticky left-0 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-50'}`}>Roll No</th>
                <th className="px-3 sm:px-4 py-3">Student</th>
                <th className="px-3 sm:px-4 py-3">Total Lectures</th>
                <th className="px-3 sm:px-4 py-3">Lectures Attended</th>
                <th className="px-3 sm:px-4 py-3">Manual Added</th>
                <th className="px-3 sm:px-4 py-3">Add Lectures</th>
                <th className="px-3 sm:px-4 py-3">Lectures Missed</th>
                <th className="px-3 sm:px-4 py-3">Percentage</th>
                <th className="px-3 sm:px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {effectiveLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td colSpan={9} className="px-4 py-4">
                      <SkeletonTableRow cols={9} />
                    </td>
                  </tr>
                ))
              ) : filteredSummaryRows.map((row) => {
                const isBelowThreshold = Number(row.percentage) < 75;
                const isSubmittingRow = submittingStudentId === row.id;
                return (
                <tr key={row.id} className={`${isBelowThreshold ? (theme === 'dark' ? 'bg-red-900/40 hover:bg-red-800/40' : 'bg-red-50 hover:bg-red-100/80') : (theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50')}`}>
                  <td className={`px-4 py-3 font-semibold sticky left-0 ${isBelowThreshold ? (theme === 'dark' ? 'bg-red-900/40 text-slate-100' : 'bg-red-50 text-slate-700') : (theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-700')}`}>{row.rollNo}</td>
                  <td className={`px-4 py-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{row.name}</td>
                  <td className={`px-4 py-3 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{row.totalLectures}</td>
                  <td className="px-4 py-3 text-emerald-700 font-semibold">{row.attendedLectures}</td>
                  <td className="px-4 py-3 text-violet-700 font-semibold">{row.creditLectures}</td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-1.5 py-1">
                      <button
                        type="button"
                        onClick={() => decrementCreditInput(row.id)}
                        className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                      >
                        -
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold text-slate-800">{creditInputByStudent[row.id] ?? 0}</span>
                      <button
                        type="button"
                        onClick={() => incrementCreditInput(row.id)}
                        className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-red-700 font-semibold">{row.absentLectures}</td>
                  <td className={`px-4 py-3 font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{row.percentage}%</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => submitRowAttendanceCredit(row.id)}
                      disabled={isSubmittingRow}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white disabled:opacity-60 flex items-center justify-center"
                    >
                      {isSubmittingRow ? <ButtonSpinner size={4} /> : 'Add'}
                    </button>
                  </td>
                </tr>
                );
              })}
              {!filteredSummaryRows.length && !effectiveLoading && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">No students match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Class Wise Data</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Attendance Sessions</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {records.map((record) => (
                <div key={record._id} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800">{record.subject?.name || 'Subject'}{record.subject?.code ? ` (${record.subject.code})` : ''}</p>
                      <p className="text-xs text-slate-500">{formatDate(record.date)} • {record.sessionType || 'Lecture'} • {record.startTime || '--'} - {record.endTime || '--'}</p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{record.classroom?.name || 'Class'}</span>
                  </div>
                </div>
              ))}
              {!records.length && !effectiveLoading && <p className="text-sm text-slate-500">No attendance sheets found for the selected filters.</p>}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-2">Scope</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Class Wise</p>
                <p className="text-sm text-violet-900 mt-1">All rows are filtered to {classLabel} and {subjectLabel}.</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Theory / Practical Split</p>
                <p className="text-sm text-slate-700 mt-1">Use the separate sidebar sections to switch between theory and practical subjects.</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Spreadsheet View</p>
                <p className="text-sm text-emerald-900 mt-1">Each student row shows total lectures, attended lectures, missed lectures, and percentage.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
