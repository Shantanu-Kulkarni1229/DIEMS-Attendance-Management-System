import StatCard from '../components/StatCard';
import AnalyticsCard from '../components/AnalyticsCard';
import QuickActionCard from '../components/QuickActionCard';

export default function Dashboard() {
  const stats = [
    { title: 'Total Students', value: '2,450', growth: '+4.5% vs last month', icon: 'students' },
    { title: 'Total Teachers', value: '120', growth: '+3.2% vs last month', icon: 'teachers' },
    { title: "Today's Attendance", value: '1,856', growth: '+5.6% vs yesterday', icon: 'attendance' },
    { title: 'Attendance Rate', value: '75.6%', growth: '+4.1% vs last month', icon: 'rate' },
  ];

  const chartData = [
    { day: 'Mon', value: 65 },
    { day: 'Tue', value: 70 },
    { day: 'Wed', value: 78 },
    { day: 'Thu', value: 82 },
    { day: 'Fri', value: 76 },
    { day: 'Sat', value: 64 },
    { day: 'Sun', value: 75 },
  ];

  const activities = [
    { text: 'New teacher Dr. Rohan Patil added', time: '2 hours ago', icon: 'teacher' },
    { text: '32 new students added in SYA', time: '5 hours ago', icon: 'students' },
    { text: 'Attendance report generated', time: 'Yesterday, 11:30 AM', icon: 'report' },
    { text: 'System backup completed', time: 'Yesterday, 01:15 AM', icon: 'backup' },
  ];

  const quickActions = [
    { label: 'Create Teacher', icon: 'teacher', subtitle: 'Add new faculty' },
    { label: 'Create Student', icon: 'student', subtitle: 'Add new student' },
    { label: 'Reports', icon: 'reports', subtitle: 'View analytics' },
    { label: 'Export Data', icon: 'export', subtitle: 'Download reports' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="ml-64">
        <h1 className="text-4xl font-bold text-slate-800">Overview</h1>
        <p className="text-lg text-slate-600 mt-2">Welcome back, Admin 👋</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ml-64">
        {stats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ml-64">
        <div className="lg:col-span-2">
          <AnalyticsCard title="Attendance Trend" type="line" data={chartData} />
        </div>
        <div>
          <AnalyticsCard title="Attendance by Status (Today)" type="donut" />
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 ml-64">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-sky-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
            <button className="text-sm text-sky-600 hover:text-sky-700 font-medium">View All</button>
          </div>
          <div className="space-y-4">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex items-start gap-4 pb-4 border-b border-sky-50 last:border-0 last:pb-0">
                <div className="p-2 rounded-full bg-sky-100 flex-shrink-0">
                  <ActivityIcon type={activity.icon} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-800 font-medium">{activity.text}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-sky-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, idx) => (
              <QuickActionCard key={idx} {...action} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }) {
  const icons = {
    teacher: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    students: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10h.01M13 16H3v-2a6 6 0 0112 0v2zm4-12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    report: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    backup: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
      </svg>
    ),
  };
  return icons[type];
}
