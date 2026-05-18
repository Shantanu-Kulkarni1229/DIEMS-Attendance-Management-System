export default function Reports() {
  return (
    <div className="ml-64 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-800">Reports</h1>
        <p className="text-lg text-slate-600 mt-2">View and analyze attendance analytics</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white/60 backdrop-blur rounded-2xl p-6 shadow-lg border border-sky-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Class</label>
            <select className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60 text-sm">
              <option>All Classes</option>
              <option>First Year</option>
              <option>Second Year</option>
              <option>Third Year</option>
              <option>Fourth Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
            <select className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60 text-sm">
              <option>All Branches</option>
              <option>Computer Science</option>
              <option>Electronics</option>
              <option>Mechanical</option>
              <option>Civil</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
            <input type="date" className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
            <input type="date" className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60 text-sm" />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button className="px-6 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all text-sm">
            Generate Report
          </button>
          <button className="px-6 py-2 bg-white/60 text-slate-700 rounded-xl font-medium border border-sky-100 hover:bg-white/80 transition-all text-sm">
            Export to CSV
          </button>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white/60 backdrop-blur rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Roll Number</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Present Days</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Absent Days</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Attendance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-100">
              {[
                { name: 'Aarav Sharma', roll: 'CS001', class: 'First Year', present: 78, absent: 8, percent: 89.7 },
                { name: 'Bhavna Patel', roll: 'CS002', class: 'First Year', present: 76, absent: 10, percent: 88.4 },
                { name: 'Chandra Kumar', roll: 'CS003', class: 'First Year', present: 82, absent: 4, percent: 95.3 },
                { name: 'Divya Singh', roll: 'CS004', class: 'First Year', present: 74, absent: 12, percent: 86.0 },
                { name: 'Eshan Verma', roll: 'CS005', class: 'First Year', present: 80, absent: 6, percent: 93.0 },
              ].map((student, idx) => (
                <tr key={idx} className="hover:bg-sky-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-800">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{student.roll}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{student.class}</td>
                  <td className="px-6 py-4 text-center text-sm text-green-600 font-medium">{student.present}</td>
                  <td className="px-6 py-4 text-center text-sm text-red-600 font-medium">{student.absent}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-sm font-semibold">
                      {student.percent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 flex items-center justify-between border-t border-sky-100">
          <span className="text-sm text-slate-600">Showing 1 to 5 of 2,450 students</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-lg bg-white border border-sky-100 text-slate-600 hover:bg-sky-50 text-sm font-medium">Previous</button>
            <button className="px-3 py-1 rounded-lg bg-gradient-to-r from-sky-400 to-blue-500 text-white text-sm font-medium">1</button>
            <button className="px-3 py-1 rounded-lg bg-white border border-sky-100 text-slate-600 hover:bg-sky-50 text-sm font-medium">2</button>
            <button className="px-3 py-1 rounded-lg bg-white border border-sky-100 text-slate-600 hover:bg-sky-50 text-sm font-medium">3</button>
            <button className="px-3 py-1 rounded-lg bg-white border border-sky-100 text-slate-600 hover:bg-sky-50 text-sm font-medium">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
