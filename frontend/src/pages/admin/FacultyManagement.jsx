import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, BookOpen } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function FacultyManagement() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [formData, setFormData] = useState({
    employee_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    designation: 'Assistant Professor',
    joining_date: '',
    password: 'Faculty@123'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchFaculty(pagination.page);
  }, [search, department, pagination.page]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data?.success) setDepartments(res.data.data);
    } catch (e) {}
  };

  const fetchFaculty = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/faculty', {
        params: {
          page,
          limit: 10,
          q: search,
          department
        }
      });
      if (res.data?.success) {
        setFaculty(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      employee_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      department: departments[0]?.department_name || 'Computer Science & Engineering',
      designation: 'Assistant Professor',
      joining_date: new Date().toISOString().split('T')[0],
      password: 'Faculty@123'
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (fac) => {
    setSelectedFaculty(fac);
    setFormData({
      first_name: fac.first_name,
      last_name: fac.last_name,
      phone: fac.phone || '',
      department: fac.department,
      designation: fac.designation,
      joining_date: fac.joining_date || ''
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenDelete = (fac) => {
    setSelectedFaculty(fac);
    setIsDeleteOpen(true);
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.post('/faculty', formData);
      if (res.data?.success) {
        setIsAddModalOpen(false);
        fetchFaculty(1);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create faculty member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateFaculty = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.put(`/faculty/${selectedFaculty.id}`, formData);
      if (res.data?.success) {
        setIsEditModalOpen(false);
        fetchFaculty(pagination.page);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to update faculty member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFaculty = async () => {
    try {
      setSubmitting(true);
      const res = await api.delete(`/faculty/${selectedFaculty.id}`);
      if (res.data?.success) {
        setIsDeleteOpen(false);
        fetchFaculty(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete faculty member');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Employee ID',
      accessor: 'employee_id',
      cellClassName: 'font-mono font-bold text-indigo-600'
    },
    {
      header: 'Faculty Member',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.first_name} {row.last_name}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      cellClassName: 'font-medium text-slate-700'
    },
    {
      header: 'Designation',
      render: (row) => (
        <span className="px-2.5 py-1 rounded-md bg-blue-50 font-semibold text-blue-700 text-xs border border-blue-100">
          {row.designation}
        </span>
      )
    },
    {
      header: 'Assigned Courses',
      render: (row) => (
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          {row.assigned_courses_count || 0} Courses
        </span>
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
            onClick={() => handleOpenDelete(row)}
            title="Delete Faculty"
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Directory</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage academic instructors, appointments, and credentials</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <UserPlus className="w-4 h-4" />
          Add Faculty Member
        </button>
      </div>

      <DataTable
        columns={columns}
        data={faculty}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID, name, or email..."
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        filterComponents={
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
        }
      />

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Faculty Member"
        subtitle="Registers faculty in database and generates instructor login"
        size="lg"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateFaculty} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Employee ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. FAC-CSE-003"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="e.g. arvind.kumar@college.edu.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">First Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Arvind / Priya / Meera"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Last Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Kumar / Sharma / Nair"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department *</label>
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Designation *</label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white"
              >
                <option value="Professor & HOD">Professor & HOD</option>
                <option value="Professor">Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Lecturer">Lecturer</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="text"
                placeholder="e.g. +91 98450 12345"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Portal Password</label>
              <input
                type="text"
                placeholder="Default: Faculty@123"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none font-mono"
              />
            </div>
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
              {submitting ? 'Registering...' : 'Add Faculty'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Faculty Member"
        subtitle={`Updating ${selectedFaculty?.first_name} ${selectedFaculty?.last_name}`}
        size="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleUpdateFaculty} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">First Name</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Last Name</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Designation</label>
            <select
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white"
            >
              <option value="Professor">Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Lecturer">Lecturer</option>
              <option value="Department Chair">Department Chair</option>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteFaculty}
        loading={submitting}
        title="Delete Faculty Member"
        message={`Are you sure you want to remove ${selectedFaculty?.first_name} ${selectedFaculty?.last_name} (${selectedFaculty?.employee_id})? Assigned courses will have instructor set to unassigned.`}
      />
    </div>
  );
}
