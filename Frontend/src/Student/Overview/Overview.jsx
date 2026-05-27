import React, { useEffect, useState } from 'react';
import { get, post, getStudentTodayLectures } from '../../services/apiClient';

const defaultSubjects = [
  { name: 'Machine Learning (ML)', classes: 30, present: 26, absent: 4, percentage: 86.7, status: 'Good' },
  { name: 'Computer Networks (CN)', classes: 28, present: 21, absent: 7, percentage: 75.0, status: 'Good' },
  { name: 'Data Communication (DC)', classes: 28, present: 17, absent: 11, percentage: 60.7, status: 'Average' },
  { name: 'Internet of Things (IOT)', classes: 26, present: 14, absent: 12, percentage: 53.8, status: 'Low' },
  { name: 'Cyber Security (CS)', classes: 24, present: 12, absent: 12, percentage: 50.0, status: 'Low' },
];

const recentLeaves = [
  { initials: 'PR', name: 'Prajakta Rajput', type: 'Sick Leave', date: '17 May 2025', duration: 'Full Day', status: 'Approved', color: 'bg-purple-100 text-purple-700' },
  { initials: 'SK', name: 'Sahil Kale', type: 'Personal Leave', date: '10 May 2025', duration: 'Half Day', status: 'Approved', color: 'bg-orange-100 text-orange-700' },
  { initials: 'AS', name: 'You', type: 'Medical Leave', date: '05 May 2025', duration: 'Full Day', status: 'Pending', color: 'bg-blue-100 text-blue-700' },
];

const getStatusColor = (status) => {
  if (status === 'Good') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (status === 'Average') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

const getStatusTextColor = (status) => {
  if (status === 'Good') return 'text-emerald-600';
  if (status === 'Average') return 'text-yellow-600';
  return 'text-red-600';
};

export default function Overview({ attendanceData, loading, error, profile }) {
  const user = profile || JSON.parse(localStorage.getItem('user') || '{}');
  const overall = attendanceData?.attendance?.overall;
  const apiSubjects = attendanceData?.attendance?.subjects;
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'Sick Leave', fromDate: '', toDate: '', reason: '' });
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [recentLectures, setRecentLectures] = useState([]);
  const [leaveMessage, setLeaveMessage] = useState('');
  const [leaveLoading, setLeaveLoading] = useState(false);

  useEffect(() => {
    const loadLeaves = async () => {
      try {
        const data = await get('/api/student/leaves');
        setLeaveHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        setLeaveHistory([]);
      }
    };
    loadLeaves();
    const loadLectures = async () => {
      try {
        const data = await getStudentTodayLectures();
        setRecentLectures(Array.isArray(data) ? data : []);
      } catch (err) {
        setRecentLectures([]);
      }
    };
    loadLectures();
  }, []);

  const total = overall?.total || 0;
  const present = overall?.present || 0;
  const absent = Math.max(0, total - present);
  const overallPercentage = typeof overall?.percentage === 'number' ? overall.percentage : 0;

  const status = overallPercentage >= 75 ? 'Good' : overallPercentage >= 60 ? 'Average' : 'Low';
  const tableSubjects = Array.isArray(apiSubjects) && apiSubjects.length
    ? apiSubjects.map((s) => ({
      name: s.subject,
      classes: s.total,
      present: s.present,
      absent: Math.max(0, s.total - s.present),
      percentage: s.percentage,
      status: s.percentage >= 75 ? 'Good' : s.percentage >= 60 ? 'Average' : 'Low'
    }))
    : defaultSubjects;

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLeaveMessage('');
    if (!leaveForm.fromDate || !leaveForm.toDate) {
      setLeaveMessage('Please select from and to dates.');
      return;
    }

    setLeaveLoading(true);
    try {
      await post('/api/student/leaves', {
        fromDate: leaveForm.fromDate,
        toDate: leaveForm.toDate,
        duration: leaveForm.leaveType,
        reason: leaveForm.reason
      });
      setLeaveMessage('Leave request submitted successfully.');
      setLeaveForm({ leaveType: 'Sick Leave', fromDate: '', toDate: '', reason: '' });
      const updated = await get('/api/student/leaves');
      setLeaveHistory(Array.isArray(updated) ? updated : []);
    } catch (err) {
      setLeaveMessage(err.message || 'Failed to submit leave request.');
    } finally {
      setLeaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Welcome back, {user.name || 'Student'} <span className="text-2xl animate-wave origin-bottom-right">👋</span>
        </h1>
        <p className="text-slate-500 mt-1">Here's your attendance overview and academic snapshot.</p>
        {loading && <p className="text-sm text-slate-500 mt-2">Loading attendance data...</p>}
        {!loading && error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Overall Attendance */}
        <div className="bg-white/90 backdrop-blur rounded-2xl p-6 border border-white shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow relative overflow-hidden group">
          <p className="text-sm font-bold text-slate-700 mb-4 absolute top-4 left-6">Overall Attendance</p>
          
          <div className="relative w-32 h-32 mt-6 mb-4 group-hover:scale-105 transition-transform">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * (overallPercentage / 100 || 0))} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">{overallPercentage.toFixed(1)}%</span>
            </div>
          </div>
          
          <h4 className={`font-bold ${getStatusTextColor(status)}`}>{status}</h4>
          <p className="text-xs text-slate-500 mt-1">You are maintaining<br/>excellent attendance!</p>
        </div>

        {/* Card 2: Total Classes */}
        <div className="bg-white/90 backdrop-blur rounded-2xl p-6 border border-white shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mb-4 mx-auto md:mx-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <p className="text-sm font-bold text-slate-700 text-center md:text-left">Total Classes</p>
          <div className="mt-2 text-center md:text-left">
            <h3 className="text-3xl font-bold text-slate-800">{total}</h3>
            <p className="text-xs font-medium text-slate-500 mt-0.5">Classes Conducted</p>
          </div>
          
          <div className="mt-6 flex justify-between pt-4 border-t border-slate-100">
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-500 mb-1">Present</p>
              <p className="text-lg font-bold text-slate-800">{present}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-500 mb-1">Absent</p>
              <p className="text-lg font-bold text-red-500">{absent}</p>
            </div>
          </div>
        </div>

        {/* Card 3: Attendance This Month */}
        <div className="bg-white/90 backdrop-blur rounded-2xl p-6 border border-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-bold text-slate-700">Attendance This Month</p>
              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-md text-[10px] font-bold">Average</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-800">72.4%</h3>
          </div>
          
          <div className="h-16 mt-4 relative w-full overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,100 L0,70 Q10,60 20,70 T40,60 T60,80 T80,50 T100,40 L100,100 Z" fill="url(#yellowGradient)" opacity="0.3" />
              <path d="M0,70 Q10,60 20,70 T40,60 T60,80 T80,50 T100,40" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="yellowGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
            4.2% <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg> 
            <span className="text-slate-400 font-medium ml-1">vs last month</span>
          </p>
        </div>

        {/* Card 4: Attendance Status */}
        <div className="bg-white/90 backdrop-blur rounded-2xl p-6 border border-white shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
          <p className="text-sm font-bold text-slate-700 mb-6 absolute top-6 left-6">Attendance Status</p>
          
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 mt-8 shadow-inner shadow-emerald-100">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <h3 className={`text-xl font-bold mb-2 ${getStatusTextColor(status)}`}>{status} Standing</h3>
          <p className="text-xs text-slate-500 px-4 leading-relaxed">
            Keep it up! You are above the required 75%.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Lectures */}
        <div className="lg:col-span-5 bg-white/90 backdrop-blur rounded-2xl p-4 border border-white shadow-sm mb-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3">Recent Lectures</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(recentLectures.length ? recentLectures : []).map((lec) => (
              <div key={lec._id || lec.sessionId} className="p-3 rounded-lg border bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{lec.subject?.name || lec.subject || 'Lecture'}</div>
                  <div className="text-xs text-slate-500">{lec.classroom?.name || lec.class || ''} • {new Date(lec.startDateTime || lec.date || Date.now()).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${lec.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>{(lec.status || '').toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Subject Wise Attendance Table */}
        <div className="lg:col-span-3 bg-white/90 backdrop-blur rounded-2xl p-6 border border-white shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Subject Wise Attendance</h2>
            <button className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">View All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="pb-4 font-semibold w-1/3">Subject</th>
                  <th className="pb-4 font-semibold text-center">Classes</th>
                  <th className="pb-4 font-semibold text-center">Present</th>
                  <th className="pb-4 font-semibold text-center">Absent</th>
                  <th className="pb-4 font-semibold text-center">Percentage</th>
                  <th className="pb-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {tableSubjects.map((sub, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-4 font-semibold text-slate-700">{sub.name}</td>
                    <td className="py-4 text-center text-slate-600">{sub.classes}</td>
                    <td className="py-4 text-center font-semibold text-emerald-600">{sub.present}</td>
                    <td className="py-4 text-center font-semibold text-red-500">{sub.absent}</td>
                    <td className="py-4 text-center font-bold text-slate-800">{sub.percentage.toFixed(1)}%</td>
                    <td className="py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold border ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 flex justify-center">
            <button className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700">
              View Detailed Report <span className="text-lg">›</span>
            </button>
          </div>
        </div>

        {/* Attendance Percentage Guide */}
        <div className="lg:col-span-2 bg-white/90 backdrop-blur rounded-2xl p-6 border border-white shadow-sm flex flex-col justify-between">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Attendance Percentage Guide</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            
            {/* Green */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-12 relative overflow-hidden mb-3">
                <div className="w-20 h-20 border-8 border-emerald-500 rounded-full border-b-transparent border-r-transparent transform -rotate-45 group-hover:scale-105 transition-transform"></div>
                <div className="absolute bottom-0 w-full text-[10px] font-bold text-slate-600">75% and above</div>
              </div>
              <h4 className="text-sm font-bold text-emerald-600 mb-1">Good</h4>
              <p className="text-[10px] text-slate-500 leading-tight">Excellent<br/>Keep it up!</p>
            </div>

            {/* Yellow */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-12 relative overflow-hidden mb-3">
                <div className="w-20 h-20 border-8 border-yellow-400 rounded-full border-b-transparent border-r-transparent transform -rotate-45 group-hover:scale-105 transition-transform"></div>
                <div className="absolute bottom-0 w-full text-[10px] font-bold text-slate-600">60% - 75%</div>
              </div>
              <h4 className="text-sm font-bold text-yellow-600 mb-1">Average</h4>
              <p className="text-[10px] text-slate-500 leading-tight">Need Improvement<br/>Try to be regular</p>
            </div>

            {/* Red */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-20 h-12 relative overflow-hidden mb-3">
                <div className="w-20 h-20 border-8 border-red-500 rounded-full border-b-transparent border-r-transparent transform -rotate-45 group-hover:scale-105 transition-transform"></div>
                <div className="absolute bottom-0 w-full text-[10px] font-bold text-slate-600">Below 60%</div>
              </div>
              <h4 className="text-sm font-bold text-red-600 mb-1">Low</h4>
              <p className="text-[10px] text-slate-500 leading-tight">At Risk<br/>Your attendance is low</p>
            </div>
            
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs font-medium text-blue-800 leading-relaxed">
              Minimum 75% attendance is required to appear for examinations.
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Apply for Leave Form */}
        <div className="bg-white/90 backdrop-blur rounded-2xl p-6 border border-white shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-lg font-bold text-slate-800">Apply for Leave</h2>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View My Leaves</button>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 relative z-10">
            <div className="hidden sm:flex flex-col items-center justify-center bg-blue-50 w-24 rounded-xl border border-blue-100">
              <svg className="w-10 h-10 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <svg className="w-5 h-5 text-blue-600 absolute bottom-12 right-6 bg-blue-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            
            <form className="flex-1 space-y-4" onSubmit={handleLeaveSubmit}>
              {leaveMessage && (
                <div className="text-sm px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                  {leaveMessage}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Leave Type</label>
                  <select value={leaveForm.leaveType} onChange={(e) => setLeaveForm((prev) => ({ ...prev, leaveType: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_0.5rem_center]">
                    <option>Select Leave Type</option>
                    <option>Sick Leave</option>
                    <option>Medical Leave</option>
                    <option>Personal Leave</option>
                    <option>Emergency Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">From Date</label>
                  <input value={leaveForm.fromDate} onChange={(e) => setLeaveForm((prev) => ({ ...prev, fromDate: e.target.value }))} type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">To Date</label>
                  <input value={leaveForm.toDate} onChange={(e) => setLeaveForm((prev) => ({ ...prev, toDate: e.target.value }))} type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Reason</label>
                <textarea value={leaveForm.reason} onChange={(e) => setLeaveForm((prev) => ({ ...prev, reason: e.target.value }))} rows="2" placeholder="Enter reason for leave..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 resize-none"></textarea>
              </div>
              
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={leaveLoading} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold text-sm rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70">
                  {leaveLoading ? 'Submitting...' : 'Submit Leave Request'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Leave Status */}
        <div className="bg-white/90 backdrop-blur rounded-2xl p-6 border border-white shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Recent Leave Status</h2>
            <button className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">View All</button>
          </div>

          <div className="flex-1 space-y-4">
            {(leaveHistory.length ? leaveHistory : recentLeaves).map((leave, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 hover:bg-slate-50/50 p-2 -mx-2 rounded-xl transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${leave.color || 'bg-slate-100 text-slate-700'} shadow-sm`}>
                  {leave.initials || String(leave.student?.name || leave.name || 'A').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{leave.student?.name || leave.name}</h4>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{leave.reason || leave.type}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{leave.createdAt ? new Date(leave.createdAt).toLocaleDateString() : leave.date}</p>
                    <p className="text-[10px] text-slate-400">{leave.duration || leave.status}</p>
                  </div>
                  <span className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-bold border ${
                    String(leave.status).toLowerCase() === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    String(leave.status).toLowerCase() === 'pending' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                    'bg-red-50 text-red-600 border-red-200'
                  }`}>
                    {leave.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="pt-8 pb-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-200/60 mt-8">
        <p>© 2025 DIEMS. All rights reserved.</p>
        <div className="flex items-center gap-1.5 mt-2 md:mt-0">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Professional ERP Access Portal
        </div>
      </footer>

    </div>
  );
}
