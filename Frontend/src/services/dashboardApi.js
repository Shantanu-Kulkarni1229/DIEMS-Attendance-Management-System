const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Get stored auth token from sessionStorage
const getAuthToken = () => {
  const auth = sessionStorage.getItem('diems-auth-user');
  return auth ? JSON.parse(auth).token : null;
};

const getHeaders = () => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// ADMIN APIs
export const createAdmin = async ({ name, email, password, branch }) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/create-admin`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password, branch }),
  });
  if (!response.ok) throw new Error('Failed to create admin');
  return response.json();
};

export const createTeacher = async ({ name, email, password, subjects, classrooms }) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/create-teacher`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password, subjects, classrooms }),
  });
  if (!response.ok) throw new Error('Failed to create teacher');
  return response.json();
};

export const createStudent = async ({ name, email, password, classroom }) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/create-student`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password, classroom }),
  });
  if (!response.ok) throw new Error('Failed to create student');
  return response.json();
};

export const getTeachers = async () => {
  const response = await fetch(`${API_BASE_URL}/api/admin/teachers`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch teachers');
  return response.json();
};

export const getStudents = async () => {
  const response = await fetch(`${API_BASE_URL}/api/admin/students`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch students');
  return response.json();
};

export const getClassrooms = async () => {
  const response = await fetch(`${API_BASE_URL}/api/admin/classrooms`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch classrooms');
  return response.json();
};

export const getSubjects = async () => {
  const response = await fetch(`${API_BASE_URL}/api/admin/subjects`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch subjects');
  return response.json();
};

// TEACHER APIs
export const markAttendance = async ({ classroomId, subjectId, date, studentStatuses }) => {
  const response = await fetch(`${API_BASE_URL}/api/teacher/mark-attendance`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ classroomId, subjectId, date, studentStatuses }),
  });
  if (!response.ok) throw new Error('Failed to mark attendance');
  return response.json();
};

export const updateAttendance = async (attendanceId, { date, classroomId, subjectId, studentStatuses }) => {
  const response = await fetch(`${API_BASE_URL}/api/teacher/update-attendance/${attendanceId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ date, classroomId, subjectId, studentStatuses }),
  });
  if (!response.ok) throw new Error('Failed to update attendance');
  return response.json();
};

export const getTeacherAttendanceRecords = async () => {
  const response = await fetch(`${API_BASE_URL}/api/teacher/attendance-records`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch attendance records');
  return response.json();
};

// STUDENT APIs
export const getStudentAttendance = async () => {
  const response = await fetch(`${API_BASE_URL}/api/student/attendance`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch attendance');
  return response.json();
};

export const getAttendanceStats = async () => {
  const response = await fetch(`${API_BASE_URL}/api/student/attendance-stats`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch attendance stats');
  return response.json();
};
