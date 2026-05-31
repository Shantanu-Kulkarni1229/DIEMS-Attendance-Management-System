import { useEffect, useMemo, useState } from 'react';
import { get, patch } from '../../services/apiClient';
import { SkeletonCard, ButtonSpinner } from '../components/Skeletons';

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function LeaveRequests({ onChanged, loading: parentLoading = false, theme = 'light' }) {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');

  const loadLeaveRequests = async () => {
    setLoading(true);
    try {
      const data = await get('/api/teacher/leave-requests');
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      setLeaveRequests([]);
      setMessage(error.message || 'Failed to load leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const counts = useMemo(() => {
    const pending = leaveRequests.filter((leave) => leave.status === 'Pending').length;
    const approved = leaveRequests.filter((leave) => leave.status === 'Approved').length;
    const rejected = leaveRequests.filter((leave) => leave.status === 'Rejected').length;
    return { pending, approved, rejected, total: leaveRequests.length };
  }, [leaveRequests]);

  const handleReview = async (leaveId, status) => {
    setMessage('');
    setActionLoadingId(`${leaveId}:${status}`);
    try {
      await patch(`/api/teacher/leave-requests/${leaveId}`, { status });
      await loadLeaveRequests();
      if (typeof onChanged === 'function') {
        await onChanged();
      }
      setMessage(status === 'Approved'
        ? 'Leave approved and attendance updated for the matching lecture slots.'
        : 'Leave request rejected.');
    } catch (error) {
      const payload = error && error.payload ? error.payload : null;
      const backendMessage = payload && (payload.message || (Array.isArray(payload.errors) ? payload.errors.join('; ') : null));
      setMessage(backendMessage || error.message || 'Failed to update leave request.');
    } finally {
      setActionLoadingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800">Leave Requests</h1>
        <p className="text-sm text-slate-500">Student leave requests from your assigned classrooms. Approving a request marks attendance for the matching lecture sessions.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl p-4 shadow-sm`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</p>
          <p className="mt-2 text-2xl font-bold">{counts.total}</p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl p-4 shadow-sm`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
          <p className="mt-2 text-2xl font-bold text-orange-600">{counts.pending}</p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl p-4 shadow-sm`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{counts.approved}</p>
        </div>
        <div className={`${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'} rounded-2xl p-4 shadow-sm`}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rejected</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{counts.rejected}</p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-700">
          {message}
        </div>
      )}

      <div className={`rounded-2xl border overflow-hidden shadow-sm ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`}>
        { (parentLoading || loading) ? (
          <div className="p-6 grid grid-cols-1 gap-4">
            {[0,1,2].map(i => <SkeletonCard key={i} className="h-20" />)}
          </div>
        ) : leaveRequests.length ? (
          <div className="divide-y divide-slate-100">
            {leaveRequests.map((leave) => (
              <div key={leave._id} className="p-5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-slate-800">{leave.student?.name || 'Student'}</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{leave.student?.rollNo || leave.student?.prn || 'No roll'}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${leave.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : leave.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                      {leave.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{leave.classroom?.name || 'Classroom'} {leave.classroom?.year ? `(${leave.classroom.year})` : ''}</p>
                  <p className="text-sm text-slate-600">{formatDate(leave.fromDate)} to {formatDate(leave.toDate)} • {leave.duration || 'Full Day'} • {leave.leaveType || 'Leave'}</p>
                  {leave.reason && <p className="text-sm text-slate-500">Reason: {leave.reason}</p>}
                  <p className="text-xs text-slate-400">Requested on {formatDate(leave.createdAt)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={leave.status !== 'Pending' || actionLoadingId === `${leave._id}:Rejected`}
                    onClick={() => handleReview(leave._id, 'Rejected')}
                    className={`${theme === 'dark' ? 'border border-red-600 text-red-300 hover:bg-red-700/30' : 'border border-red-200 text-red-700 hover:bg-red-50'} px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                  >
                    {actionLoadingId === `${leave._id}:Rejected` ? <ButtonSpinner size={4} /> : 'Reject'}
                  </button>
                  <button
                    type="button"
                    disabled={leave.status !== 'Pending' || actionLoadingId === `${leave._id}:Approved`}
                    onClick={() => handleReview(leave._id, 'Approved')}
                    className={`${theme === 'dark' ? 'border border-emerald-600 text-emerald-300 hover:bg-emerald-700/30' : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'} px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
                  >
                    {actionLoadingId === `${leave._id}:Approved` ? <ButtonSpinner size={4} /> : 'Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-sm text-slate-500">No leave requests found.</div>
        )}
      </div>
    </div>
  );
}
