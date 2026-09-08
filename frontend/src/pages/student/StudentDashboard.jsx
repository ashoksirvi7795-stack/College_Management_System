import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CalendarCheck, Award, CreditCard, Clock, ArrowRight, UserCheck } from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';
import { formatINR } from '../../utils/format';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.data?.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { stats, student, enrolledCourses, attendanceByCourse, marks, upcomingExams } = data || {};

  return (
    <div className="space-y-8">
      {/* Student Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Hello, {student?.first_name} {student?.last_name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {student?.department} • Year {student?.year}, Semester {student?.semester} • Roll: <span className="font-mono font-bold text-indigo-600">{student?.roll_number}</span>
          </p>
        </div>

        <button
          onClick={() => navigate('/student/profile')}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all border border-indigo-100 self-start sm:self-auto"
        >
          <UserCheck className="w-4 h-4" /> View Full Profile
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Overall Attendance"
          value={`${stats?.overallAttendance || 0}%`}
          subtitle="Requirement: 75% min"
          icon={CalendarCheck}
          color={stats?.overallAttendance >= 75 ? 'emerald' : 'amber'}
        />
        <StatCard
          title="Enrolled Courses"
          value={stats?.enrolledCoursesCount || 0}
          subtitle="Spring 2026 Semester"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Outstanding Fees"
          value={formatINR(stats?.pendingFees || 0)}
          subtitle={parseFloat(stats?.pendingFees || 0) === 0 ? 'All fees cleared' : 'Due this term'}
          icon={CreditCard}
          color={parseFloat(stats?.pendingFees || 0) === 0 ? 'emerald' : 'rose'}
        />
        <StatCard
          title="Evaluated Exams"
          value={stats?.marksCount || 0}
          subtitle="Academic scores posted"
          icon={Award}
          color="purple"
        />
      </div>

      {/* Dual Section: Attendance Progress & Upcoming Exams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course-wise Attendance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Attendance by Course</h2>
            <button
              onClick={() => navigate('/student/attendance')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {attendanceByCourse && attendanceByCourse.length > 0 ? (
              attendanceByCourse.map((c, i) => {
                const total = parseInt(c.total_classes, 10) || 0;
                const present = parseInt(c.present_count, 10) || 0;
                const pct = total > 0 ? ((present / total) * 100).toFixed(0) : 0;
                return (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-indigo-600 mr-2">{c.course_code}</span>
                        <span className="font-bold text-slate-800">{c.course_name}</span>
                      </div>
                      <span className={`font-black ${pct >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {pct}% ({present}/{total})
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No attendance recorded yet</p>
            )}
          </div>
        </div>

        {/* Upcoming Exams */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Upcoming Examinations</h2>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingExams && upcomingExams.length > 0 ? (
              upcomingExams.map((e) => (
                <div key={e.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{e.exam_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-indigo-600 font-semibold">{e.course_code}</span>: {e.course_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {e.exam_date}
                    </span>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">{e.exam_type}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No examinations scheduled yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Academic Marks */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Academic Results</h2>
          <button
            onClick={() => navigate('/student/marks')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Full Grade Card <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">Examination</th>
                <th className="py-2.5 px-4">Course</th>
                <th className="py-2.5 px-4 text-center">Score</th>
                <th className="py-2.5 px-4 text-center">Grade</th>
                <th className="py-2.5 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marks && marks.length > 0 ? (
                marks.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.exam_name}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-600 mr-1">{m.course_code}</span>: {m.course_name}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {parseFloat(m.marks_obtained).toFixed(1)} / {parseFloat(m.maximum_marks).toFixed(0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={m.grade}>{m.grade}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">{m.exam_date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">No grades posted yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
