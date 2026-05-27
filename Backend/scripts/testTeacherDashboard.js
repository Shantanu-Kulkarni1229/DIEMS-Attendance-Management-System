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
  const teacher = await login('ui.teacher@diems.test', 'diems@123');
  const dashboard = await getJson('/teacher/dashboard', teacher.token);
  const assignedClassrooms = Array.isArray(dashboard.assignedClassrooms) ? dashboard.assignedClassrooms : [];
  const assignedSubjects = Array.isArray(dashboard.assignedSubjects) ? dashboard.assignedSubjects : [];
  const firstClass = assignedClassrooms[0] || null;
  const students = firstClass ? await getJson(`/teacher/classrooms/${firstClass._id}/students`, teacher.token) : [];

  console.log(JSON.stringify({
    assignedClassrooms: assignedClassrooms.length,
    assignedSubjects: assignedSubjects.length,
    studentsByClassroomKeys: dashboard.studentsByClassroom ? Object.keys(dashboard.studentsByClassroom).length : 0,
    firstClass: firstClass ? firstClass.name : null,
    firstClassStudents: students.length
  }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});