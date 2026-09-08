import React, { useState, useEffect } from 'react';
import { CalendarCheck, Check, Clock, X, Save, Sparkles, Filter } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/Badge';

export default function AttendanceManagement() {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // student_id -> 'PRESENT' | 'ABSENT' | 'LATE'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId && selectedDate) {
      loadCourseAttendance();
    }
  }, [selectedCourseId, selectedDate]);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses?limit=100');
      if (res.data?.success && res.data.data.length > 0) {
        setCourses(res.data.data);
        setSelectedCourseId(res.data.data[0].id);
      }
    } catch (e) {}
  };

  const loadCourseAttendance = async () => {
    try {
      setLoading(true);
      setNotification('');

      // 1. Fetch course details to get enrolled students
      const courseRes = await api.get(`/courses/${selectedCourseId}`);
      const enrolled = courseRes.data?.data?.students || [];

      // 2. Fetch existing attendance for this course & date
      const attRes = await api.get('/attendance', {
        params: {
          course_id: selectedCourseId,
          date: selectedDate
        }
      });
      const existingRecords = attRes.data?.data || [];

      // 3. Fetch cumulative attendance percentages for these students
      const summaryRes = await api.get('/attendance/summary', {
        params: { course_id: selectedCourseId }
      });
      const summaries = summaryRes.data?.data || [];
      const summaryMap = new Map();
      summaries.forEach(s => summaryMap.set(s.student_id, s.attendance_percentage));

      // Build students with attached percentages
      const studentsWithStats = enrolled.map(s => ({
        ...s,
        cumulativePercentage: summaryMap.get(s.id) || 0
      }));
      setStudents(studentsWithStats);

      // Build initial map: default to existing record or 'PRESENT'
      const initialMap = {};
      const recordByStudent = new Map();
      existingRecords.forEach(r => recordByStudent.set(r.student_id, r.status));

      studentsWithStats.forEach(s => {
        initialMap[s.id] = recordByStudent.get(s.id) || 'PRESENT';
      });

      setAttendanceMap(initialMap);
    } catch (err) {
      console.error('Failed to load course attendance sheet:', err);
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (studentId, status) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      setNotification('');

      const records = students.map(s => ({
        student_id: s.id,
        status: attendanceMap[s.id] || 'PRESENT'
      }));

      const res = await api.post('/attendance', {
        course_id: selectedCourseId,
        date: selectedDate,
        records
      });

      if (res.data?.success) {
        setNotification('Attendance successfully saved and verified!');
        setTimeout(() => setNotification(''), 4000);
        // Refresh summary
        loadCourseAttendance();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Stats for the active sheet
  const currentPresent = Object.values(attendanceMap).filter(v => v === 'PRESENT').length;
  const currentLate = Object.values(attendanceMap).filter(v => v === 'LATE').length;
  const currentAbsent = Object.values(attendanceMap).filter(v => v === 'ABSENT').length;
  const totalInSheet = students.length;
  const todayRate = totalInSheet > 0 ? ((currentPresent / totalInSheet) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Roll Call</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Daily attendance tracking with automated cumulative percentages</p>
        </div>

        <button
          onClick={handleSaveAttendance}
          disabled={saving || students.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {notification}
        </div>
      )}

      {/* Selector Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none bg-slate-50"
          >
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.course_code}: {c.course_name} ({c.department})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Attendance Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none bg-slate-50"
          />
        </div>

        <div className="flex items-center sm:justify-end gap-2 pt-4 sm:pt-0">
          <button
            type="button"
            onClick={() => handleMarkAll('PRESENT')}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> All Present
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll('ABSENT')}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" /> All Absent
          </button>
        </div>
      </div>

      {/* Attendance Summary Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] font-bold uppercase">Enrolled</span>
            <span className="text-xl font-black text-white">{totalInSheet}</span>
          </div>
          <div>
            <span className="text-emerald-400 block text-[11px] font-bold uppercase">Present</span>
            <span className="text-xl font-black text-emerald-400">{currentPresent}</span>
          </div>
          <div>
            <span className="text-amber-400 block text-[11px] font-bold uppercase">Late</span>
            <span className="text-xl font-black text-amber-400">{currentLate}</span>
          </div>
          <div>
            <span className="text-rose-400 block text-[11px] font-bold uppercase">Absent</span>
            <span className="text-xl font-black text-rose-400">{currentAbsent}</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-400">Class Attendance Rate:</span>
          <span className="text-xl font-black text-indigo-400 ml-2">{todayRate}%</span>
        </div>
      </div>

      {/* Attendance Sheet Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-6">Roll Number</th>
              <th className="py-3 px-6">Student Name</th>
              <th className="py-3 px-6 text-center">Cumulative Attendance</th>
              <th className="py-3 px-6 text-center">Status for {selectedDate}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">Loading student roster...</td>
              </tr>
            ) : students.length > 0 ? (
              students.map((student) => {
                const currentStatus = attendanceMap[student.id] || 'PRESENT';
                return (
                  <tr key={student.id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-mono font-bold text-indigo-600">{student.roll_number}</td>
                    <td className="py-3 px-6">
                      <p className="font-bold text-slate-900">{student.first_name} {student.last_name}</p>
                      <p className="text-[11px] text-slate-400">{student.department}</p>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className={`font-bold px-2.5 py-1 rounded-full ${student.cumulativePercentage >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {student.cumulativePercentage}%
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200 gap-1">
                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'PRESENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'LATE')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'LATE'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'ABSENT')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'ABSENT'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  No students are enrolled in this course yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
