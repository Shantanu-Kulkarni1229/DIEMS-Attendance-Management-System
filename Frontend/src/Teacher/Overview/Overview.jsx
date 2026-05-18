import React from 'react';

const stats = [
  { title: "Today's Classes", value: "4", subtitle: "Scheduled", icon: "📅", color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Total Students", value: "186", subtitle: "Across all classes", icon: "👥", color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "Attendance Marked", value: "2", subtitle: "Classes Completed", icon: "✅", color: "text-purple-600", bg: "bg-purple-50" },
  { title: "Pending Classes", value: "2", subtitle: "To Mark", icon: "🕒", color: "text-orange-600", bg: "bg-orange-50" },
];

const schedule = [
  { time: "09:00 AM - 10:00 AM", subject: "ML (Theory)", class: "SYA", status: "Completed" },
  { time: "11:00 AM - 12:00 PM", subject: "CN (Theory)", class: "TYB", status: "Pending" },
  { time: "01:00 PM - 02:00 PM", subject: "IOT (Theory)", class: "SYB", status: "Pending" },
  { time: "03:00 PM - 04:00 PM", subject: "CD (Theory)", class: "FE-A", status: "Pending" },
];

const leaveRequests = [
  { initials: "AS", name: "Aniket Shinde", classInfo: "SYA - ML (Theory)", date: "21 May 2025", duration: "Full Day", color: "bg-blue-100 text-blue-700" },
  { initials: "PR", name: "Prajakta Rajput", classInfo: "TYB - CN (Theory)", date: "22 May 2025", duration: "1st Half", color: "bg-purple-100 text-purple-700" },
  { initials: "SK", name: "Sahil Kale", classInfo: "SYB - IOT (Theory)", date: "23 May 2025", duration: "Full Day", color: "bg-orange-100 text-orange-700" },
];

const quickActions = [
  { title: "Mark Attendance", subtitle: "Mark attendance for your classes", icon: "📅", color: "text-blue-600" },
  { title: "Edit Attendance", subtitle: "Edit or update existing records", icon: "✏️", color: "text-emerald-600" },
  { title: "Approve Leave", subtitle: "Review and approve student leaves", icon: "👤", color: "text-orange-600" },
  { title: "View Reports", subtitle: "View attendance reports & analytics", icon: "📄", color: "text-purple-600" },
];

const weeklyOverview = [
  { day: "Mon", date: "19 May", fraction: "4/4", status: "Marked", color: "text-emerald-600" },
  { day: "Tue", date: "20 May", fraction: "3/4", status: "Marked", color: "text-emerald-600" },
  { day: "Wed", date: "21 May", fraction: "2/4", status: "Marked", color: "text-emerald-600", active: true },
  { day: "Thu", date: "22 May", fraction: "0/4", status: "Pending", color: "text-orange-500" },
  { day: "Fri", date: "23 May", fraction: "0/4", status: "Pending", color: "text-orange-500" },
  { day: "Sat", date: "24 May", fraction: "-", status: "No Classes", color: "text-slate-400" },
  { day: "Sun", date: "25 May", fraction: "-", status: "No Classes", color: "text-slate-400" },
];

export default function Overview({ onMarkAttendance }) {
  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Good Morning, Prof. Rahul Patil <span className="text-2xl animate-wave origin-bottom-right">👋</span>
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your classes today.</p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white shadow-sm hover:shadow-md transition-all flex items-start gap-4 group">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-800 leading-none mb-1">{stat.value}</h3>
              <p className="text-xs font-medium text-slate-400">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Class Schedule */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur rounded-2xl p-6 border border-white shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Today's Class Schedule</h2>
            <span className="text-sm font-medium text-slate-500">21 May 2025, Wednesday</span>
          </div>

          <div className="space-y-4">
            {schedule.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-colors gap-4">
                <div className="flex items-center gap-6">
                  <div className="w-32">
                    <p className="text-sm font-semibold text-slate-700">{item.time.split(' - ')[0]}</p>
                    <p className="text-xs text-slate-500">- {item.time.split(' - ')[1]}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">{item.subject}</h4>
                    <p className="text-sm text-slate-500">{item.class}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {item.status}
                  </span>
                  
                  {item.status === 'Completed' ? (
                    <button className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors min-w-[140px]">
                      View Attendance
                    </button>
                  ) : (
                    <button 
                      onClick={() => onMarkAttendance(item)}
                      className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 hover:border-blue-600 hover:bg-blue-50 rounded-lg transition-all min-w-[140px]"
                    >
                      Mark Attendance
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-6 text-sm font-semibold text-blue-600 flex items-center gap-1 mx-auto hover:text-blue-700">
            View Full Schedule <span className="text-lg">›</span>
          </button>
        </div>

        {/* Leave Requests */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Leave Requests</h2>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View All</button>
          </div>

          <div className="flex-1 space-y-4">
            {leaveRequests.map((req, i) => (
              <div key={i} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${req.color}`}>
                  {req.initials}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800">{req.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{req.classInfo}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{req.date}</p>
                    <p className="text-[10px] text-slate-500">{req.duration}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </button>
                    <button className="w-7 h-7 rounded border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-auto pt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 self-start">
            View All Requests ›
          </button>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, i) => (
              <button key={i} className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-all group">
                <div className={`text-2xl mb-3 ${action.color} group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <h4 className="text-xs font-bold text-slate-800 mb-1">{action.title}</h4>
                <p className="text-[10px] text-slate-500 leading-tight">{action.subtitle}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Overview */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-6 border border-white shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Weekly Overview</h2>
            <select className="text-sm font-medium text-blue-600 bg-transparent border-none outline-none cursor-pointer pr-4">
              <option>This Week</option>
              <option>Last Week</option>
            </select>
          </div>
          
          <div className="flex justify-between items-end gap-2 h-full pb-2">
            {weeklyOverview.map((day, i) => (
              <div key={i} className={`flex flex-col items-center p-2 rounded-xl flex-1 transition-colors ${day.active ? 'bg-blue-50 border border-blue-100' : 'border border-transparent'}`}>
                <p className={`text-xs font-bold ${day.active ? 'text-blue-700' : 'text-slate-800'}`}>{day.day}</p>
                <p className="text-[10px] text-slate-400 mb-3">{day.date.split(' ')[0]} {day.date.split(' ')[1]}</p>
                
                <p className={`text-sm font-bold ${day.active ? 'text-blue-700' : day.color}`}>{day.fraction}</p>
                <p className={`text-[10px] font-medium mt-1 ${day.active ? 'text-blue-600' : day.color}`}>{day.status}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="pt-8 pb-4 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 border-t border-slate-200/60 mt-8">
        <p>© 2025 DIEMS. All rights reserved.</p>
        <div className="flex items-center gap-1.5 mt-2 md:mt-0">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Professional ERP Access Portal
        </div>
      </footer>

    </div>
  );
}
