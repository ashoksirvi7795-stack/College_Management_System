import React, { useState, useEffect } from 'react';
import { BarChart3, Printer, Download, Filter, FileSpreadsheet, Users, GraduationCap, CalendarCheck, Award, CreditCard, BookOpen } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/Badge';
import { formatINR } from '../../utils/format';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('students');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Filters
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    loadReport();
  }, [activeTab, selectedDept, selectedSemester]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data?.success) setDepartments(res.data.data);
    } catch (e) {}
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${activeTab}`, {
        params: {
          department: selectedDept,
          semester: selectedSemester
        }
      });
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Analytical Reports</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Aggregated database intelligence and institutional records</p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <Printer className="w-4 h-4" />
          Print / Export Report
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-print">
        {[
          { id: 'students', label: 'Student Report', icon: GraduationCap },
          { id: 'faculty', label: 'Faculty Workload', icon: Users },
          { id: 'attendance', label: 'Attendance Rates', icon: CalendarCheck },
          { id: 'marks', label: 'Academic Performance', icon: Award },
          { id: 'fees', label: 'Fee Collection', icon: CreditCard },
          { id: 'courses', label: 'Course Catalog', icon: BookOpen }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-wrap items-center gap-3 no-print">
        <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </span>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-slate-700"
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d.id} value={d.department_name}>{d.department_name}</option>
          ))}
        </select>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-medium text-slate-700"
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      {/* Report Table Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        <div className="mb-4 border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 capitalize">{activeTab} Analytical Report</h2>
          <span className="text-xs font-mono text-slate-400">Total Records: {data.length}</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
              Computing report aggregates from database...
            </div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matching records found for this report criteria
            </div>
          ) : activeTab === 'students' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Semester</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right">Total Fees</th>
                  <th className="py-3 px-4 text-right">Pending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{s.roll_number}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.first_name} {s.last_name}</td>
                    <td className="py-3 px-4 text-slate-600">{s.department}</td>
                    <td className="py-3 px-4 text-center">Sem {s.semester}</td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`${s.attendance_percentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {s.attendance_percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(s.total_fees || 0)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      {formatINR(s.pending_fees || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'faculty' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4 text-center">Assigned Courses</th>
                  <th className="py-3 px-4 text-center">Total Credits</th>
                  <th className="py-3 px-4 text-center">Students Taught</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{f.employee_id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{f.first_name} {f.last_name}</td>
                    <td className="py-3 px-4 text-slate-600">{f.department}</td>
                    <td className="py-3 px-4 text-slate-600">{f.designation}</td>
                    <td className="py-3 px-4 text-center font-bold">{f.assigned_courses_count}</td>
                    <td className="py-3 px-4 text-center font-bold">{f.total_credits}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-600">{f.total_students_taught}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'attendance' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Course Code</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Total Classes</th>
                  <th className="py-3 px-4 text-center">Present Marks</th>
                  <th className="py-3 px-4 text-center">Late Marks</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(a => (
                  <tr key={a.course_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{a.course_code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{a.course_name}</td>
                    <td className="py-3 px-4 text-slate-600">{a.department}</td>
                    <td className="py-3 px-4 text-center">{a.total_records}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">{a.present_count}</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">{a.late_count}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-black ${a.attendance_percentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {a.attendance_percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'marks' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Examination</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4 text-center">Appeared</th>
                  <th className="py-3 px-4 text-center">Average Marks</th>
                  <th className="py-3 px-4 text-center">Highest / Lowest</th>
                  <th className="py-3 px-4 text-center">Passed / Failed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(m => (
                  <tr key={m.examination_id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.exam_name}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-indigo-600 mr-1">{m.course_code}</span>: {m.course_name}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">{m.total_students_appeared}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-600">{m.average_marks}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      {m.highest_marks || 0} / {m.lowest_marks || 0}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-emerald-600 font-bold">{m.passed_count || 0} passed</span> •{' '}
                      <span className="text-rose-600 font-bold">{m.failed_count || 0} failed</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : activeTab === 'fees' ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Fee Category</th>
                  <th className="py-3 px-4 text-center">Invoices</th>
                  <th className="py-3 px-4 text-right">Total Assessed</th>
                  <th className="py-3 px-4 text-right">Total Collected</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-center">Breakdown (Paid / Part / Pend)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{f.fee_type}</td>
                    <td className="py-3 px-4 text-center font-semibold">{f.total_invoices}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatINR(f.total_billed)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatINR(f.total_collected)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">{formatINR(f.total_outstanding)}</td>
                    <td className="py-3 px-4 text-center font-mono">
                      {f.paid_count} / {f.partial_count} / {f.pending_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Course Code</th>
                  <th className="py-3 px-4">Course Title</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4">Assigned Instructor</th>
                  <th className="py-3 px-4 text-center">Enrolled Students</th>
                  <th className="py-3 px-4 text-center">Exams Scheduled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{c.course_code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{c.course_name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.department}</td>
                    <td className="py-3 px-4 text-center">{c.credits}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {c.faculty_first_name ? `Prof. ${c.faculty_first_name} ${c.faculty_last_name}` : 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-600">{c.enrolled_students}</td>
                    <td className="py-3 px-4 text-center font-bold">{c.examinations_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
