exports.calculateStudentAttendance = (studentId, attendanceRecords, attendanceCredits = []) => {
  const subjectMap = {}; // subjectId -> {present, total}
  let totalPresent = 0;
  let totalSessions = 0;
  attendanceRecords.forEach((rec) => {
    if (!rec || !rec.subject || !rec.subject._id) return;
    const subjectId = rec.subject._id.toString();
    const subjectName = rec.subject.name || 'Unknown';
    if (!subjectMap[subjectId]) subjectMap[subjectId] = { subject: subjectName, present: 0, total: 0 };
    // compute session duration (hours)
    let durationHours = 1;
    try {
      if (rec.lectureSession && rec.lectureSession.startDateTime && rec.lectureSession.endDateTime) {
        const sd = new Date(rec.lectureSession.startDateTime);
        const ed = new Date(rec.lectureSession.endDateTime);
        durationHours = Math.max(1, Math.round((ed - sd) / 3600000));
      } else if (rec.date && rec.startTime && rec.endTime) {
        const day = new Date(rec.date);
        const [sh, sm] = (rec.startTime || '').split(':').map(Number);
        const [eh, em] = (rec.endTime || '').split(':').map(Number);
        const sd = new Date(day); sd.setHours(sh || 0, sm || 0, 0, 0);
        const ed = new Date(day); ed.setHours(eh || 0, em || 0, 0, 0);
        durationHours = Math.max(1, Math.round((ed - sd) / 3600000));
      }
    } catch (err) {
      durationHours = 1;
    }

    const isPractical = (rec.subject && (rec.subject.category || '').toLowerCase() === 'practical');
    const weight = isPractical ? Math.round(durationHours / 2) : Math.round(durationHours);

    const studentEntry = Array.isArray(rec.records)
      ? rec.records.find((r) => r && r.student && r.student.toString() === studentId.toString())
      : null;
    if (studentEntry) {
      subjectMap[subjectId].total += weight;
      totalSessions += weight;
      if (studentEntry.status === 'present') {
        subjectMap[subjectId].present += weight;
        totalPresent += weight;
      }
    }
  });

  attendanceCredits.forEach((credit) => {
    if (!credit || !credit.subject || !credit.subject._id) return;
    const subjectId = credit.subject._id.toString();
    const subjectName = credit.subject.name || 'Unknown';
    if (!subjectMap[subjectId]) subjectMap[subjectId] = { subject: subjectName, present: 0, total: 0 };

    const lectures = Number(credit.lectures || 0);
    if (!Number.isFinite(lectures) || lectures <= 0) return;

    subjectMap[subjectId].present += lectures;
    totalPresent += lectures;
  });
  const subjects = Object.keys(subjectMap).map((k) => {
    const s = subjectMap[k];
    return { subject: s.subject, present: s.present, total: s.total, percentage: s.total ? Math.round((s.present / s.total) * 10000) / 100 : 0 };
  });
  const overall = { present: totalPresent, total: totalSessions, percentage: totalSessions ? Math.round((totalPresent / totalSessions) * 10000) / 100 : 0 };
  return { subjects, overall };
};

const MANUAL_SLOTS = {
  Lecture: [
    { startTime: '10:15', endTime: '11:15', label: '10:15 AM - 11:15 AM' },
    { startTime: '11:15', endTime: '12:15', label: '11:15 AM - 12:15 PM' },
    { startTime: '13:15', endTime: '14:15', label: '1:15 PM - 2:15 PM' },
    { startTime: '14:15', endTime: '15:15', label: '2:15 PM - 3:15 PM' },
    { startTime: '15:30', endTime: '16:30', label: '3:30 PM - 4:30 PM' },
    { startTime: '16:30', endTime: '17:30', label: '4:30 PM - 5:30 PM' }
  ],
  Practical: [
    { startTime: '10:15', endTime: '12:15', label: '10:15 AM - 12:15 PM' },
    { startTime: '13:15', endTime: '15:15', label: '1:15 PM - 3:15 PM' },
    { startTime: '15:30', endTime: '17:30', label: '3:30 PM - 5:30 PM' }
  ]
};

const normalizeSessionType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'lecture') return 'Lecture';
  if (normalized === 'practical' || normalized === 'lab') return 'Practical';
  return null;
};

const getManualSlot = (sessionType, startTime, endTime) => {
  // Keep for compatibility: exact match if present
  const normalizedType = normalizeSessionType(sessionType);
  if (!normalizedType || !startTime || !endTime) return null;
  const slots = MANUAL_SLOTS[normalizedType] || [];
  return slots.find((slot) => slot.startTime === startTime && slot.endTime === endTime) || null;
};

const validateManualAttendanceSlot = ({ sessionType, startTime, endTime }) => {
  const normalizedType = normalizeSessionType(sessionType);
  if (!normalizedType) return { valid: false, message: 'Session type must be Lecture or Practical' };

  if (!startTime || !endTime) return { valid: false, message: 'Start time and end time are required' };

  // allowed start times for this session type
  const allowedStarts = (MANUAL_SLOTS[normalizedType] || []).map((s) => s.startTime);
  if (!allowedStarts.includes(startTime)) {
    return { valid: false, message: `${normalizedType} start time must be one of: ${allowedStarts.join(', ')}` };
  }

  // parse times on arbitrary same day
  try {
    const [sh, sm] = String(startTime).split(':').map(Number);
    const [eh, em] = String(endTime).split(':').map(Number);
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) {
      return { valid: false, message: 'Invalid start or end time format' };
    }
    const sd = new Date(); sd.setHours(sh, sm, 0, 0);
    const ed = new Date(); ed.setHours(eh, em, 0, 0);
    const durationMinutes = Math.round((ed - sd) / 60000);
    if (durationMinutes <= 0) return { valid: false, message: 'End time must be after start time' };

    if (normalizedType === 'Lecture') {
      if (durationMinutes % 60 !== 0) return { valid: false, message: 'Lecture duration must be in whole hours (60 min multiples)' };
      const hours = durationMinutes / 60;
      if (hours < 1) return { valid: false, message: 'Lecture duration must be at least 1 hour' };
    } else if (normalizedType === 'Practical') {
      if (durationMinutes % 120 !== 0) return { valid: false, message: 'Practical duration must be in 2-hour blocks (120 min multiples)' };
      const hours = durationMinutes / 60;
      if (hours < 2) return { valid: false, message: 'Practical duration must be at least 2 hours' };
    }

    return { valid: true, sessionType: normalizedType, slot: { startTime, endTime, durationMinutes } };
  } catch (err) {
    return { valid: false, message: 'Invalid time values' };
  }
};

exports.MANUAL_SLOTS = MANUAL_SLOTS;
exports.normalizeSessionType = normalizeSessionType;
exports.getManualSlot = getManualSlot;
exports.validateManualAttendanceSlot = validateManualAttendanceSlot;

const DEFAULT_BATCH_SIZE = 20;

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

const normalizeBatchSize = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) return DEFAULT_BATCH_SIZE;
  return parsed;
};

const buildPracticalBatches = (students = [], classroomName = '', batchSize = DEFAULT_BATCH_SIZE) => {
  const size = normalizeBatchSize(batchSize);
  const sortedStudents = [...students].sort((left, right) => compareRollNumbers(left.rollNo || left.roll, right.rollNo || right.roll));
  const prefix = getBatchPrefix(classroomName);
  const batches = [];

  sortedStudents.forEach((student, index) => {
    const batchIndex = Math.floor(index / size);
    if (!batches[batchIndex]) {
      batches[batchIndex] = {
        batchId: `${prefix}-${batchIndex + 1}`,
        label: `${prefix}-${batchIndex + 1}`,
        startRoll: student.rollNo || student.roll || '',
        endRoll: student.rollNo || student.roll || '',
        studentIds: [],
        studentCount: 0
      };
    }

    batches[batchIndex].studentIds.push(student._id.toString());
    batches[batchIndex].studentCount += 1;
    batches[batchIndex].endRoll = student.rollNo || student.roll || batches[batchIndex].endRoll;
  });

  return batches.filter(Boolean);
};

exports.buildPracticalBatches = buildPracticalBatches;
exports.normalizeBatchSize = normalizeBatchSize;
