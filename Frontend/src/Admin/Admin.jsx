import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Overview from './Overview/Dashboard';
import CreateTeacher from './CreateTeacher/index';
import CreateStudent from './CreateStudent/index';
import DetailedAttendance from './Reports/index';

export default function Admin() {
  const [currentPage, setCurrentPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview />;
      case 'detailed-attendance':
        return <DetailedAttendance />;
      case 'create-teacher':
        return <CreateTeacher />;
      case 'create-student':
        return <CreateStudent />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-0' : 'ml-0'}`}>
        {/* Navbar */}
        <Navbar setSidebarOpen={setSidebarOpen} sidebarOpen={sidebarOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-white p-8">
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="bg-white/40 backdrop-blur border-t border-sky-100 px-8 py-4 text-center text-sm text-slate-600">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <span>© 2025 DIEMS. All rights reserved.</span>
            <div className="flex items-center gap-2 text-sky-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              <span>Professional ERP Access Portal</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
