import Login from './Auth/Login'
import Admin from './Admin/Admin'
import TeacherDetailsPage from './Admin/TeacherDetailsPage'
import StudentDetailsPage from './Admin/StudentDetailsPage'
import TeacherDashboard from './Teacher/Dashboard'
import StudentDashboard from './Student/Dashboard'
import SuperAdminDashboard from './SuperAdmin/Dashboard'

const App = () => {
  const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '/';
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();
  const role = String(storedUser?.role || '').toLowerCase();

  if (path.startsWith('/admin') && role && role !== 'admin' && role !== 'superadmin') {
    window.location.replace(role === 'teacher' ? '/teacher' : role === 'student' ? '/student' : '/');
    return null;
  }
  if (path.startsWith('/teacher') && role && role !== 'teacher') {
    window.location.replace(role === 'admin' ? '/admin' : role === 'superadmin' ? '/superadmin' : '/');
    return null;
  }
  if (path.startsWith('/student') && role && role !== 'student') {
    window.location.replace(role === 'admin' ? '/admin' : role === 'superadmin' ? '/superadmin' : '/');
    return null;
  }

  if (path.startsWith('/admin/teachers/')) return <TeacherDetailsPage />
  if (path.startsWith('/admin/students/')) return <StudentDetailsPage />
  if (path.startsWith('/admin')) return <Admin />
  if (path.startsWith('/teacher')) return <TeacherDashboard />
  if (path.startsWith('/student')) return <StudentDashboard />
  if (path.startsWith('/superadmin')) return <SuperAdminDashboard />

  return <Login />
}

export default App