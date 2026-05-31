import { useEffect, useMemo, useRef, useState } from 'react';
import { get } from '../../services/apiClient';

const EMPTY_FILTERS = {
  branch: '',
  classroom: '',
  subjectId: '',
  teacherId: '',
  sessionType: '',
  from: '',
  to: ''
};

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatTimeSlot = (row) => {
  if (row.startTime && row.endTime && typeof row.startTime === 'string' && typeof row.endTime === 'string' && row.startTime.includes(':') && row.endTime.includes(':')) {
    return `${row.startTime} - ${row.endTime}`;
  }
  if (row.startTime || row.endTime) {
    return `${formatTime(row.startTime)} - ${formatTime(row.endTime)}`;
  }
  return row.lectureSession?.startDateTime || row.lectureSession?.endDateTime
    ? `${formatTime(row.lectureSession?.startDateTime)} - ${formatTime(row.lectureSession?.endDateTime)}`
    : '--';
};

const downloadCsv = (rows) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'detailed-attendance.csv';
  link.click();
  window.URL.revokeObjectURL(url);
};

export default function DetailedAttendance() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [rows, setRows] = useState([]);
  const [summaryRows, setSummaryRows] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [filterOptions, setFilterOptions] = useState({ branches: [], classes: [], subjects: [], teachers: [], sessionTypes: [] });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', String(limit));

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    return params.toString();
  }, [filters, page, limit]);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await get(`/api/admin/reports?${queryString}`);
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setSummaryRows(Array.isArray(data?.summaryRows) ? data.summaryRows : []);
      setSheets(Array.isArray(data?.sheets) ? data.sheets : []);
      setFilterOptions(data?.filterOptions || { branches: [], classes: [], subjects: [], teachers: [], sessionTypes: [] });
      setPagination(data?.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err?.message || 'Failed to load detailed attendance');
      setRows([]);
      setSummaryRows([]);
      setSheets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const updateFilter = (key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setPage(1);
    setFilters(EMPTY_FILTERS);
  };

  const exportableRows = useMemo(() => rows.map((row) => ({
    Date: formatDate(row.date),
    'Time Slot': formatTimeSlot(row),
    Class: `${row.classroomName}${row.classroomYear ? ` (${row.classroomYear})` : ''}`,
    Subject: row.subjectName,
    Teacher: row.teacherName,
    Student: row.studentName,
    'Roll No': row.rollNo || '--',
    Division: row.division || '--',
    Status: row.status,
    Source: row.attendanceSource || 'manual'
  })), [rows]);

  return (
    <div className="ml-64 space-y-6 max-w-[calc(100vw-320px)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Detailed Attendance</h1>
          <p className="text-lg text-slate-600 mt-2">Department-wide class, date, subject, and teacher wise attendance sheet</p>
        </div>
        <div className="text-sm text-slate-500">
          Showing {rows.length} rows on page {pagination.page} of {pagination.totalPages}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-sky-100">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Filters</h3>
          <button type="button" onClick={resetFilters} className="text-sm font-medium text-sky-600 hover:text-sky-700">
            Reset filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <FilterSelect label="Branch" value={filters.branch} onChange={(value) => updateFilter('branch', value)} options={filterOptions.branches || []} placeholder="All branches" />
          <FilterSelect label="Class" value={filters.classroom} onChange={(value) => updateFilter('classroom', value)} options={(filterOptions.classes || []).map((item) => ({ value: item._id, label: `${item.name}${item.year ? ` (${item.year})` : ''}` }))} placeholder="All classes" />
          <FilterSelect label="Subject" value={filters.subjectId} onChange={(value) => updateFilter('subjectId', value)} options={(filterOptions.subjects || []).map((item) => ({ value: item._id, label: `${item.name}${item.code ? ` • ${item.code}` : ''}` }))} placeholder="All subjects" />
          <FilterSelect label="Teacher" value={filters.teacherId} onChange={(value) => updateFilter('teacherId', value)} options={(filterOptions.teachers || []).map((item) => ({ value: item._id, label: `${item.name}${item.branch ? ` • ${item.branch}` : ''}` }))} placeholder="All teachers" />
          <FilterSelect label="Session Type" value={filters.sessionType} onChange={(value) => updateFilter('sessionType', value)} options={(filterOptions.sessionTypes || []).map((item) => ({ value: item, label: item }))} placeholder="All session types" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
              <input type="date" value={filters.from} onChange={(event) => updateFilter('from', event.target.value)} className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/70 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
              <input type="date" value={filters.to} onChange={(event) => updateFilter('to', event.target.value)} className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/70 text-sm" />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-5">
          <button type="button" onClick={() => downloadCsv(exportableRows)} className="px-6 py-2 bg-linear-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm">
            Export sheet
          </button>
          <button type="button" onClick={loadReports} className="px-6 py-2 bg-white/70 text-slate-700 rounded-xl font-medium border border-sky-100 hover:bg-white/90 transition-all text-sm">
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryTile label="Attendance Sheets" value={sheets.length} />
        <SummaryTile label="Detailed Rows" value={pagination.total} />
        <SummaryTile label="Students in Summary" value={summaryRows.length} />
      </div>

      {/* Student Summary */}
      <div className="bg-white/60 backdrop-blur rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sky-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Student Summary</h3>
            <p className="text-sm text-slate-500">Aggregated present, absent, and attendance percentage by student</p>
          </div>
          <div className="text-sm text-slate-500">{loading ? 'Loading...' : `${summaryRows.length} students total`}</div>
        </div>
        <SyncedTableFrame minWidthClass="min-w-300" maxHeightClass="max-h-128">
          <thead className="sticky top-0 z-10 bg-linear-to-r from-sky-50 to-blue-50 border-b border-sky-100">
            <tr>
              <HeaderCell>Student</HeaderCell>
              <HeaderCell>Roll No</HeaderCell>
              <HeaderCell>Class</HeaderCell>
              <HeaderCell>Division</HeaderCell>
              {filterOptions.subjects?.map((sub) => (
                <HeaderCell key={sub._id}>
                  <div className="font-semibold text-slate-800">{sub.name}</div>
                  <div className="text-[10px] text-slate-500 font-normal normal-case">{sub.code || 'No code'}</div>
                </HeaderCell>
              ))}
              <HeaderCell>Present</HeaderCell>
              <HeaderCell>Absent</HeaderCell>
              <HeaderCell>Overall %</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-100">
            {loading ? (
              <tr>
                <td colSpan={7 + (filterOptions.subjects?.length || 0)} className="px-6 py-10 text-center text-slate-500">Loading summary...</td>
              </tr>
            ) : summaryRows.length ? summaryRows.map((row) => (
              <tr key={row.studentId} className="hover:bg-sky-50/60 transition-colors">
                <TableCell className="font-medium text-slate-800">{row.studentName}</TableCell>
                <TableCell>{row.rollNo}</TableCell>
                <TableCell>{row.className}</TableCell>
                <TableCell>{row.division}</TableCell>
                {/* Subject attendance columns */}
                {filterOptions.subjects?.map((sub) => {
                  const percentage = row.subjectAttendance?.[sub._id];
                  return (
                    <TableCell key={sub._id}>
                      {percentage !== undefined ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          percentage >= 75
                            ? 'bg-emerald-100 text-emerald-700'
                            : percentage >= 50
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {percentage}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">--</span>
                      )}
                    </TableCell>
                  );
                })}
                <TableCell className="text-emerald-700 font-medium">{row.presentDays}</TableCell>
                <TableCell className="text-rose-700 font-medium">{row.absentDays}</TableCell>
                <TableCell>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                    row.attendancePercentage >= 75
                      ? 'bg-emerald-100 text-emerald-800'
                      : row.attendancePercentage >= 50
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {row.attendancePercentage}%
                  </span>
                </TableCell>
              </tr>
            )) : (
              <tr>
                <td colSpan={7 + (filterOptions.subjects?.length || 0)} className="px-6 py-10 text-center text-slate-500">No summary available for the selected filters.</td>
              </tr>
            )}
          </tbody>
        </SyncedTableFrame>
      </div>

      <div className="bg-white/60 backdrop-blur rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sky-100">
          <h3 className="text-lg font-semibold text-slate-800">Attendance Sheets</h3>
          <p className="text-sm text-slate-500">Class-wise session list across all subjects</p>
        </div>
        <SyncedTableFrame minWidthClass="min-w-250" maxHeightClass="max-h-128">
          <thead className="sticky top-0 z-10 bg-linear-to-r from-sky-50 to-blue-50 border-b border-sky-100">
            <tr>
              <HeaderCell>Date</HeaderCell>
              <HeaderCell>Class</HeaderCell>
              <HeaderCell>Subject</HeaderCell>
              <HeaderCell>Teacher</HeaderCell>
              <HeaderCell>Session</HeaderCell>
              <HeaderCell>Present</HeaderCell>
              <HeaderCell>Absent</HeaderCell>
              <HeaderCell>Total</HeaderCell>
            </tr>
          </thead>
          <tbody className="divide-y divide-sky-100">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-slate-500">Loading attendance sheets...</td>
              </tr>
            ) : sheets.length ? sheets.map((sheet) => (
              <tr key={sheet.id} className="hover:bg-sky-50/60 transition-colors">
                <TableCell>{formatDate(sheet.date)}</TableCell>
                <TableCell>{sheet.classroom?.name || '--'}{sheet.classroom?.year ? ` (${sheet.classroom.year})` : ''}</TableCell>
                <TableCell>{sheet.subject?.name || '--'}</TableCell>
                <TableCell>{sheet.teacher?.name || '--'}</TableCell>
                <TableCell>{formatTimeSlot(sheet)}</TableCell>
                <TableCell className="text-emerald-700 font-medium">{sheet.presentCount}</TableCell>
                <TableCell className="text-rose-700 font-medium">{sheet.absentCount}</TableCell>
                <TableCell className="font-medium text-slate-700">{sheet.totalStudents}</TableCell>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="px-6 py-10 text-center text-slate-500">No sheets found for the selected filters.</td>
              </tr>
            )}
          </tbody>
        </SyncedTableFrame>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/70 text-sm">
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white/60 backdrop-blur px-5 py-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function SyncedTableFrame({ children, minWidthClass, maxHeightClass }) {
  const topScrollRef = useRef(null);
  const bodyScrollRef = useRef(null);

  const syncTopToBody = () => {
    if (topScrollRef.current && bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const syncBodyToTop = () => {
    if (topScrollRef.current && bodyScrollRef.current) {
      topScrollRef.current.scrollLeft = bodyScrollRef.current.scrollLeft;
    }
  };

  return (
    <div className="space-y-2">
      <div ref={topScrollRef} onScroll={syncTopToBody} className="overflow-x-auto overflow-y-hidden rounded-t-xl border border-sky-100 bg-white/70 h-4">
        <div className={`h-px ${minWidthClass}`} />
      </div>
      <div ref={bodyScrollRef} onScroll={syncBodyToTop} className={`${maxHeightClass} overflow-auto`}>
        <table className={`w-full ${minWidthClass}`}>
          {children}
        </table>
      </div>
    </div>
  );
}

function HeaderCell({ children }) {
  return <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 whitespace-nowrap">{children}</th>;
}

function TableCell({ children, className = '' }) {
  return <td className={`px-6 py-4 text-sm text-slate-700 whitespace-nowrap ${className}`}>{children}</td>;
}
