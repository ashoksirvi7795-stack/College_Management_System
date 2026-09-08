import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Plus, Edit2, Trash2, Award } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function Examinations() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);

  const [formData, setFormData] = useState({
    exam_name: '',
    exam_type: 'Midterm',
    course_id: '',
    exam_date: '',
    semester: 4,
    academic_year: '2025-2026'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMeta();
    fetchExams();
  }, []);

  useEffect(() => {
    fetchExams();
  }, [selectedSemester, selectedCourse]);

  const fetchMeta = async () => {
    try {
      const res = await api.get('/courses?limit=100');
      if (res.data?.success) {
        setCourses(res.data.data);
      }
    } catch (e) {}
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/examinations', {
        params: {
          semester: selectedSemester,
          course_id: selectedCourse
        }
      });
      if (res.data?.success) {
        setExams(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      exam_name: '',
      exam_type: 'Midterm',
      course_id: courses[0]?.id || '',
      exam_date: new Date().toISOString().split('T')[0],
      semester: 4,
      academic_year: '2025-2026'
    });
    setFormError('');
    setIsAddOpen(true);
  };

  const handleOpenEdit = (exam) => {
    setCurrentExam(exam);
    setFormData({
      exam_name: exam.exam_name,
      exam_type: exam.exam_type,
      course_id: exam.course_id,
      exam_date: exam.exam_date,
      semester: exam.semester,
      academic_year: exam.academic_year
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.post('/examinations', formData);
      if (res.data?.success) {
        setIsAddOpen(false);
        fetchExams();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to schedule exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateExam = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.put(`/examinations/${currentExam.id}`, formData);
      if (res.data?.success) {
        setIsEditOpen(false);
        fetchExams();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update exam');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExam = async () => {
    try {
      setSubmitting(true);
      const res = await api.delete(`/examinations/${currentExam.id}`);
      if (res.data?.success) {
        setIsDeleteOpen(false);
        fetchExams();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete exam');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Examination Name',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.exam_name}</p>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            {row.exam_type}
          </span>
        </div>
      )
    },
    {
      header: 'Course',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-indigo-600 mr-1">{row.course_code}</span>
          <span className="text-slate-800 font-medium">{row.course_name}</span>
          <p className="text-[11px] text-slate-400">{row.department}</p>
        </div>
      )
    },
    {
      header: 'Scheduled Date',
      accessor: 'exam_date',
      cellClassName: 'font-semibold text-slate-800'
    },
    {
      header: 'Term',
      render: (row) => (
        <span className="text-xs text-slate-600">
          Sem {row.semester} • {row.academic_year}
        </span>
      )
    },
    {
      header: 'Marks Logged',
      render: (row) => (
        <button
          onClick={() => navigate(`/admin/marks?exam_id=${row.id}`)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
        >
          <Award className="w-3.5 h-3.5" />
          {row.marks_entered_count || 0} Recorded
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
            onClick={() => handleOpenEdit(row)}
            title="Edit Exam"
            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentExam(row);
              setIsDeleteOpen(true);
            }}
            title="Delete Exam"
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Examinations & Schedules</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Create and oversee institutional midterms, finals, and practical assessments</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Schedule Examination
        </button>
      </div>

      <DataTable
        columns={columns}
        data={exams}
        loading={loading}
        filterComponents={
          <>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.course_code}: {c.course_name}</option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </>
        }
      />

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Schedule Examination"
        subtitle="Registers exam in MySQL relational schema"
        size="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateExam} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Exam Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. DBMS Midterm Exam Spring 2026"
              value={formData.exam_name}
              onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Exam Type</label>
              <select
                value={formData.exam_type}
                onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white"
              >
                <option value="Midterm">Midterm</option>
                <option value="Final">Final</option>
                <option value="Practical">Practical</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Course *</label>
              <select
                required
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.course_code}: {c.course_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Exam Date *</label>
              <input
                type="date"
                required
                value={formData.exam_date}
                onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
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
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Academic Year</label>
              <input
                type="text"
                required
                value={formData.academic_year}
                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Scheduling...' : 'Schedule Exam'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Examination"
        subtitle={`Updating ${currentExam?.exam_name}`}
        size="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleUpdateExam} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Exam Name</label>
            <input
              type="text"
              required
              value={formData.exam_name}
              onChange={(e) => setFormData({ ...formData, exam_name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Exam Type</label>
              <select
                value={formData.exam_type}
                onChange={(e) => setFormData({ ...formData, exam_type: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white"
              >
                <option value="Midterm">Midterm</option>
                <option value="Final">Final</option>
                <option value="Practical">Practical</option>
                <option value="Quiz">Quiz</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Exam Date</label>
              <input
                type="date"
                required
                value={formData.exam_date}
                onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteExam}
        loading={submitting}
        title="Cancel Examination"
        message={`Are you sure you want to delete ${currentExam?.exam_name}? All student marks associated with this exam will be removed.`}
      />
    </div>
  );
}
