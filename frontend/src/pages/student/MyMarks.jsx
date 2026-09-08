import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Calendar, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/Badge';

export default function MyMarks() {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarks();
  }, []);

  const fetchMarks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/marks');
      if (res.data?.success) {
        setMarks(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load marks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Compute aggregate statistics
  const totalScored = marks.reduce((sum, m) => sum + parseFloat(m.marks_obtained || 0), 0);
  const totalMax = marks.reduce((sum, m) => sum + parseFloat(m.maximum_marks || 100), 0);
  const overallAvg = totalMax > 0 ? ((totalScored / totalMax) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Grade Card</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Verified examination results, marks obtained, and official letter grades</p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <span className="text-xs font-bold text-slate-500">Academic Average:</span>
          <span className="text-base font-black text-indigo-600">{overallAvg}%</span>
        </div>
      </div>

      {/* Grade Scale Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Grading Scale:</span>
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">90–100%: A+</span>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">80–89%: A</span>
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">70–79%: B</span>
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">60–69%: C</span>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">50–59%: D</span>
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">&lt;50%: F</span>
        </div>
      </div>

      {/* Transcript Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Examination</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4 text-center">Score Obtained</th>
                <th className="py-3 px-4 text-center">Percentage</th>
                <th className="py-3 px-4 text-center">Official Grade</th>
                <th className="py-3 px-4 text-right">Exam Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Loading academic results...</td>
                </tr>
              ) : marks.length > 0 ? (
                marks.map((m) => {
                  const pct = ((m.marks_obtained / m.maximum_marks) * 100).toFixed(1);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {m.exam_name}
                        <span className="block text-[10px] text-slate-400 uppercase font-semibold">{m.exam_type}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-indigo-600 mr-1.5">{m.course_code}</span>
                        <span className="text-slate-800 font-medium">{m.course_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {parseFloat(m.marks_obtained).toFixed(1)} / {parseFloat(m.maximum_marks).toFixed(0)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                        {pct}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={m.grade}>{m.grade}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium">
                        {m.exam_date}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">No evaluation marks recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
