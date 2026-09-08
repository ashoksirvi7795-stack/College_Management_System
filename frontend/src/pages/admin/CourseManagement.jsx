import React, { useState, useEffect } from 'react';
import { BookPlus, Edit2, Trash2, Users, UserPlus, X } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [enrollStudentId, setEnrollStudentId] = useState('');

  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    description: '',
    credits: 3,
    department: '',
    semester: 1,
    faculty_id: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchCourses(pagination.page);
  }, [search, department, semester, pagination.page]);

  const fetchMeta = async () => {
    try {
      const [deptRes, facRes, studRes] = await Promise.all([
        api.get('/departments'),
        api.get('/faculty?limit=100'),
        api.get('/students?limit=200')
      ]);
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
      if (facRes.data?.success) setFacultyList(facRes.data.data);
      if (studRes.data?.success) setAllStudents(studRes.data.data);
    } catch (e) {}
  };

  const fetchCourses = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/courses', {
        params: {
          page,
          limit: 10,
          q: search,
          department,
          semester
        }
      });
      if (res.data?.success) {
        setCourses(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      course_code: '',
      course_name: '',
      description: '',
      credits: 3,
      department: departments[0]?.department_name || 'Computer Science & Engineering',
      semester: 1,
      faculty_id: facultyList[0]?.id || ''
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setSelectedCourse(course);
    setFormData({
      course_name: course.course_name,
      description: course.description || '',
      credits: course.credits,
      department: course.department,
      semester: course.semester,
      faculty_id: course.faculty_id || ''
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenEnrollModal = async (course) => {
    setSelectedCourse(course);
    setEnrollStudentId('');
    try {
      const res = await api.get(`/courses/${course.id}`);
      if (res.data?.success) {
        setEnrolledStudents(res.data.data.students || []);
      }
    } catch (e) {}
    setIsEnrollModalOpen(true);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.post('/courses', formData);
      if (res.data?.success) {
        setIsAddModalOpen(false);
        fetchCourses(1);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.put(`/courses/${selectedCourse.id}`, formData);
      if (res.data?.success) {
        setIsEditModalOpen(false);
        fetchCourses(pagination.page);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      setSubmitting(true);
      const res = await api.delete(`/courses/${selectedCourse.id}`);
      if (res.data?.success) {
        setIsDeleteOpen(false);
        fetchCourses(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!enrollStudentId) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/courses/${selectedCourse.id}/enroll`, { student_id: enrollStudentId });
      if (res.data?.success) {
        handleOpenEnrollModal(selectedCourse);
        fetchCourses(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to enroll student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnenrollStudent = async (studentId) => {
    if (!window.confirm('Remove student enrollment from this course?')) return;
    try {
      const res = await api.delete(`/courses/${selectedCourse.id}/enroll/${studentId}`);
      if (res.data?.success) {
        handleOpenEnrollModal(selectedCourse);
        fetchCourses(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unenroll student');
    }
  };

  const columns = [
    {
      header: 'Course Code',
      accessor: 'course_code',
      cellClassName: 'font-mono font-bold text-indigo-600'
    },
    {
      header: 'Course Title',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.course_name}</p>
          <p className="text-xs text-slate-400 line-clamp-1">{row.description || 'No syllabus notes'}</p>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      cellClassName: 'font-medium text-slate-700'
    },
    {
      header: 'Level',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-md bg-slate-100 font-semibold text-slate-700 text-xs">
          Sem {row.semester} • {row.credits} Cr
        </span>
      )
    },
    {
      header: 'Assigned Instructor',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800">
          {row.faculty_first_name ? `Prof. ${row.faculty_first_name} ${row.faculty_last_name}` : <em className="text-slate-400">Unassigned</em>}
        </span>
      )
    },
    {
      header: 'Enrolled',
      render: (row) => (
        <button
          onClick={() => handleOpenEnrollModal(row)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          {row.enrolled_students_count || 0} Students
        </button>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEditModal(row)}
            title="Edit Details"
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedCourse(row);
              setIsDeleteOpen(true);
            }}
            title="Delete Course"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Curriculum & Courses</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage academic courses, syllabus credits, and faculty assignments</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <BookPlus className="w-4 h-4" />
          Create New Course
        </button>
      </div>

      <DataTable
        columns={columns}
        data={courses}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search courses by code or title..."
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        filterComponents={
          <>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.department_name}>{d.department_name}</option>
              ))}
            </select>

            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </>
        }
      />

      {/* Add Course Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Academic Course"
        subtitle="Registers course in catalog with relational faculty assignment"
        size="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. CS404"
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none uppercase font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Credits</label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Operating Systems"
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course Description</label>
            <textarea
              rows="2"
              placeholder="Overview, syllabus topics, and prerequisites"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.department_name}>{d.department_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Faculty Instructor</label>
            <select
              value={formData.faculty_id}
              onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white"
            >
              <option value="">-- Select Instructor --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>Prof. {f.first_name} {f.last_name} ({f.department})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Course"
        subtitle={`Updating course ${selectedCourse?.course_code}`}
        size="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleUpdateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course Title</label>
            <input
              type="text"
              required
              value={formData.course_name}
              onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course Description</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Credits</label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assign Faculty Instructor</label>
            <select
              value={formData.faculty_id}
              onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white"
            >
              <option value="">-- Unassigned --</option>
              {facultyList.map((f) => (
                <option key={f.id} value={f.id}>Prof. {f.first_name} {f.last_name} ({f.department})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enrolled Students Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title={`Enrollments: ${selectedCourse?.course_code}`}
        subtitle={selectedCourse?.course_name}
        size="lg"
      >
        <div className="space-y-6">
          {/* Enroll New Student form */}
          <form onSubmit={handleEnrollStudent} className="flex gap-2 items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
            <select
              value={enrollStudentId}
              onChange={(e) => setEnrollStudentId(e.target.value)}
              className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none bg-white font-medium"
              required
            >
              <option value="">-- Select Student to Enroll --</option>
              {allStudents
                .filter(s => !enrolledStudents.some(es => es.id === s.id))
                .map(s => (
                  <option key={s.id} value={s.id}>
                    {s.roll_number} - {s.first_name} {s.last_name} ({s.department})
                  </option>
                ))}
            </select>
            <button
              type="submit"
              disabled={submitting || !enrollStudentId}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Enroll
            </button>
          </form>

          {/* Enrolled Students Roster */}
          <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 font-bold uppercase sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Roll Number</th>
                  <th className="py-2.5 px-4">Student Name</th>
                  <th className="py-2.5 px-4">Department</th>
                  <th className="py-2.5 px-4">Enrollment Date</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrolledStudents && enrolledStudents.length > 0 ? (
                  enrolledStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">{s.roll_number}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{s.first_name} {s.last_name}</td>
                      <td className="py-2.5 px-4 text-slate-600">{s.department}</td>
                      <td className="py-2.5 px-4 text-slate-500">{s.enrollment_date}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleUnenrollStudent(s.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Unenroll"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">No students currently enrolled</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteCourse}
        loading={submitting}
        title="Delete Academic Course"
        message={`Are you sure you want to delete ${selectedCourse?.course_code} - ${selectedCourse?.course_name}? Enrolled student records and scheduled examinations will also be removed.`}
      />
    </div>
  );
}
