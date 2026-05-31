exports.calculateStudentAttendance = (studentId, attendanceRecords) => {
  const subjectMap = {}; // subjectId -> {present, total}
  let totalPresent = 0;
  let totalSessions = 0;
  attendanceRecords.forEach((rec) => {
    if (!rec || !rec.subject || !rec.subject._id) return;
    const subjectId = rec.subject._id.toString();
    const subjectName = rec.subject.name || 'Unknown';
    if (!subjectMap[subjectId]) subjectMap[subjectId] = { subject: subjectName, present: 0, total: 0 };
    const studentEntry = Array.isArray(rec.records)
      ? rec.records.find((r) => r && r.student && r.student.toString() === studentId.toString())
      : null;
    if (studentEntry) {
      subjectMap[subjectId].total += 1;
      totalSessions += 1;
      if (studentEntry.status === 'present') {
        subjectMap[subjectId].present += 1;
        totalPresent += 1;
      }
    }
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
  const normalizedType = normalizeSessionType(sessionType);
  if (!normalizedType || !startTime || !endTime) return null;
  const slots = MANUAL_SLOTS[normalizedType] || [];
  return slots.find((slot) => slot.startTime === startTime && slot.endTime === endTime) || null;
};

const validateManualAttendanceSlot = ({ sessionType, startTime, endTime }) => {
  const normalizedType = normalizeSessionType(sessionType);
  if (!normalizedType) return { valid: false, message: 'Session type must be Lecture or Practical' };

  const allowedSlot = getManualSlot(normalizedType, startTime, endTime);
  if (!allowedSlot) {
    return {
      valid: false,
      message: normalizedType === 'Lecture'
        ? 'Lecture sessions must use one of the 1-hour lecture slots'
        : 'Practical sessions must use one of the 2-hour practical slots'
    };
  }

  return { valid: true, sessionType: normalizedType, slot: allowedSlot };
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
