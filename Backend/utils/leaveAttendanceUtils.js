const { MANUAL_SLOTS } = require('./attendanceUtils');

const normalizeLeaveDuration = (value) => {
  if (Array.isArray(value)) {
    const normalizedSlots = value.flatMap((entry) => normalizeLeaveDuration(entry));
    if (!normalizedSlots.length) return [];
    if (normalizedSlots.includes('Full Day')) return ['Full Day'];
    return [...new Set(normalizedSlots)];
  }

  const normalized = String(value || '').trim();
  if (!normalized) return [];

  const lowered = normalized.toLowerCase();
  if (lowered === 'full day') return ['Full Day'];

  const lectureSlots = MANUAL_SLOTS.Lecture || [];
  const matchingSlot = lectureSlots.find((slot) => {
    const label = String(slot.label || '').toLowerCase();
    return slot.startTime === normalized || label === lowered || `${slot.startTime} - ${slot.endTime}`.toLowerCase() === lowered;
  });

  return matchingSlot ? [matchingSlot.startTime] : [];
};

const getCoveredSlotKeys = (sessionType, duration) => {
  const normalizedDuration = normalizeLeaveDuration(duration);
  const slots = MANUAL_SLOTS[sessionType] || [];
  if (Array.isArray(normalizedDuration) && normalizedDuration.includes('Full Day')) {
    return new Set(slots.map((slot) => `${slot.startTime}-${slot.endTime}`));
  }

  if (!Array.isArray(normalizedDuration) || !normalizedDuration.length) return new Set();

  const coveredSlots = slots.filter((slot) => normalizedDuration.includes(slot.startTime));

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
