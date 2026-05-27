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
