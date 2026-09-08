import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username || !password) {
      setError('Please enter both username/email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const user = await login(username, password);

      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'FACULTY') {
        navigate('/faculty');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Background glowing gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500 rounded-full filter blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500 rounded-full filter blur-[120px]" />
      </div>

      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-slate-100">
        {/* Left Side: Brand & Quick Demo Roles */}
        <div className="md:col-span-5 bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-white border border-white/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight leading-none">Academia<span className="text-indigo-300">Pro</span></h1>
                <p className="text-[10px] text-indigo-200 tracking-wider uppercase font-semibold">College Management System</p>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              <h2 className="text-xl font-bold tracking-tight">Institutional Portal</h2>
              <p className="text-xs text-indigo-200 leading-relaxed">
                A centralized, secure digital platform uniting campus administration, faculty members, and students with real-time academic records.
              </p>
            </div>
          </div>

          {/* Quick Demo Fill Buttons */}
          <div className="mt-8 pt-6 border-t border-white/10 space-y-2.5">
            <p className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider">One-Click Demo Access</p>
            
            <button
              type="button"
              onClick={() => fillCredentials('admin', 'Admin@123')}
              className="w-full text-left p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-xs flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-white">Administrator</p>
                <p className="text-[10px] text-indigo-300 font-mono">admin / Admin@123</p>
              </div>
              <span className="text-[10px] bg-purple-500/40 text-purple-200 px-2 py-0.5 rounded-full font-bold">ADMIN</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('prof.rajesh', 'Faculty@123')}
              className="w-full text-left p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-xs flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-white">Prof. Rajesh Sharma</p>
                <p className="text-[10px] text-indigo-300 font-mono">prof.rajesh / Faculty@123</p>
              </div>
              <span className="text-[10px] bg-blue-500/40 text-blue-200 px-2 py-0.5 rounded-full font-bold">FACULTY</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('student.rahul', 'Student@123')}
              className="w-full text-left p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all text-xs flex items-center justify-between"
            >
              <div>
                <p className="font-bold text-white">Rahul Sharma</p>
                <p className="text-[10px] text-indigo-300 font-mono">student.rahul / Student@123</p>
              </div>
              <span className="text-[10px] bg-emerald-500/40 text-emerald-200 px-2 py-0.5 rounded-full font-bold">STUDENT</span>
            </button>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h2>
            <p className="text-sm text-slate-500 mt-1">Access your college account and academic services</p>
          </div>

          {error && (
            <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. admin or roll number"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Role-Based Authentication
            </span>
            <span>MySQL Relational Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
