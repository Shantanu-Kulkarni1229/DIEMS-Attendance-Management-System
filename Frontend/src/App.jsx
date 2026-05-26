import Login from './Auth/Login'
import Admin from './Admin/Admin'
import TeacherDetailsPage from './Admin/TeacherDetailsPage'
import StudentDetailsPage from './Admin/StudentDetailsPage'
import TeacherDashboard from './Teacher/Dashboard'
import StudentDashboard from './Student/Dashboard'
import SuperAdminDashboard from './SuperAdmin/Dashboard'

const App = () => {
  const path = (typeof window !== 'undefined' && window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '/';

  if (path.startsWith('/admin/teachers/')) return <TeacherDetailsPage />
  if (path.startsWith('/admin/students/')) return <StudentDetailsPage />
  if (path.startsWith('/admin')) return <Admin />
  if (path.startsWith('/teacher')) return <TeacherDashboard />
  if (path.startsWith('/student')) return <StudentDashboard />
  if (path.startsWith('/superadmin')) return <SuperAdminDashboard />

  return <Login />
}

export default App