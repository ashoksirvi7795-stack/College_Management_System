import React, { useState, useEffect } from 'react';
import { BookOpen, User, Award, Calendar } from 'lucide-react';
import api from '../../services/api';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard');
      if (res.data?.success) {
        setCourses(res.data.enrolledCourses || []);
      }
    } catch (err) {
      console.error('Failed to load enrolled courses:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Enrolled Courses</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Curriculum and subjects registered for your current academic session</p>
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
                  {c.description || 'No course syllabus notes attached.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Prof. {c.faculty_first_name ? `${c.faculty_first_name} ${c.faculty_last_name}` : 'TBA'}
                </span>
                <span className="text-slate-400 font-medium">Active Enrollment</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 py-12 text-center col-span-2">You are not currently enrolled in any courses</p>
        )}
      </div>
    </div>
  );
}
