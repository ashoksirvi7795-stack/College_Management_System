import React, { useState, useEffect } from 'react';
import { CalendarCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/Badge';

export default function MyAttendance() {
  const [summaries, setSummaries] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [sumRes, logRes] = await Promise.all([
        api.get('/attendance/summary'),
        api.get('/attendance')
      ]);
      if (sumRes.data?.success) setSummaries(sumRes.data.data || []);
      if (logRes.data?.success) setLogs(logRes.data.data || []);
    } catch (err) {
      console.error('Failed to load student attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalClassesAll = summaries.reduce((s, c) => s + (parseInt(c.total_classes, 10) || 0), 0);
  const totalPresentAll = summaries.reduce((s, c) => s + (parseInt(c.present_count, 10) || 0), 0);
  const overallPercentage = totalClassesAll > 0 ? Number(((totalPresentAll / totalClassesAll) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Attendance Performance</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Detailed subject-wise breakdown and historical session verification</p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-500">Cumulative Rate:</span>
          <span className={`text-base font-black ${overallPercentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {overallPercentage}%
          </span>
        </div>
      </div>

      {/* Subject Wise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-36 bg-slate-200 rounded-2xl animate-pulse" />
          ))
        ) : summaries.length > 0 ? (
          summaries.map((s) => (
            <div key={s.course_id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {s.course_code}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{s.course_name}</h3>
                </div>
                <span className={`text-lg font-black ${s.attendance_percentage >= 75 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {s.attendance_percentage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.attendance_percentage >= 75 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, s.attendance_percentage)}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total</span>
                  <span className="font-bold text-slate-700">{s.total_classes}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase block">Present</span>
                  <span className="font-bold text-emerald-600">{s.present_count}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-600 font-bold uppercase block">Late</span>
                  <span className="font-bold text-amber-600">{s.late_count}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 font-bold uppercase block">Absent</span>
                  <span className="font-bold text-rose-600">{s.absent_count}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400 py-12 text-center col-span-2">No attendance statistics recorded yet</p>
        )}
      </div>

      {/* Historical Daily Log */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">Historical Roll Call Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Course Code</th>
                <th className="py-2.5 px-4">Course Title</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs && logs.length > 0 ? (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-700">{l.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{l.course_code}</td>
                    <td className="py-3 px-4 text-slate-900 font-medium">{l.course_name}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={l.status}>{l.status}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">No session attendance logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
