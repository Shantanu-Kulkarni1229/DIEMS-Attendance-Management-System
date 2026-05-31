import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import StatCard from '../components/StatCard';
import { API_BASE, get } from '../../services/apiClient';

const SOCKET_URL = API_BASE.replace(/\/api\/?$/, '');

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOverview = async () => {
    try {
      setError('');
      const data = await get('/api/admin/overview-stats');
      setOverview(data);
    } catch (err) {
      setError(err?.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();

    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socket.on('admin:dashboard-updated', loadOverview);
    socket.on('leave:new', loadOverview);
    socket.on('leave:updated', loadOverview);

    const timer = window.setInterval(loadOverview, 30000);

    return () => {
      window.clearInterval(timer);
      socket.disconnect();
    };
  }, []);

  const stats = useMemo(() => {
    if (!overview) return [];
    return [
      { title: 'Total Students', value: overview.totalStudents ?? 0, growth: 'Live data', icon: 'students' },
      { title: 'Total Teachers', value: overview.totalTeachers ?? 0, growth: 'Live data', icon: 'teachers' },
      { title: 'Classrooms', value: overview.totalClassrooms ?? 0, growth: 'Live data', icon: 'attendance' },
      { title: 'Subjects', value: overview.totalSubjects ?? 0, growth: 'Live data', icon: 'rate' },
      { title: "Today's Marked", value: overview.todaysAttendanceMarked ?? 0, growth: 'Live data', icon: 'attendance' },
      { title: 'Attendance Rate', value: `${overview.todaysAttendanceRate ?? 0}%`, growth: 'Live data', icon: 'rate' }
    ];
  }, [overview]);

  return (
    <div className="space-y-8">
      <div className="ml-64">
        <h1 className="text-4xl font-bold text-slate-800">Overview</h1>
        <p className="text-lg text-slate-600 mt-2">Summary only</p>
      </div>

      {error ? (
        <div className="ml-64 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 ml-64">
        {loading && stats.length === 0
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl border border-sky-100 bg-white/60 animate-pulse" />
            ))
          : stats.map((stat, index) => <StatCard key={index} {...stat} />)}
      </div>
    </div>
  );
}
