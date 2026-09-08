import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Building2,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  Receipt
} from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/Badge';
import ReceiptModal from '../../components/ReceiptModal';
import { formatINR } from '../../utils/format';

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/students/${id}`);
      if (res.data?.success) {
        setStudentData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load student details:', err);
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
        <div className="h-6 bg-slate-200 rounded w-32" />
        <div className="h-48 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!studentData?.student) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-600 font-bold">Student record not found</p>
        <button
          onClick={() => navigate('/admin/students')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Back to Students
        </button>
      </div>
    );
  }

  const { student, courses, attendance, marks, fees } = studentData;

  // Calculate overall attendance
  const totalClasses = attendance.reduce((sum, a) => sum + (parseInt(a.total_classes, 10) || 0), 0);
  const totalPresent = attendance.reduce((sum, a) => sum + (parseInt(a.present_count, 10) || 0), 0);
  const overallAttendancePct = totalClasses > 0 ? Number(((totalPresent / totalClasses) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/students')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Student Directory
      </button>

      {/* Student Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-600/20">
              {student.first_name[0]}{student.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {student.first_name} {student.last_name}
                </h1>
                <Badge variant="STUDENT">Active Student</Badge>
              </div>
              <p className="font-mono text-xs font-bold text-indigo-600 mt-1">Roll Number: {student.roll_number}</p>
            </div>
          </div>

          <div className="text-left sm:text-right bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
            <span className={`text-xl font-black ${overallAttendancePct >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {overallAttendancePct}%
            </span>
          </div>
        </div>

        {/* Detailed Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 font-medium">Department</p>
              <p className="font-bold text-slate-800">{student.department}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 font-medium">Academic Level</p>
              <p className="font-bold text-slate-800">Year {student.year}, Semester {student.semester}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 font-medium">Email</p>
              <p className="font-bold text-slate-800">{student.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-slate-400 font-medium">Phone</p>
              <p className="font-bold text-slate-800">{student.phone || 'Not recorded'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('courses')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'courses'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Enrolled Courses ({courses?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'attendance'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Attendance Breakdown
        </button>

        <button
          onClick={() => setActiveTab('marks')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'marks'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Academic Marks ({marks?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'fees'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Fees & Ledger ({fees?.length || 0})
        </button>
      </div>

      {/* Tab 1: Enrolled Courses */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses && courses.length > 0 ? (
            courses.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {c.course_code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">{c.credits} Credits</span>
                </div>
                <h3 className="font-bold text-slate-900 mt-2.5">{c.course_name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'No description provided'}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Instructor: <strong className="text-slate-700">{c.faculty_first_name ? `${c.faculty_first_name} ${c.faculty_last_name}` : 'TBA'}</strong></span>
                  <span>Enrolled: {c.enrollment_date}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center col-span-2">Student is not currently enrolled in any courses</p>
          )}
        </div>
      )}

      {/* Tab 2: Attendance Breakdown */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="space-y-4">
            {attendance && attendance.length > 0 ? (
              attendance.map((att) => (
                <div key={att.course_id} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        <span className="font-mono text-indigo-600 mr-2">{att.course_code}</span>
                        {att.course_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Classes Attended: {att.present_count} / {att.total_classes} • Late: {att.late_count} • Absent: {att.absent_count}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-black ${att.attendance_percentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {att.attendance_percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${att.attendance_percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, att.attendance_percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">No attendance records logged yet</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Academic Marks */}
      {activeTab === 'marks' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-6">Examination</th>
                <th className="py-3 px-6">Course</th>
                <th className="py-3 px-6 text-center">Score</th>
                <th className="py-3 px-6 text-center">Percentage</th>
                <th className="py-3 px-6 text-center">Grade</th>
                <th className="py-3 px-6 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {marks && marks.length > 0 ? (
                marks.map((m) => {
                  const pct = ((m.marks_obtained / m.maximum_marks) * 100).toFixed(1);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-6 font-bold text-slate-900">{m.exam_name}</td>
                      <td className="py-3.5 px-6">
                        <span className="font-mono font-semibold text-indigo-600">{m.course_code}</span>: {m.course_name}
                      </td>
                      <td className="py-3.5 px-6 text-center font-bold">
                        {parseFloat(m.marks_obtained).toFixed(1)} / {parseFloat(m.maximum_marks).toFixed(0)}
                      </td>
                      <td className="py-3.5 px-6 text-center font-medium">{pct}%</td>
                      <td className="py-3.5 px-6 text-center">
                        <Badge variant={m.grade}>{m.grade}</Badge>
                      </td>
                      <td className="py-3.5 px-6 text-right text-slate-500">{m.exam_date}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No examination marks entered yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Fees & Ledger */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-6">Fee Description</th>
                <th className="py-3 px-6 text-right">Assessed Amount</th>
                <th className="py-3 px-6 text-right">Amount Paid</th>
                <th className="py-3 px-6 text-right">Balance Due</th>
                <th className="py-3 px-6 text-center">Due Date</th>
                <th className="py-3 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {fees && fees.length > 0 ? (
                fees.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{f.fee_type}</td>
                    <td className="py-3.5 px-6 text-right font-medium">{formatINR(f.amount)}</td>
                    <td className="py-3.5 px-6 text-right font-bold text-emerald-600">{formatINR(f.paid_amount || 0)}</td>
                    <td className="py-3.5 px-6 text-right font-bold text-rose-600">{formatINR(f.remaining_amount || 0)}</td>
                    <td className="py-3.5 px-6 text-center text-slate-500">{f.due_date}</td>
                    <td className="py-3.5 px-6 text-center">
                      <Badge variant={f.status}>{f.status}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No fee obligations assigned</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
