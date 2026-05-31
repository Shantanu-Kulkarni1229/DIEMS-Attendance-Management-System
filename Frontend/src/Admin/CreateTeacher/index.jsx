import { useEffect, useMemo, useState } from 'react';
import { get, post, remove } from '../../services/apiClient';
import TeacherEditModal from '../components/TeacherEditModal';

const normalizeBatchSize = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) return 20;
  return parsed;
};

const compareRollNumbers = (left, right) => String(left || '').localeCompare(String(right || ''), undefined, { numeric: true, sensitivity: 'base' });

const getBatchPrefix = (className = '') => {
  const normalized = String(className || '').trim();
  const suffixMatch = normalized.match(/([A-Z])\s*(?:\([^)]*\))?$/i);
  if (suffixMatch && suffixMatch[1]) return suffixMatch[1].toUpperCase();
  if (normalized.includes('-')) {
    const lastPart = normalized.split('-').pop().trim();
    if (lastPart) return lastPart.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'A';
  }
  return 'A';
};

const buildPracticalBatches = (students = [], classroomName = '', batchSize = 20) => {
  const size = normalizeBatchSize(batchSize);
  const sortedStudents = [...students].sort((left, right) => compareRollNumbers(left.rollNo || left.roll, right.rollNo || right.roll));
  const prefix = getBatchPrefix(classroomName);
  const batches = [];

  sortedStudents.forEach((student, index) => {
    const batchIndex = Math.floor(index / size);
    if (!batches[batchIndex]) {
      batches[batchIndex] = {
        batchId: `${prefix}-${batchIndex + 1}`,
        label: `${prefix}-${batchIndex + 1}`,
        startRoll: student.rollNo || student.roll || '',
        endRoll: student.rollNo || student.roll || '',
        studentIds: [],
        studentCount: 0
      };
    }

    batches[batchIndex].studentIds.push(String(student._id));
    batches[batchIndex].studentCount += 1;
    batches[batchIndex].endRoll = student.rollNo || student.roll || batches[batchIndex].endRoll;
  });

  return batches.filter(Boolean);
};

const normalizeIdList = (values = []) => [...new Set((Array.isArray(values) ? values : [values]).map((value) => String(value || '').trim()).filter(Boolean))];

const emptyForm = {
  name: '',
  email: '',
  temporaryPassword: '',
  yearClasses: []
};

const theorySubjectSeeds = [
  { name: 'ML', type: 'Theory' },
  { name: 'CD', type: 'Theory' },
  { name: 'IoT', type: 'Theory' },
  { name: 'E&SD', type: 'Theory' },
  { name: 'CP', type: 'Theory' },
  { name: 'CN', type: 'Theory' }
];

const practicalSubjectSeeds = [
  { name: 'CP', type: 'Practical' },
  { name: 'ML', type: 'Practical' },
  { name: 'DIY', type: 'Practical' },
  { name: 'PD', type: 'Practical' }
];

export default function CreateTeacher() {
  const [formData, setFormData] = useState(emptyForm);
  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [practicalAssignments, setPracticalAssignments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [students, setStudents] = useState([]);
  const [classroomOptions, setClassroomOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [selectedYearClass, setSelectedYearClass] = useState('');
  const [selectedTheorySubject, setSelectedTheorySubject] = useState('');
  const [selectedPracticalSubject, setSelectedPracticalSubject] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [teachersData, classroomsData, subjectsData, studentsData] = await Promise.all([
          get('/api/admin/teachers'),
          get('/api/admin/classrooms'),
          get('/api/admin/subjects'),
          get('/api/admin/students')
        ]);

        if (!isMounted) return;

        setTeachers(Array.isArray(teachersData) ? teachersData : []);
        setStudents(Array.isArray(studentsData) ? studentsData : []);

        const normalizedClassrooms = (Array.isArray(classroomsData) ? classroomsData : [])
          .map((classroom) => ({
            _id: String(classroom?._id || ''),
            name: classroom?.name || 'Unnamed class',
            year: classroom?.year || '',
            practicalBatchSize: classroom?.practicalBatchSize || 20
          }))
          .filter((classroom) => classroom._id)
          .sort((left, right) => left.name.localeCompare(right.name));

        const normalizedSubjects = (Array.isArray(subjectsData) ? subjectsData : [])
          .map((subject) => ({
            _id: String(subject?._id || ''),
            name: subject?.name || 'Unnamed subject',
            code: subject?.code || '',
            year: subject?.year || '',
            category: subject?.category || 'lecture'
          }))
          .filter((subject) => subject._id)
          .sort((left, right) => left.name.localeCompare(right.name));

        setClassroomOptions(normalizedClassrooms);
        setSubjectOptions(normalizedSubjects);
      } catch (error) {
        if (!isMounted) return;
        setMessage({ type: 'error', text: error.message || 'Failed to load teachers.' });
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const theorySubjectChoices = useMemo(() => {
    if (subjectOptions.length) {
      return subjectOptions
        .filter((subject) => subject.category !== 'practical')
        .map((subject) => ({ value: `${subject.name} (Theory)`, label: subject.name }));
    }
    return theorySubjectSeeds.map((subject) => ({ value: `${subject.name} (${subject.type})`, label: subject.name }));
  }, [subjectOptions]);

  const practicalSubjectChoices = useMemo(() => {
    if (subjectOptions.length) {
      return subjectOptions
        .filter((subject) => subject.category === 'practical')
        .map((subject) => ({ value: `${subject.name} (Practical)`, label: subject.name }));
    }
    return practicalSubjectSeeds.map((subject) => ({ value: `${subject.name} (${subject.type})`, label: subject.name }));
  }, [subjectOptions]);

  const studentGroups = useMemo(() => students.reduce((acc, student) => {
    const className = String(student?.className || '').trim();
    if (!className) return acc;
    if (!acc[className]) acc[className] = [];
    acc[className].push(student);
    return acc;
  }, {}), [students]);

  const classroomLabelById = useMemo(() => new Map(
    classroomOptions.map((classroom) => [
      classroom._id,
      `${classroom.name}${classroom.year ? ` (${classroom.year})` : ''}`
    ])
  ), [classroomOptions]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let index = 0; index < 12; index += 1) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((current) => ({ ...current, temporaryPassword: password }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleYearClassToggle = (yearClassCombo) => {
    const { year, class: className } = yearClassCombo;
    const key = `${year}-${className}`;
    setFormData((current) => {
      const exists = current.yearClasses.some((yearClass) => `${yearClass.year}-${yearClass.class}` === key);
      return {
        ...current,
        yearClasses: exists
          ? current.yearClasses.filter((yearClass) => `${yearClass.year}-${yearClass.class}` !== key)
          : [...current.yearClasses, yearClassCombo]
      };
    });
  };

  const handleSubjectToggle = (subject, type) => {
    const subjectKey = `${subject} (${type})`;
    setSelectedSubjects((current) => (current.includes(subjectKey) ? current.filter((item) => item !== subjectKey) : [...current, subjectKey]));
  };

  const addYearClass = () => {
    const selectedClassroom = classroomOptions.find((classroom) => classroom._id === selectedYearClass);
    if (!selectedClassroom) return;
    const selected = {
      year: selectedClassroom.year || '',
      class: selectedClassroom.name
    };
    if (!selected) return;
    handleYearClassToggle(selected);
    setSelectedYearClass('');
  };

  const addSubjectFromDraft = (draftValue) => {
    const subjectKey = String(draftValue || '').trim();
    if (!subjectKey) return;
    const match = subjectKey.match(/^(.*) \((Theory|Practical)\)$/i);
    if (!match) return;
    handleSubjectToggle(match[1].trim(), match[2]);
  };

  const addPracticalAssignmentRow = () => {
    setPracticalAssignments((current) => [...current, { subject: '', classroom: '', batchIds: [] }]);
  };

  const ensurePracticalAssignmentRow = (subjectKey) => {
    setPracticalAssignments((current) => {
      if (current.some((assignment) => assignment.subject === subjectKey)) return current;
      return [...current, { subject: subjectKey, classroom: '', batchIds: [] }];
    });
  };

  const updatePracticalAssignmentRow = (index, field, value) => {
    setPracticalAssignments((current) => current.map((assignment, rowIndex) => {
      if (rowIndex !== index) return assignment;
      return {
        ...assignment,
        [field]: value,
        ...(field === 'classroom' ? { batchIds: [] } : {})
      };
    }));
  };

  const removePracticalAssignmentRow = (index) => {
    setPracticalAssignments((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setSelectedSubjects([]);
    setPracticalAssignments([]);
    setSelectedYearClass('');
    setSelectedTheorySubject('');
    setSelectedPracticalSubject('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

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
      setMessage({ type: 'error', text: 'Please select at least one class.' });
      return;
    }
    if (selectedSubjects.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one subject.' });
      return;
    }

    const practicalSelectedSubjects = selectedSubjects.filter((subject) => subject.includes('(Practical)'));
    const normalizedPracticalAssignments = practicalAssignments
      .map((assignment) => ({
        subject: String(assignment.subject || '').trim(),
        classroom: String(assignment.classroom || '').trim(),
        batchIds: normalizeIdList(assignment.batchIds)
      }))
      .filter((assignment) => assignment.subject && assignment.classroom && assignment.batchIds.length);

    if (practicalSelectedSubjects.length > 0) {
      if (!normalizedPracticalAssignments.length) {
        setMessage({ type: 'error', text: 'Please assign practical batches for the selected practical subjects.' });
        return;
      }

      const missingSubjects = practicalSelectedSubjects.filter((subject) => !normalizedPracticalAssignments.some((assignment) => assignment.subject === subject));
      if (missingSubjects.length) {
        setMessage({ type: 'error', text: `Practical batches are missing for: ${missingSubjects.join(', ')}` });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await post('/api/admin/create-teacher', {
        name: formData.name,
        email: formData.email,
        temporaryPassword: formData.temporaryPassword,
        yearClasses: formData.yearClasses,
        subjects: selectedSubjects,
        practicalAssignments: normalizedPracticalAssignments
      });

      const freshTeachers = await get('/api/admin/teachers');
      setTeachers(Array.isArray(freshTeachers) ? freshTeachers : []);

      resetForm();
      setMessage({ type: 'success', text: `Teacher "${formData.name}" created successfully!` });
      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create teacher.' });
    } finally {
      setIsSubmitting(false);
    }
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

  const selectedPracticalSubjectOptions = selectedSubjects.filter((subject) => subject.includes('(Practical)'));

  const getBatchOptionsForClassroom = () => ([
    { value: 'Batch 1', label: 'Batch 1' },
    { value: 'Batch 2', label: 'Batch 2' },
    { value: 'Batch 3', label: 'Batch 3' },
    { value: 'Batch 4', label: 'Batch 4' }
  ]);

  const subjectSummaryLabel = (teacher) => {
    const directSubjects = Array.isArray(teacher?.assignedSubjects) ? teacher.assignedSubjects : Array.isArray(teacher?.subjects) ? teacher.subjects : [];
    return directSubjects.map((subject) => subject?.name || subject).filter(Boolean).join(', ') || '--';
  };

  const practicalSummaryLabel = (teacher) => {
    const assignments = Array.isArray(teacher?.practicalBatchAssignments) ? teacher.practicalBatchAssignments : [];
    if (!assignments.length) return '--';
    return assignments.map((assignment) => {
      const subjectName = assignment?.subject?.name || assignment?.subject || 'Subject';
      const classroomName = assignment?.classroom?.name || assignment?.classroom || 'Class';
      const batches = Array.isArray(assignment?.batchIds) ? assignment.batchIds.join(', ') : '--';
      return `${subjectName} / ${classroomName} / ${batches}`;
    }).join(' | ');
  };

  return (
    <div className="ml-64 space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-800">Create Teacher</h1>
        <p className="text-lg text-slate-600 mt-2">Add new faculty member to the system</p>
      </div>

      {message && (
        <div className={`rounded-xl p-4 ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white/60 backdrop-blur rounded-2xl p-8 shadow-lg border border-sky-100">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Teacher Information</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g., Dr. Rohan Patil" className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="e.g., rohan.patil@diems.edu" className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/60" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Temporary Password *</label>
            <div className="flex gap-2">
              <input type="text" name="temporaryPassword" value={formData.temporaryPassword} readOnly placeholder="Generate a password" className="flex-1 px-4 py-2 rounded-xl border border-sky-100 bg-sky-50/50 text-slate-700 font-mono text-sm" />
              <button type="button" onClick={generatePassword} className="px-4 py-2 bg-linear-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all">Generate</button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Password will be sent to the teacher email</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Classes to Teach *</label>
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Choose class</label>
                <select value={selectedYearClass} onChange={(event) => setSelectedYearClass(event.target.value)} className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/70 text-sm">
                  <option value="">Select a class</option>
                  {classroomOptions.map((classroom) => (
                    <option key={classroom._id} value={classroom._id}>
                      {classroomLabelById.get(classroom._id) || classroom.name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={addYearClass} disabled={!selectedYearClass} className="px-5 py-2.5 bg-linear-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50">Add Class</button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {formData.yearClasses.map((combo) => (
                <button key={`${combo.year}-${combo.class}`} type="button" onClick={() => handleYearClassToggle(combo)} className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-200">
                  {combo.class}
                  <span className="text-sky-500">×</span>
                </button>
              ))}
              {!formData.yearClasses.length ? <span className="text-sm text-slate-400">No classes selected yet.</span> : null}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Subjects to Teach *</label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4">
                <h4 className="text-sm font-semibold text-sky-700 mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500"></span>Theory Subjects</h4>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Choose theory subject</label>
                    <select value={selectedTheorySubject} onChange={(event) => setSelectedTheorySubject(event.target.value)} className="w-full px-4 py-2 rounded-xl border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white/70 text-sm">
                      <option value="">Select theory subject</option>
                      {theorySubjectChoices.map((subject) => (
                        <option key={subject.value} value={subject.value}>{subject.label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => { addSubjectFromDraft(selectedTheorySubject); setSelectedTheorySubject(''); }} disabled={!selectedTheorySubject} className="px-5 py-2.5 bg-sky-600 text-white rounded-xl font-medium hover:bg-sky-700 transition-all disabled:opacity-50">Add</button>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500"></span>Practical Subjects</h4>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Choose practical subject</label>
                    <select value={selectedPracticalSubject} onChange={(event) => setSelectedPracticalSubject(event.target.value)} className="w-full px-4 py-2 rounded-xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white/70 text-sm">
                      <option value="">Select practical subject</option>
                      {practicalSubjectChoices.map((subject) => (
                        <option key={subject.value} value={subject.value}>{subject.label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => {
                    const subjectValue = String(selectedPracticalSubject || '').trim();
                    if (!subjectValue) return;
                    addSubjectFromDraft(subjectValue);
                    ensurePracticalAssignmentRow(subjectValue);
                    setSelectedPracticalSubject('');
                  }} disabled={!selectedPracticalSubject} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all disabled:opacity-50">Add</button>
                </div>
              </div>
            </div>

            {selectedSubjects.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedSubjects.map((subject) => (
                  <button key={subject} type="button" onClick={() => handleSubjectToggle(subject.replace(/ \((Theory|Practical)\)$/, ''), subject.includes('(Practical)') ? 'Practical' : 'Theory')} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${subject.includes('(Practical)') ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'}`}>
                    {subject}
                    <span className="opacity-70">×</span>
                  </button>
                ))}
              </div>
            )}

            {selectedPracticalSubjectOptions.length > 0 && (
              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800">Practical Batch Assignments</h4>
                    <p className="text-xs text-slate-500 mt-1">Pick a practical subject, choose a class, then assign one or more batches.</p>
                  </div>
                  <button type="button" onClick={addPracticalAssignmentRow} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">Add Batch Assignment</button>
                </div>

                <div className="space-y-4">
                  {practicalAssignments.map((assignment, index) => {
                    const batches = getBatchOptionsForClassroom();
                    return (
                      <div key={`${index}-${assignment.subject || 'practical'}`} className="rounded-2xl border border-blue-100 bg-white/70 p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Practical subject</label>
                            <select value={assignment.subject} onChange={(event) => updatePracticalAssignmentRow(index, 'subject', event.target.value)} className="w-full px-4 py-2 rounded-xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white/70 text-sm">
                              <option value="">Select practical subject</option>
                              {selectedPracticalSubjectOptions.map((subject) => (
                                <option key={subject} value={subject}>{subject}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Class</label>
                            <select value={assignment.classroom} onChange={(event) => updatePracticalAssignmentRow(index, 'classroom', event.target.value)} className="w-full px-4 py-2 rounded-xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white/70 text-sm">
                              <option value="">Select class</option>
                              {formData.yearClasses.map((combo) => {
                                const classroom = classroomOptions.find((item) => item.name === combo.class);
                                return classroom ? (
                                  <option key={classroom._id} value={classroom._id}>
                                    {classroomLabelById.get(classroom._id) || classroom.name}
                                  </option>
                                ) : null;
                              })}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Batches</label>
                            {assignment.subject ? (
                              <select
                                multiple
                                value={assignment.batchIds}
                                onChange={(event) => updatePracticalAssignmentRow(index, 'batchIds', Array.from(event.target.selectedOptions, (option) => option.value))}
                                className="w-full px-4 py-2 rounded-xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white/70 text-sm min-h-28"
                              >
                                <option value="" disabled>Select one or more batches</option>
                                {batches.map((batch) => (
                                  <option key={batch.value} value={batch.value}>{batch.label}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/60 px-4 py-3 text-sm text-slate-500">
                                Select a practical subject to load batches.
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <div className="flex flex-wrap gap-2">
                            {(assignment.batchIds || []).map((batchId) => (
                              <span key={batchId} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">{batchId}</span>
                            ))}
                          </div>
                          <button type="button" onClick={() => removePracticalAssignmentRow(index)} className="text-sm font-medium text-rose-600 hover:text-rose-700">Remove row</button>
                        </div>
                      </div>
                    );
                  })}
                  {!practicalAssignments.length ? <p className="text-sm text-slate-500">Add at least one row to map practical subjects to batches.</p> : null}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-sky-100">
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-linear-to-r from-sky-400 to-blue-500 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {isSubmitting ? 'Creating...' : 'Create Teacher'}
            </button>
            <button type="button" onClick={resetForm} className="px-6 py-2 bg-white/60 text-slate-700 rounded-xl font-medium border border-sky-100 hover:bg-white/80 transition-all">Clear Form</button>
          </div>
        </form>
      </div>

      {teachers.length > 0 && (
        <div className="bg-white/60 backdrop-blur rounded-2xl shadow-lg border border-sky-100 overflow-hidden">
          <div className="p-6 border-b border-sky-100">
            <h3 className="text-lg font-semibold text-slate-800">Created Teachers ({teachers.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-300">
              <thead className="bg-linear-to-r from-sky-50 to-blue-50 border-b border-sky-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Classes</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Subjects</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Practical Batches</th>
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
                        {(teacher.assignedClassrooms || teacher.yearClasses || []).map((yearClass, index) => (
                          <span key={index} className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">{yearClass.name || yearClass.class}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-700">{subjectSummaryLabel(teacher)}</td>
                    <td className="px-6 py-3 text-sm text-slate-700">{practicalSummaryLabel(teacher)}</td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={() => (window.location.href = `/admin/teachers/${teacher._id || teacher.id}`)} className="text-slate-600 hover:text-slate-800 font-medium text-sm hover:bg-slate-50 px-3 py-1 rounded-lg transition-colors">Details</button>
                        <button type="button" onClick={() => handleEditTeacher(teacher)} className="text-sky-600 hover:text-sky-800 font-medium text-sm hover:bg-sky-50 px-3 py-1 rounded-lg transition-colors">Edit</button>
                        <button type="button" onClick={() => handleDeleteTeacherById(teacher._id || teacher.id, teacher.name)} className="text-red-600 hover:text-red-800 font-medium text-sm hover:bg-red-50 px-3 py-1 rounded-lg transition-colors">Delete</button>
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
        <TeacherEditModal key={editingTeacher._id || editingTeacher.id} teacher={editingTeacher} onClose={() => setEditingTeacher(null)} onSaved={handleTeacherSaved} />
      )}
    </div>
  );
}