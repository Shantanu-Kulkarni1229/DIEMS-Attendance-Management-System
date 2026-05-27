require('dotenv').config();

const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000/api';

async function login(email, password) {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `Login failed for ${email}`);
  return data;
}

async function getJson(path, token) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || `GET ${path} failed`);
  return data;
}

async function main() {
  const admin = await login('ui.admin@diems.test', 'UiTest@123');
  const student = await login('ui.student@diems.test', 'diems@123');

  const students = await getJson('/admin/students', admin.token);
  const classrooms = await getJson('/admin/classrooms', admin.token);
  const tyA = classrooms.find((item) => item.name === 'TY-A') || classrooms.find((item) => /TY/i.test(item.name || '')) || classrooms[0];
  const tyAStudents = tyA && tyA._id ? await getJson(`/teacher/classrooms/${tyA._id}/students`, admin.token) : [];
  const attendance = await getJson('/student/attendance', student.token);
  const lectures = await getJson('/timetable/student/my-lectures', student.token);

  console.log(JSON.stringify({
    students: students.length,
    tyAStudents: tyAStudents.length,
    attendanceKeys: Object.keys(attendance),
    lectureFeed: lectures.length,
    lectureKeys: lectures[0] ? Object.keys(lectures[0]) : []
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});