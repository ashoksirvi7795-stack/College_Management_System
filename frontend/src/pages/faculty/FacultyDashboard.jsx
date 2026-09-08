import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, BookMarked, CalendarCheck, Award, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';

export default function FacultyDashboard() {
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
      console.error('Failed to load faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const { stats, faculty, courses, upcomingExams, recentAttendance } = data || {};

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome back, Prof. {faculty?.first_name} {faculty?.last_name}
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {faculty?.designation} • {faculty?.department} • Employee ID: <span className="font-mono font-bold text-indigo-600">{faculty?.employee_id}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/faculty/attendance')}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
          >
            <CalendarCheck className="w-4 h-4" />
            Mark Attendance
          </button>
          <button
            onClick={() => navigate('/faculty/marks')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
          >
            <Award className="w-4 h-4" />
            Enter Marks
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Assigned Courses"
          value={stats?.assignedCoursesCount || 0}
          subtitle="Courses currently instructing"
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="Total Students Taught"
          value={stats?.totalStudentsTaught || 0}
          subtitle="Enrolled active learners"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Scheduled Exams"
          value={stats?.upcomingExamsCount || 0}
          subtitle="Assessments pending evaluation"
          icon={BookMarked}
          color="purple"
        />
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">My Active Courses</h2>
          <button
            onClick={() => navigate('/faculty/courses')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View All Courses <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses && courses.length > 0 ? (
            courses.map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {c.course_code}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{c.credits} Credits</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mt-2">{c.course_name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{c.description || 'No description'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    <Users className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                    {c.enrolled_students || 0} Enrolled
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/faculty/attendance?course_id=${c.id}`)}
                      className="text-[11px] font-bold text-indigo-600 hover:underline"
                    >
                      Attendance
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => navigate(`/faculty/marks?course_id=${c.id}`)}
                      className="text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      Marks
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center col-span-2">No courses assigned to your profile yet</p>
          )}
        </div>
      </div>

      {/* Dual Section: Upcoming Exams & Recent Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Exams */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Upcoming Course Exams</h2>
            <BookMarked className="w-5 h-5 text-slate-400" />
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
              <p className="py-6 text-center text-xs text-slate-400">No scheduled exams for your courses</p>
            )}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Attendance Sessions</h2>
            <CalendarCheck className="w-5 h-5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100">
            {recentAttendance && recentAttendance.length > 0 ? (
              recentAttendance.map((a, i) => (
                <div key={i} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      <span className="font-mono text-indigo-600 font-semibold mr-1">{a.course_code}</span>
                      {a.course_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Logged on: {a.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600">
                      {a.present_count} / {a.total_students} Present
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {((a.present_count / a.total_students) * 100).toFixed(0)}% attendance
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-slate-400">No attendance records logged recently</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
