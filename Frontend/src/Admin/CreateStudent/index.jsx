import { useEffect, useState } from 'react';
import { get, post, remove } from '../../services/apiClient';
import StudentEditModal from '../components/StudentEditModal';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  rollNo: '',
  classSemester: '',
  branch: '',
  phone: '',
  parentEmail: ''
};

export default function CreateStudent() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const data = await get('/api/admin/students');
        setStudents(Array.isArray(data) ? data : []);
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to load students.' });
      }
    };
    loadStudents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setMessage({ type: 'error', text: 'First and last name are required.' });
      return;
    }
    if (!form.email.trim() || !form.rollNo.trim() || !form.classSemester.trim()) {
      setMessage({ type: 'error', text: 'Email, roll number, and class are required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await post('/api/admin/create-student', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        rollNo: form.rollNo,
        classSemester: form.classSemester,
        branch: form.branch,
        phone: form.phone,
        parentEmail: form.parentEmail
      });
      setMessage({ type: 'success', text: 'Student created successfully.' });
      setForm(initialForm);
      const data = await get('/api/admin/students');
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create student.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    if (!student?._id) return;
    if (!window.confirm(`Delete student ${student.name || ''}?`)) return;
    try {
      await remove(`/api/admin/students/${student._id}`);
      const data = await get('/api/admin/students');
      setStudents(Array.isArray(data) ? data : []);
      setMessage({ type: 'success', text: 'Student deleted successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete student.' });
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
  };

  const handleStudentSaved = (updatedStudents) => {
    setStudents(Array.isArray(updatedStudents) ? updatedStudents : []);
    setMessage({ type: 'success', text: 'Student updated successfully.' });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="ml-64 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-800">Create Student</h1>
        <p className="text-lg text-slate-600 mt-2">Add new student to the system</p>
      </div>

      {message && (
        <div
          className={`rounded-xl p-4 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white/60 backdrop-blur rounded-2xl p-8 shadow-lg border border-sky-100">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
              <input
                type="text"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
              <input
                type="text"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter email"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Roll Number</label>
              <input
                type="text"
                name="rollNo"
                value={form.rollNo}
                onChange={handleChange}
                placeholder="Enter roll number"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Class/Semester</label>
              <select
                name="classSemester"
                value={form.classSemester}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              >
                <option value="">Select Class</option>
                <option value="First Year">First Year</option>
                <option value="Second Year">Second Year</option>
                <option value="Third Year">Third Year</option>
                <option value="Fourth Year">Fourth Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
              <select
                name="branch"
                value={form.branch}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              >
                <option value="">Select Branch</option>
                <option value="CSE">Computer Science</option>
                <option value="ENTC">Electronics</option>
                <option value="MECH">Mechanical</option>
                <option value="CIVIL">Civil</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Parent Email</label>
              <input
                type="email"
                name="parentEmail"
                value={form.parentEmail}
                onChange={handleChange}
                placeholder="Enter parent email"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Student'}
            </button>
            <button
              type="button"
              onClick={() => setForm(initialForm)}
              className="px-6 py-2 bg-white/60 text-slate-700 rounded-xl font-medium border border-sky-100 hover:bg-white/80 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {students.length > 0 && (
        <div className="bg-white/60 backdrop-blur rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
          <div className="p-6 border-b border-sky-100">
            <h3 className="text-lg font-semibold text-slate-800">Created Students ({students.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Roll No</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Class</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Division</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-sky-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-800 font-medium">{student.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{student.rollNo}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{student.className}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{student.division}</td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => (window.location.href = `/admin/students/${student._id}`)} className="text-slate-600 hover:text-slate-800 font-medium text-sm hover:bg-slate-50 px-3 py-1 rounded-lg transition-colors">Details</button>
                        <button type="button" onClick={() => handleEditStudent(student)} className="text-sky-600 hover:text-sky-800 font-medium text-sm hover:bg-sky-50 px-3 py-1 rounded-lg transition-colors">Edit</button>
                        <button type="button" onClick={() => handleDeleteStudent(student)} className="text-red-600 hover:text-red-800 font-medium text-sm hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingStudent && (
        <StudentEditModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onSaved={handleStudentSaved}
        />
      )}
    </div>
  );
}
