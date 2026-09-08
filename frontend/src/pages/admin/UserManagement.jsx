import React, { useState, useEffect } from 'react';
import { UserPlus, Shield, Key, Trash2 } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import ConfirmDialog from '../../components/ConfirmDialog';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [createFormData, setCreateFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'ADMIN'
  });

  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users', {
        params: {
          role: roleFilter,
          q: search
        }
      });
      if (res.data?.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.post('/users', createFormData);
      if (res.data?.success) {
        setIsCreateOpen(false);
        fetchUsers();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.put(`/users/${selectedUser.id}/reset-password`, { newPassword });
      if (res.data?.success) {
        setIsResetOpen(false);
        setNewPassword('');
        alert('Password successfully reset');
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setSubmitting(true);
      const res = await api.delete(`/users/${selectedUser.id}`);
      if (res.data?.success) {
        setIsDeleteOpen(false);
        fetchUsers();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      cellClassName: 'font-mono text-slate-400 font-bold'
    },
    {
      header: 'Username',
      accessor: 'username',
      cellClassName: 'font-bold text-slate-900'
    },
    {
      header: 'Email Address',
      accessor: 'email',
      cellClassName: 'text-slate-600'
    },
    {
      header: 'System Role',
      render: (row) => <Badge variant={row.role}>{row.role}</Badge>
    },
    {
      header: 'Created On',
      render: (row) => <span className="text-xs text-slate-400">{new Date(row.created_at).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedUser(row);
              setNewPassword('');
              setFormError('');
              setIsResetOpen(true);
            }}
            title="Reset Password"
            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <Key className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(row);
              setIsDeleteOpen(true);
            }}
            title="Delete User"
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System User Accounts</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Control institutional portal access and credentials across all roles</p>
        </div>
        <button
          onClick={() => {
            setCreateFormData({ username: '', email: '', password: '', role: 'ADMIN' });
            setFormError('');
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <UserPlus className="w-4 h-4" />
          Create User Account
        </button>
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by username or email..."
        filterComponents={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="FACULTY">FACULTY</option>
            <option value="STUDENT">STUDENT</option>
          </select>
        }
      />

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create System Account"
        subtitle="Registers credentials in MySQL with bcrypt hashing"
        size="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Username *</label>
            <input
              type="text"
              required
              placeholder="e.g. dean.admin"
              value={createFormData.username}
              onChange={(e) => setCreateFormData({ ...createFormData, username: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="user@college.edu"
              value={createFormData.email}
              onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Password *</label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={createFormData.password}
              onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned System Role *</label>
            <select
              value={createFormData.role}
              onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium"
            >
              <option value="ADMIN">ADMIN (Full Permissions)</option>
              <option value="FACULTY">FACULTY (Attendance & Grading)</option>
              <option value="STUDENT">STUDENT (Read-Only Personal Records)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Reset User Password"
        subtitle={`Resetting password for ${selectedUser?.username}`}
        size="sm"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password *</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsResetOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Resetting...' : 'Update Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteUser}
        loading={submitting}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user account ${selectedUser?.username}?`}
      />
    </div>
  );
}
