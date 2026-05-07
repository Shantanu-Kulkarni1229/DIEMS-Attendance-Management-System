import { useEffect, useState } from 'react';
import './App.css';
import LoginPage from './pages/auth/LoginPage/LoginPage';
import Sidebar from './pages/home/components/Sidebar';
import SuperAdminDashboard from './pages/home/SuperAdminDashboard/SuperAdminDashboard';
import AdminDashboard from './pages/home/AdminDashboard/AdminDashboard';
import TeacherDashboard from './pages/home/TeacherDashboard/TeacherDashboard';
import StudentDashboard from './pages/home/StudentDashboard/StudentDashboard';
import { roleMap } from './data/roleProfiles';
import { loginUser } from './services/authApi';

const AUTH_STORAGE_KEY = 'diems-auth-user';

const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const App = () => {
  const [authState, setAuthState] = useState(() => getStoredUser());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    if (!authState) {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  }, [authState]);

  const handleLogin = async (credentials) => {
    setIsSubmitting(true);
    setAuthError('');

    try {
      const response = await loginUser(credentials);
      setAuthState(response);
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setAuthState(null);
    setAuthError('');
  };

  // Component to render role-specific dashboard
  const renderDashboard = (role) => {
    switch (role) {
      case 'SuperAdmin':
        return <SuperAdminDashboard />;
      case 'Admin':
        return <AdminDashboard />;
      case 'Teacher':
        return <TeacherDashboard />;
      case 'Student':
        return <StudentDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  if (authState?.user) {
    const profile = roleMap[authState.user.role] || roleMap.Student;

    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex">
        <Sidebar
          user={authState.user}
          profile={profile}
          onLogout={handleLogout}
          onNavigate={setActiveSection}
          activeSection={activeSection}
        />
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="w-full">
            {renderDashboard(authState.user.role)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <LoginPage
      onSubmit={handleLogin}
      loading={isSubmitting}
      error={authError}
    />
  );
};

export default App;