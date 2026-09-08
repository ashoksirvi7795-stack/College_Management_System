import React, { useState, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  IndianRupee,
  Clock,
  CalendarCheck,
  TrendingUp,
  Receipt,
  BookMarked,
  ArrowUpRight
} from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import ReceiptModal from '../../components/ReceiptModal';
import { formatINR } from '../../utils/format';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (paymentId) => {
    try {
      const res = await api.get(`/payments/${paymentId}/receipt`);
      if (res.data?.success) {
        setSelectedReceipt(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded-md w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Real-time statistics directly aggregated from the MySQL relational database</p>
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Students"
          value={stats.totalStudents || 0}
          subtitle="Enrolled active learners"
          icon={GraduationCap}
          color="indigo"
        />
        <StatCard
          title="Academic Faculty"
          value={stats.totalFaculty || 0}
          subtitle="Professors & Lecturers"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Offered Courses"
          value={stats.totalCourses || 0}
          subtitle={`${stats.totalDepartments || 0} Academic Departments`}
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="Average Attendance"
          value={`${stats.avgAttendance || 0}%`}
          subtitle="Overall institutional rate"
          icon={CalendarCheck}
          color="emerald"
        />
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Total Collected Fees</span>
              <IndianRupee className="w-5 h-5 text-emerald-200" />
            </div>
            <p className="text-3xl font-extrabold mt-3 tracking-tight">
              {formatINR(stats.collectedFees || 0)}
            </p>
          </div>
          <p className="text-xs text-emerald-100 mt-4 pt-3 border-t border-emerald-500/40">
            Realized income through verified transactions
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-600 to-orange-600 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-100">Outstanding / Pending</span>
              <Clock className="w-5 h-5 text-rose-200" />
            </div>
            <p className="text-3xl font-extrabold mt-3 tracking-tight">
              {formatINR(stats.pendingFees || 0)}
            </p>
          </div>
          <p className="text-xs text-rose-100 mt-4 pt-3 border-t border-rose-500/40">
            Current student fee accounts receivable
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Assessed Fees</span>
              <Building2 className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-extrabold mt-3 tracking-tight">
              {formatINR(stats.totalFees || 0)}
            </p>
          </div>
          <p className="text-xs text-slate-300 mt-4 pt-3 border-t border-slate-700">
            Total ledger assessment across all departments
          </p>
        </div>
      </div>

      {/* Dual Column Section: Recent Payments & Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Payments */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Fee Transactions</h2>
              <p className="text-xs text-slate-500">Live payment verification stream</p>
            </div>
            <Receipt className="w-5 h-5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentPayments && data.recentPayments.length > 0 ? (
              data.recentPayments.map((p) => (
                <div key={p.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {p.first_name} {p.last_name}
                      <span className="ml-2 font-mono text-xs font-normal text-slate-400">({p.roll_number})</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.fee_type} • {p.payment_method}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600 font-mono">
                      +{formatINR(p.amount_paid)}
                    </p>
                    <button
                      onClick={() => handleViewReceipt(p.id)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5 justify-end mt-1"
                    >
                      Receipt <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-slate-400">No payment transactions recorded yet</p>
            )}
          </div>
        </div>

        {/* Upcoming Examinations */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Upcoming Examinations</h2>
              <p className="text-xs text-slate-500">Scheduled academic assessments</p>
            </div>
            <BookMarked className="w-5 h-5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {data?.upcomingExams && data.upcomingExams.length > 0 ? (
              data.upcomingExams.map((exam) => (
                <div key={exam.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{exam.exam_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-indigo-600">{exam.course_code}</span>: {exam.course_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {exam.exam_date}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold">{exam.exam_type}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-8 text-center text-xs text-slate-400">No examinations scheduled yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Student Enrollment Distribution by Department */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">Department Enrollment Distribution</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {data?.deptDistribution && data.deptDistribution.length > 0 ? (
            data.deptDistribution.map((d, i) => (
              <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-500 truncate">{d.department}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{d.count}</p>
                <p className="text-[11px] text-indigo-600 font-semibold mt-1">Enrolled Students</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400">No enrollment records available</p>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
