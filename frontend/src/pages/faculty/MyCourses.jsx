import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, CalendarCheck, Award, Eye } from 'lucide-react';
import api from '../../services/api';
import Modal from '../../components/Modal';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [isRosterOpen, setIsRosterOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.data?.success) {
        setCourses(res.data.courses || []);
      }
    } catch (err) {
      console.error('Failed to load assigned courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRoster = async (course) => {
    setSelectedCourse(course);
    try {
      const res = await api.get(`/courses/${course.id}`);
      if (res.data?.success) {
        setEnrolledStudents(res.data.data.students || []);
      }
    } catch (e) {}
    setIsRosterOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Assigned Courses</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Courses under your instructional management for the current academic session</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse" />
          ))
        ) : courses.length > 0 ? (
          courses.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                    {c.course_code}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Semester {c.semester} • {c.credits} Credits
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-3">{c.course_name}</h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-3 leading-relaxed">
                  {c.description || 'No detailed syllabus notes attached to this course.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenRoster(c)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  <Users className="w-4 h-4 text-slate-400" />
                  {c.enrolled_students || 0} Enrolled Students
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/faculty/attendance?course_id=${c.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" /> Attendance
                  </button>
                  <button
                    onClick={() => navigate(`/faculty/marks?course_id=${c.id}`)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors"
                  >
                    <Award className="w-3.5 h-3.5" /> Marks
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 py-12 text-center col-span-2">No courses currently assigned to your account</p>
        )}
      </div>

      {/* Student Roster Modal */}
      <Modal
        isOpen={isRosterOpen}
        onClose={() => setIsRosterOpen(false)}
        title={`Class Roster: ${selectedCourse?.course_code}`}
        subtitle={selectedCourse?.course_name}
        size="lg"
      >
        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Roll Number</th>
                <th className="py-2.5 px-4">Student Name</th>
                <th className="py-2.5 px-4">Email</th>
                <th className="py-2.5 px-4">Semester</th>
                <th className="py-2.5 px-4 text-right">Enrolled Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enrolledStudents.length > 0 ? (
                enrolledStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">{s.roll_number}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{s.first_name} {s.last_name}</td>
                    <td className="py-2.5 px-4 text-slate-500">{s.email}</td>
                    <td className="py-2.5 px-4 text-slate-600">Semester {s.semester}</td>
                    <td className="py-2.5 px-4 text-right text-slate-400">{s.enrollment_date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No students enrolled yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}
