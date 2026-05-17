import { useState, useEffect } from 'react';
import { createTeacher, createStudent, getTeachers, getStudents, getClassrooms, getSubjects } from '../../../services/dashboardApi';

const AdminDashboard = () => {
  const [section, setSection] = useState('dashboard'); // dashboard, create-teacher, create-student, manage
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Teacher form
  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: '',
    subjects: [],
    customSubjects: [], // { name, year }
    // classrooms removed per request
  });

  // Student form
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: '',
    classroom: '',
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [teachersData, studentsData, classroomsData, subjectsData] = await Promise.all([
          getTeachers(),
          getStudents(),
          getClassrooms(),
          getSubjects(),
        ]);
        setTeachers(teachersData || []);
        setStudents(studentsData || []);
        setClassrooms(classroomsData || []);
        setSubjects(subjectsData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Combine existing subject IDs and custom subject objects
      const payload = {
        name: teacherForm.name,
        email: teacherForm.email,
        password: teacherForm.password,
        subjects: [
          ...teacherForm.subjects,
          ...(teacherForm.customSubjects || []).map((s) => ({ name: s.name, year: s.year }))
        ],
      };
      await createTeacher(payload);
      setSuccess('Teacher created successfully!');
      setTeacherForm({ name: '', email: '', password: '', subjects: [], customSubjects: [] });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createStudent(studentForm);
      setSuccess('Student created successfully!');
      setStudentForm({ name: '', email: '', password: '', classroom: '' });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin-slow mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-2">Manage teachers, students, and resources</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4">
          <p className="text-red-700 font-bold">Error: {error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4">
          <p className="text-emerald-700 font-bold">✓ {success}</p>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex flex-wrap gap-3 border-b-2 border-sky-200 pb-4">
        {[
          { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
          { id: 'create-teacher', label: '➕ Create Teacher', icon: '👨‍🏫' },
          { id: 'create-student', label: '➕ Create Student', icon: '👨‍🎓' },
          { id: 'manage-teachers', label: '👥 Manage Teachers', icon: '👨‍🏫' },
          { id: 'manage-students', label: '👥 Manage Students', icon: '👨‍🎓' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            className={`px-4 py-2 font-bold text-sm border-b-4 transition-all rounded-t-lg ${
              section === tab.id
                ? 'border-sky-600 text-sky-700 bg-sky-50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Section */}
      {section === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border-2 border-sky-300 p-6">
            <p className="text-sm font-bold text-sky-700 uppercase mb-2">Teachers</p>
            <p className="text-4xl font-black text-slate-900">{teachers.length}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-300 p-6">
            <p className="text-sm font-bold text-emerald-700 uppercase mb-2">Students</p>
            <p className="text-4xl font-black text-slate-900">{students.length}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-300 p-6">
            <p className="text-sm font-bold text-purple-700 uppercase mb-2">Classrooms</p>
            <p className="text-4xl font-black text-slate-900">{classrooms.length}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-300 p-6">
            <p className="text-sm font-bold text-amber-700 uppercase mb-2">Subjects</p>
            <p className="text-4xl font-black text-slate-900">{subjects.length}</p>
          </div>
        </div>
      )}

      {/* Create Teacher Section */}
      {section === 'create-teacher' && (
        <form onSubmit={handleCreateTeacher} className="bg-white rounded-xl border-2 border-sky-200 p-8 max-w-2xl">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Create New Teacher</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={teacherForm.name}
              onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={teacherForm.email}
              onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={teacherForm.password}
              onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              required
            />
            
            {/* Existing subjects selection removed per request */}

            {/* Add custom subjects by name + year */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Add Subject (type name + select year)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Subject name (e.g., Data Structures)"
                  value={teacherForm._newSubjectName || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, _newSubjectName: e.target.value })}
                  className="flex-1 px-3 py-2 border-2 border-sky-200 rounded-lg focus:outline-none"
                />
                <select
                  value={teacherForm._newSubjectYear || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, _newSubjectYear: e.target.value })}
                  className="px-3 py-2 border-2 border-sky-200 rounded-lg bg-white"
                >
                  <option value="">Year</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const name = (teacherForm._newSubjectName || '').trim();
                    const year = teacherForm._newSubjectYear ? Number(teacherForm._newSubjectYear) : undefined;
                    if (!name) return setError('Please provide a subject name');
                    setTeacherForm({
                      ...teacherForm,
                      customSubjects: [...teacherForm.customSubjects, { name, year }],
                      _newSubjectName: '',
                      _newSubjectYear: ''
                    });
                  }}
                  className="px-3 py-2 bg-sky-600 text-white rounded-lg"
                >
                  Add
                </button>
              </div>

              {teacherForm.customSubjects && teacherForm.customSubjects.length > 0 && (
                <div className="mt-3 space-y-2">
                  {teacherForm.customSubjects.map((cs, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                      <div className="text-sm text-slate-900">{cs.name} {cs.year ? `({cs.year}yr)` : ''}</div>
                      <button
                        type="button"
                        onClick={() => setTeacherForm({
                          ...teacherForm,
                          customSubjects: teacherForm.customSubjects.filter((_, i) => i !== idx)
                        })}
                        className="text-red-600 font-semibold"
                      >Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Classrooms assignment removed per request */}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-sky-600 to-sky-500 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {submitting ? '⏳ Creating...' : '✓ Create Teacher'}
            </button>
          </div>
        </form>
      )}

      {/* Create Student Section */}
      {section === 'create-student' && (
        <form onSubmit={handleCreateStudent} className="bg-white rounded-xl border-2 border-sky-200 p-8 max-w-2xl">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Create New Student</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={studentForm.password}
              onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              required
            />
            <select
              value={studentForm.classroom}
              onChange={(e) => setStudentForm({ ...studentForm, classroom: e.target.value })}
              className="w-full px-4 py-3 border-2 border-sky-200 rounded-lg focus:outline-none focus:border-sky-500"
              required
            >
              <option value="">Select Classroom</option>
              {classrooms.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {submitting ? '⏳ Creating...' : '✓ Create Student'}
            </button>
          </div>
        </form>
      )}

      {/* Manage Teachers Section */}
      {section === 'manage-teachers' && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-slate-900">Teachers ({teachers.length})</h3>
          {teachers.length === 0 ? (
            <p className="text-slate-600">No teachers yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.map((teacher) => (
                <div key={teacher._id} className="bg-white rounded-xl border-2 border-sky-200 p-6 hover:shadow-md transition">
                  <h4 className="font-bold text-slate-900">{teacher.name}</h4>
                  <p className="text-sm text-slate-600">{teacher.email}</p>
                  <p className="text-xs text-sky-600 font-semibold mt-1">📍 {teacher.branch}</p>
                  <button className="mt-3 px-3 py-1 bg-sky-100 text-sky-700 rounded font-semibold text-sm hover:bg-sky-200 transition">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage Students Section */}
      {section === 'manage-students' && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-slate-900">Students ({students.length})</h3>
          {students.length === 0 ? (
            <p className="text-slate-600">No students yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((student) => (
                <div key={student._id} className="bg-white rounded-xl border-2 border-emerald-200 p-6 hover:shadow-md transition">
                  <h4 className="font-bold text-slate-900">{student.name}</h4>
                  <p className="text-sm text-slate-600">{student.email}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">📍 {student.branch}</p>
                  <button className="mt-3 px-3 py-1 bg-emerald-100 text-emerald-700 rounded font-semibold text-sm hover:bg-emerald-200 transition">
                    Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
