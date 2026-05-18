import React, { useState, useEffect } from 'react';

const mockStudents = [
  { roll: '01', name: 'Aniket Shinde', present: true },
  { roll: '02', name: 'Prajakta Rajput', present: true },
  { roll: '03', name: 'Sahil Kale', present: true },
  { roll: '04', name: 'Neha Sharma', present: true },
  { roll: '05', name: 'Rahul Verma', present: true },
  { roll: '06', name: 'Sneha Patil', present: true },
  { roll: '07', name: 'Vikas Kumar', present: true },
  { roll: '08', name: 'Priya Singh', present: true },
  { roll: '09', name: 'Amit Desai', present: true },
  { roll: '10', name: 'Pooja Joshi', present: true },
];

export default function MarkAttendanceModal({ onClose, initialData }) {
  const [students, setStudents] = useState(mockStudents);
  const [absentInput, setAbsentInput] = useState('');
  const [highlightedRows, setHighlightedRows] = useState([]);

  // Derive initial values from initialData if present
  const [date] = useState(initialData ? '21 May 2025' : '');
  const [time] = useState(initialData ? initialData.time : '');
  const [subject] = useState(initialData ? initialData.subject : '');
  const [className] = useState(initialData ? initialData.class : '');

  const toggleAttendance = (roll) => {
    setStudents(students.map(s => s.roll === roll ? { ...s, present: !s.present } : s));
    setHighlightedRows(highlightedRows.filter(r => r !== roll)); // Remove highlight if manually toggled
  };

  const applyAbsentees = () => {
    const rollsToMarkAbsent = absentInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s);

    if (rollsToMarkAbsent.length > 0) {
      setStudents(students.map(s => {
        if (rollsToMarkAbsent.includes(s.roll)) {
          return { ...s, present: false };
        }
        return s;
      }));
      setHighlightedRows(rollsToMarkAbsent);
      setAbsentInput('');
    }
  };

  const presentCount = students.filter(s => s.present).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Mark Attendance</h2>
            <p className="text-sm text-slate-500 mt-0.5">Step 2: Review and submit attendance</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Selection Summary */}
        <div className="px-6 py-4 bg-sky-50/50 border-b border-sky-100 flex flex-wrap gap-4 md:gap-8 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</p>
            <p className="font-bold text-slate-800">{date || 'Select Date'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Time Slot</p>
            <p className="font-bold text-slate-800">{time || 'Select Time'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</p>
            <p className="font-bold text-slate-800">{subject || 'Select Subject'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Class</p>
            <p className="font-bold text-slate-800">{className || 'Select Class'}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* Smart Quick Absent Tool */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <label className="block text-sm font-bold text-slate-800 mb-3 relative z-10">Quick Mark Absentees ⚡</label>
            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={absentInput}
                  onChange={(e) => setAbsentInput(e.target.value)}
                  placeholder="Enter roll numbers separated by commas (e.g. 03,07,10)"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                />
              </div>
              <button 
                onClick={applyAbsentees}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors whitespace-nowrap"
              >
                Apply Absentees
              </button>
            </div>
          </div>

          {/* Table Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                placeholder="Search student..." 
                className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-64"
              />
            </div>
            
            <div className="flex gap-4 text-sm font-semibold">
              <div className="text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Present: {presentCount}</div>
              <div className="text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">Absent: {absentCount}</div>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 w-24">Roll No</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3 w-32 text-center">Present</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr 
                    key={student.roll} 
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${!student.present ? 'bg-red-50/30' : ''} ${highlightedRows.includes(student.roll) ? 'bg-red-100/50 animate-pulse-once' : ''}`}
                    onClick={() => toggleAttendance(student.roll)}
                  >
                    <td className="px-6 py-3 font-medium text-slate-700">{student.roll}</td>
                    <td className="px-6 py-3 text-slate-800">{student.name}</td>
                    <td className="px-6 py-3 text-center">
                      <div className="inline-flex items-center justify-center">
                        <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                          student.present 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'bg-white border-slate-300'
                        }`}>
                          {student.present && (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={() => {
              setStudents(mockStudents.map(s => ({...s, present: true})));
              setHighlightedRows([]);
            }}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Reset All
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
