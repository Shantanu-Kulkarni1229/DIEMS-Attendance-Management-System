const { MANUAL_SLOTS } = require('./attendanceUtils');

const normalizeLeaveDuration = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'full day') return 'Full Day';
  if (normalized === '1st half' || normalized === 'first half' || normalized === 'morning half') return '1st Half';
  if (normalized === '2nd half' || normalized === 'second half' || normalized === 'afternoon half') return '2nd Half';
  return 'Full Day';
};

const getCoveredSlotKeys = (sessionType, duration) => {
  const normalizedDuration = normalizeLeaveDuration(duration);
  const slots = MANUAL_SLOTS[sessionType] || [];
  if (normalizedDuration === 'Full Day') {
    return new Set(slots.map((slot) => `${slot.startTime}-${slot.endTime}`));
  }

  const midpoint = Math.ceil(slots.length / 2);
  const coveredSlots = normalizedDuration === '1st Half'
    ? slots.slice(0, midpoint)
    : slots.slice(midpoint);

  return new Set(coveredSlots.map((slot) => `${slot.startTime}-${slot.endTime}`));
};

const doesLeaveCoverAttendance = ({ duration, sessionType, startTime, endTime }) => {
  if (!sessionType || !startTime || !endTime) return false;
  const coveredSlotKeys = getCoveredSlotKeys(sessionType, duration);
  return coveredSlotKeys.has(`${startTime}-${endTime}`);
};

const toDateRange = (fromDate, toDate) => {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const applyLeaveToAttendanceRecords = (records = [], leave) => {
  const leaveStudentId = leave?.student?.toString?.() || String(leave?.student || '');
  return records.map((record) => {
    if (!record || record.student?.toString?.() !== leaveStudentId) return record;
    return {
      ...record,
      status: 'absent',
      leaveId: leave._id,
      attendanceSource: 'leave'
    };
  });
};

module.exports = {
  normalizeLeaveDuration,
  getCoveredSlotKeys,
  doesLeaveCoverAttendance,
  toDateRange,
  applyLeaveToAttendanceRecords
};
