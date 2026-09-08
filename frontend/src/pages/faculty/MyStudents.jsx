import React, { useState, useEffect } from 'react';
import { GraduationCap, Search, Mail, BookOpen } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';

export default function MyStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMyStudents();
  }, []);

  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      // Fetch faculty courses, then extract enrolled students
      const res = await api.get('/dashboard');
      if (res.data?.success) {
        const myCourses = res.data.courses || [];
        const studentMap = new Map();

        for (const c of myCourses) {
          try {
            const courseDetail = await api.get(`/courses/${c.id}`);
            const enrolled = courseDetail.data?.data?.students || [];
            enrolled.forEach(s => {
              if (!studentMap.has(s.id)) {
                studentMap.set(s.id, {
                  ...s,
                  enrolledCourseNames: [c.course_code]
                });
              } else {
                const existing = studentMap.get(s.id);
                if (!existing.enrolledCourseNames.includes(c.course_code)) {
                  existing.enrolledCourseNames.push(c.course_code);
                }
              }
            });
          } catch (e) {}
        }

        setStudents(Array.from(studentMap.values()));
      }
    } catch (err) {
      console.error('Failed to load faculty students roster:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.roll_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: 'Roll Number',
      accessor: 'roll_number',
      cellClassName: 'font-mono font-bold text-indigo-600'
    },
    {
      header: 'Student Name',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.first_name} {row.last_name}</p>
          <p className="text-xs text-slate-400">{row.email}</p>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      cellClassName: 'text-slate-600 font-medium'
    },
    {
      header: 'Level',
      render: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          Semester {row.semester}
        </span>
      )
    },
    {
      header: 'Enrolled Courses With You',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.enrolledCourseNames?.map((c, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 font-mono font-bold text-indigo-700 text-xs">
              {c}
            </span>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Students Roster</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Students currently enrolled in the courses you instruct</p>
      </div>

      <DataTable
        columns={columns}
        data={filteredStudents}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search enrolled students..."
      />
    </div>
  );
}
