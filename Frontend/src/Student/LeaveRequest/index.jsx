import { useEffect, useState } from 'react';
import { get, post, uploadLeaveAttachment } from '../../services/apiClient';

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getYesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const durationOptions = [
  { id: 'full-day', label: 'Full Day', value: 'Full Day' },
  { id: 'slot-1015', label: '10:15 AM - 11:15 AM', value: '10:15' },
  { id: 'slot-1115', label: '11:15 AM - 12:15 PM', value: '11:15' },
  { id: 'slot-115', label: '1:15 PM - 2:15 PM', value: '13:15' },
  { id: 'slot-215', label: '2:15 PM - 3:15 PM', value: '14:15' },
  { id: 'slot-330', label: '3:30 PM - 4:30 PM', value: '15:30' },
  { id: 'slot-430', label: '4:30 PM - 5:30 PM', value: '16:30' }
];

const durationLabels = durationOptions.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const statusTone = (status) => {
  if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'Rejected') return 'bg-rose-50 text-rose-700 border-rose-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
};

const statusDot = (status) => {
  if (status === 'Approved') return 'bg-emerald-500';
  if (status === 'Rejected') return 'bg-rose-500';
  return 'bg-amber-500';
};

const slotLabelMap = durationOptions.reduce((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

const formatSelectedDuration = (value) => {
  if (Array.isArray(value)) {
    if (value.includes('Full Day')) return 'Full Day';
    return value.map((slot) => slotLabelMap[slot] || slot).join(', ');
  }
  return slotLabelMap[value] || value || 'Full Day';
};

export default function LeaveRequest() {
  const [form, setForm] = useState({ leaveDate: getYesterday(), duration: [], reason: '', leaveType: '' });
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);

  const maxDate = getYesterday();

  const loadLeaveHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await get('/api/student/leaves');
      setLeaveHistory(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setLeaveHistory([]);
      setError(requestError.message || 'Failed to load leave history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveHistory();
  }, []);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleDuration = (value) => {
    setForm((current) => {
      if (value === 'Full Day') {
        return { ...current, duration: ['Full Day'] };
      }

      const currentSlots = Array.isArray(current.duration) ? current.duration : [];
      const filteredSlots = currentSlots.filter((slot) => slot !== 'Full Day');
      const nextSlots = filteredSlots.includes(value)
        ? filteredSlots.filter((slot) => slot !== value)
        : [...filteredSlots, value];

      return { ...current, duration: nextSlots };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!form.leaveDate) {
      setError('Please choose a leave date.');
      return;
    }

    if (form.leaveDate >= new Date().toISOString().slice(0, 10)) {
      setError('Only past dates are allowed for leave requests.');
      return;
    }

    if (!Array.isArray(form.duration) || form.duration.length === 0) {
      setError('Please select at least one time slot.');
      return;
    }

    if (!form.reason.trim()) {
      setError('Please add a reason for the leave.');
      return;
    }

    setLoading(true);
    try {
      let attachmentMeta = {};

      if (proofFile) {
        setAttachmentUploading(true);
        try {
          const attachment = await uploadLeaveAttachment(proofFile);
          attachmentMeta = {
            attachmentUrl: attachment.url,
            attachmentPublicId: attachment.publicId,
            attachmentName: attachment.originalName,
            attachmentType: attachment.fileType,
            attachmentSize: attachment.fileSize
          };
        } catch (uploadError) {
          throw uploadError;
        }
      }

      await post('/api/student/leaves', {
        leaveDate: form.leaveDate,
        duration: form.duration,
        leaveType: form.leaveType.trim(),
        reason: form.reason.trim(),
        ...attachmentMeta
      });

      setForm({ leaveDate: getYesterday(), duration: [], reason: '', leaveType: '' });
      setProofFile(null);
      setMessage('Leave request submitted successfully. The status will update after teacher review.');
      await loadLeaveHistory();
    } catch (submitError) {
      const payload = submitError && submitError.payload ? submitError.payload : null;
      const backendMessage = payload && (payload.message || (Array.isArray(payload.errors) ? payload.errors.join('; ') : null));
      setError(backendMessage || submitError.message || 'Failed to submit leave request.');
    } finally {
      setAttachmentUploading(false);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-900">Leave Request</h1>
          <p className="text-sm text-slate-500">Past dates only.</p>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-100 bg-slate-50 p-5 md:p-6">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Date</span>
              <input
                type="date"
                value={form.leaveDate}
                max={maxDate}
                onChange={(e) => handleChange('leaveDate', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </label>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Absent time</span>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {durationOptions.map((option) => {
                  const selectedSlots = Array.isArray(form.duration) ? form.duration : [];
                  const active = selectedSlots.includes(option.value);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleDuration(option.value)}
                      className={`rounded-2xl border p-4 text-left transition ${active ? 'border-sky-500 bg-white shadow-sm' : 'border-slate-200 bg-white hover:border-sky-200'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">{option.label}</span>
                        <span className={`h-2.5 w-2.5 rounded-full ${active ? 'bg-sky-500' : 'bg-slate-300'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Reason</span>
              <textarea
                value={form.reason}
                onChange={(e) => handleChange('reason', e.target.value)}
                rows={5}
                placeholder="Explain the reason clearly so the teacher can review it quickly."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Leave note</span>
              <input
                type="text"
                value={form.leaveType}
                onChange={(e) => handleChange('leaveType', e.target.value)}
                placeholder="Note"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Proof</span>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setProofFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>

            {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {message && <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

            <button
              type="submit"
              disabled={loading || attachmentUploading}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Submitting...' : attachmentUploading ? 'Uploading...' : 'Submit'}
            </button>
          </form>

          <div className="rounded-3xl border border-slate-100 bg-white p-5 md:p-6">
            <h2 className="text-base font-semibold text-slate-900">Status</h2>
            <div className="mt-4 space-y-3">
              {historyLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="h-4 w-32 rounded-full bg-slate-200" />
                      <div className="mt-3 h-3 w-48 rounded-full bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : leaveHistory.length ? (
                leaveHistory.map((leave) => (
                  <div key={leave._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{formatDate(leave.fromDate)}</p>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{formatSelectedDuration(leave.duration)}{leave.reason ? ` • ${leave.reason}` : ''}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No requests yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}