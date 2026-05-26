import { useState, useEffect } from 'react';
import { get, post, remove } from '../../services/apiClient';
import TeacherEditModal from '../components/TeacherEditModal';

export default function CreateTeacher() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    temporaryPassword: '',
    yearClasses: [], // Array of selected year-class combinations
    subjects: [],
  });

  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const theorySubjects = [
    { name: 'ML', type: 'Theory' },
    { name: 'CD', type: 'Theory' },
    { name: 'IoT', type: 'Theory' },
    { name: 'E&SD', type: 'Theory' },
    { name: 'CP', type: 'Theory' },
    { name: 'CN', type: 'Theory' },
  ];

  const practicalSubjects = [
    { name: 'CP', type: 'Practical' },
    { name: 'ML', type: 'Practical' },
    { name: 'DIY', type: 'Practical' },
    { name: 'PD', type: 'Practical' },
  ];

  const yearOptions = [
    { value: 'FY', label: 'First Year', classes: ['FY-A', 'FY-B'] },
    { value: 'SY', label: 'Second Year', classes: ['SY-A', 'SY-B'] },
    { value: 'TY', label: 'Third Year', classes: ['TY-A', 'TY-B'] },
    { value: 'BTECH', label: 'Fourth Year (B.Tech)', classes: ['BTECH-A', 'BTECH-B'] },
  ];

  // Flatten all year-class combinations for easy access
  const allYearClasses = yearOptions.flatMap((year) =>
    year.classes.map((cls) => ({ year: year.value, class: cls, label: `${cls}` }))
  );

  // Load teachers from API on mount
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const data = await get('/api/admin/teachers');
        setTeachers(Array.isArray(data) ? data : []);
      } catch (error) {
        setMessage({ type: 'error', text: error.message || 'Failed to load teachers.' });
      }
    };
    loadTeachers();
  }, []);

  // Generate temporary password
  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, temporaryPassword: password });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleYearClassToggle = (yearClassCombo) => {
    const { year, class: cls } = yearClassCombo;
    const key = `${year}-${cls}`;
    setFormData((prev) => {
      const isSelected = prev.yearClasses.find((yc) => `${yc.year}-${yc.class}` === key);
      if (isSelected) {
        return {
          ...prev,
          yearClasses: prev.yearClasses.filter((yc) => `${yc.year}-${yc.class}` !== key),
        };
      } else {
        return {
          ...prev,
          yearClasses: [...prev.yearClasses, yearClassCombo],
        };
      }
    });
  };

  const handleSubjectToggle = (subject, type) => {
    const subjectKey = `${subject} (${type})`;
    setSelectedSubjects((prev) =>
      prev.includes(subjectKey) ? prev.filter((s) => s !== subjectKey) : [...prev, subjectKey]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Please enter teacher name.' });
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (!formData.temporaryPassword.trim()) {
      setMessage({ type: 'error', text: 'Please generate a temporary password.' });
      return;
    }
    if (formData.yearClasses.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one year-class combination.' });
      return;
    }
    if (selectedSubjects.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one subject.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await post('/api/admin/create-teacher', {
        name: formData.name,
        email: formData.email,
        temporaryPassword: formData.temporaryPassword,
        yearClasses: formData.yearClasses,
        subjects: selectedSubjects
      });

      const freshTeachers = await get('/api/admin/teachers');
      setTeachers(Array.isArray(freshTeachers) ? freshTeachers : []);

      // Reset form
      setFormData({
        name: '',
        email: '',
        temporaryPassword: '',
        yearClasses: [],
        subjects: [],
      });
      setSelectedSubjects([]);

      setMessage({
        type: 'success',
        text: `Teacher "${formData.name}" created successfully!`,
      });
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create teacher.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeacher = () => {
    setMessage({ type: 'error', text: 'Teacher id is required.' });
  };

  const handleDeleteTeacherById = async (teacherId, teacherName) => {
    if (!teacherId) return;
    if (!window.confirm(`Delete teacher ${teacherName || ''}?`)) return;
    try {
      await remove(`/api/admin/teachers/${teacherId}`);
      const freshTeachers = await get('/api/admin/teachers');
      setTeachers(Array.isArray(freshTeachers) ? freshTeachers : []);
      setMessage({ type: 'success', text: 'Teacher deleted successfully.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to delete teacher.' });
    }
  };

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
  };

  const handleTeacherSaved = (updatedTeachers) => {
    setTeachers(Array.isArray(updatedTeachers) ? updatedTeachers : []);
    setMessage({ type: 'success', text: 'Teacher updated successfully.' });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="ml-64 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-800">Create Teacher</h1>
        <p className="text-lg text-slate-600 mt-2">Add new faculty member to the system</p>
      </div>

      {/* Messages */}
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

      {/* Form Section */}
      <div className="bg-white/60 backdrop-blur rounded-2xl p-8 shadow-lg border border-sky-100">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Teacher Information</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Name and Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Dr. Rohan Patil"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g., rohan.patil@diems.edu"
                className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60"
              />
            </div>
          </div>

          {/* Row 2: Temporary Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Temporary Password *</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="temporaryPassword"
                value={formData.temporaryPassword}
                readOnly
                placeholder="Generate a password"
                className="flex-1 px-4 py-2 rounded-xl border border-sky-100 bg-sky-50/50 text-slate-700 font-mono text-sm"
              />
              <button
                type="button"
                onClick={generatePassword}
                className="px-4 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Password will be sent to the teacher email</p>
          </div>

          {/* Row 3: Year and Classes (Multiple Selection) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Classes to Teach * (Select Multiple)</label>
            <div className="space-y-4">
              {yearOptions.map((yearOption) => (
                <div key={yearOption.value}>
                  <h4 className="text-sm font-semibold text-sky-700 mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                    {yearOption.label}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ml-2">
                    {yearOption.classes.map((cls) => {
                      const combo = { year: yearOption.value, class: cls };
                      const isSelected = formData.yearClasses.some((yc) => yc.year === combo.year && yc.class === combo.class);
                      return (
                        <label
                          key={cls}
                          className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-sky-100 border-sky-400'
                              : 'bg-white/60 border-sky-100 hover:border-sky-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleYearClassToggle(combo)}
                            className="hidden"
                          />
                          <svg
                            className={`h-5 w-5 mr-2 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-slate-700">{cls}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {formData.yearClasses.length > 0 && (
              <p className="text-xs text-sky-600 mt-4 font-medium">
                Selected Classes ({formData.yearClasses.length}): {formData.yearClasses.map((yc) => yc.class).join(', ')}
              </p>
            )}
          </div>

          {/* Row 4: Subjects */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Subjects to Teach * (Select Multiple)</label>
            
            {/* Theory Subjects */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-sky-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500"></span>
                Theory Subjects
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {theorySubjects.map((subject) => {
                  const subjectKey = `${subject.name} (${subject.type})`;
                  const isSelected = selectedSubjects.includes(subjectKey);
                  return (
                    <label
                      key={subjectKey}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-100 border-sky-400'
                          : 'bg-white/60 border-sky-100 hover:border-sky-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSubjectToggle(subject.name, subject.type)}
                        className="hidden"
                      />
                      <svg
                        className={`h-5 w-5 mr-2 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-slate-700">{subject.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Practical Subjects */}
            <div>
              <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Practical Subjects
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {practicalSubjects.map((subject) => {
                  const subjectKey = `${subject.name} (${subject.type})`;
                  const isSelected = selectedSubjects.includes(subjectKey);
                  return (
                    <label
                      key={subjectKey}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-100 border-blue-400'
                          : 'bg-white/60 border-blue-100 hover:border-blue-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSubjectToggle(subject.name, subject.type)}
                        className="hidden"
                      />
                      <svg
                        className={`h-5 w-5 mr-2 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium text-slate-700">{subject.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {selectedSubjects.length > 0 && (
              <p className="text-xs text-sky-600 mt-4 font-medium">
                Selected ({selectedSubjects.length}): {selectedSubjects.join(', ')}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-sky-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {isSubmitting ? 'Creating...' : 'Create Teacher'}
            </button>
            <button
              type="reset"
              className="px-6 py-2 bg-white/60 text-slate-700 rounded-xl font-medium border border-sky-100 hover:bg-white/80 transition-all"
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>

      {/* Teachers List Section */}
      {teachers.length > 0 && (
        <div className="bg-white/60 backdrop-blur rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
          <div className="p-6 border-b border-sky-100">
            <h3 className="text-lg font-semibold text-slate-800">Created Teachers ({teachers.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Classes</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Subjects (Theory/Practical)</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {teachers.map((teacher) => (
                  <tr key={teacher._id || teacher.id} className="hover:bg-sky-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-800 font-medium">{teacher.name}</td>
                    <td className="px-6 py-3 text-sm text-slate-600">{teacher.email}</td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {(teacher.assignedClassrooms || teacher.yearClasses || []).map((yc, idx) => (
                          <span key={idx} className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                            {yc.name || yc.class}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {(teacher.assignedSubjects || teacher.subjects || []).map((subject, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              (subject.name || subject).toString().includes('Theory')
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {subject.name || subject}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => (window.location.href = `/admin/teachers/${teacher._id || teacher.id}`)}
                          className="text-slate-600 hover:text-slate-800 font-medium text-sm hover:bg-slate-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditTeacher(teacher)}
                          className="text-sky-600 hover:text-sky-800 font-medium text-sm hover:bg-sky-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTeacherById(teacher._id || teacher.id, teacher.name)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingTeacher && (
        <TeacherEditModal
          teacher={editingTeacher}
          onClose={() => setEditingTeacher(null)}
          onSaved={handleTeacherSaved}
        />
      )}
    </div>
  );
}

