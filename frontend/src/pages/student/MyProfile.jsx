import React, { useState, useEffect } from 'react';
import { UserCheck, Lock, Building2, GraduationCap, Mail, Phone, Calendar, MapPin, Check, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/Badge';

export default function MyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setProfile(res.data.user?.profile);
      }
    } catch (err) {
      console.error('Failed to load student profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters');
      return;
    }

    try {
      setPwdLoading(true);
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.data?.success) {
        setPwdSuccess('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading student profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Personal Student Profile</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Your verified registration details in the college database</p>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-600/20">
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">{profile?.first_name} {profile?.last_name}</h2>
              <Badge variant="STUDENT">Active Enrolled</Badge>
            </div>
            <p className="font-mono text-xs font-bold text-indigo-600 mt-0.5">Roll Number: {profile?.roll_number}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Academic Department</span>
            <p className="text-slate-800 font-bold text-sm">{profile?.department}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Current Term</span>
            <p className="text-slate-800 font-bold text-sm">Year {profile?.year}, Semester {profile?.semester}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Official Email</span>
            <p className="text-slate-800 font-bold text-sm">{profile?.email}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Contact Phone</span>
            <p className="text-slate-800 font-bold text-sm">{profile?.phone || 'Not recorded'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Date of Birth & Gender</span>
            <p className="text-slate-800 font-bold text-sm">{profile?.date_of_birth || 'N/A'} • {profile?.gender || 'Other'}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold uppercase tracking-wider block">Admission Date</span>
            <p className="text-slate-800 font-bold text-sm">{profile?.admission_date || 'N/A'}</p>
          </div>
        </div>

        {profile?.address && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Residential Address</span>
            <p className="text-slate-700 font-medium">{profile.address}</p>
          </div>
        )}
      </div>

      {/* Security & Password Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-4 mb-5">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" /> Account Security & Password
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Update your login password regularly for account security</p>
        </div>

        {pwdSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {pwdSuccess}
          </div>
        )}

        {pwdError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {pwdError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password *</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={pwdLoading}
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            {pwdLoading ? 'Updating Password...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
