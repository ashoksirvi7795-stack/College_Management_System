import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, Save, Check, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/Badge';

export default function MarksManagement() {
  const [searchParams] = useSearchParams();
  const defaultExamId = searchParams.get('exam_id');

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(defaultExamId || '');
  const [examDetails, setExamDetails] = useState(null);
  const [students, setStudents] = useState([]);
  const [marksMap, setMarksMap] = useState({}); // student_id -> { marks_obtained, maximum_marks }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadExamStudents();
    }
  }, [selectedExamId]);

  const fetchExams = async () => {
    try {
      const res = await api.get('/examinations');
      if (res.data?.success && res.data.data.length > 0) {
        setExams(res.data.data);
        if (!selectedExamId) {
          setSelectedExamId(defaultExamId || res.data.data[0].id);
        }
      }
    } catch (e) {}
  };

  const loadExamStudents = async () => {
    try {
      setLoading(true);
      setError('');
      setNotification('');

      const res = await api.get(`/examinations/${selectedExamId}`);
      if (res.data?.success) {
        setExamDetails(res.data.data.examination);
        const studentList = res.data.data.students || [];
        setStudents(studentList);

        const initialMarks = {};
        studentList.forEach(s => {
          initialMarks[s.student_id] = {
            marks_obtained: s.marks_obtained !== null ? s.marks_obtained : '',
            maximum_marks: s.maximum_marks || 100
          };
        });
        setMarksMap(initialMarks);
      }
    } catch (err) {
      console.error('Failed to load exam marks roster:', err);
      setError('Failed to load students for this examination');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    setMarksMap(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const getPreviewGrade = (obtained, max = 100) => {
    if (obtained === '' || obtained === null || isNaN(obtained)) return '-';
    const num = parseFloat(obtained);
    const maxNum = parseFloat(max) || 100;
    if (num > maxNum || num < 0) return 'Invalid';
    const pct = (num / maxNum) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  };

  const handleSaveMarks = async () => {
    try {
      setSaving(true);
      setError('');
      setNotification('');

      const records = [];
      for (const s of students) {
        const entry = marksMap[s.student_id];
        if (entry && entry.marks_obtained !== '') {
          const obtained = parseFloat(entry.marks_obtained);
          const max = parseFloat(entry.maximum_marks || 100);

          if (obtained > max) {
            setError(`Student ${s.roll_number}: Marks (${obtained}) cannot exceed maximum marks (${max})`);
            setSaving(false);
            return;
          }

          records.push({
            student_id: s.student_id,
            marks_obtained: obtained,
            maximum_marks: max
          });
        }
      }

      if (records.length === 0) {
        setError('Please enter marks for at least one student');
        setSaving(false);
        return;
      }

      const res = await api.post('/marks', {
        examination_id: selectedExamId,
        records
      });

      if (res.data?.success) {
        setNotification('Marks and backend-verified grades saved successfully!');
        setTimeout(() => setNotification(''), 4000);
        loadExamStudents();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Examination Marks & Grading</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Record examination scores with automated backend grade calculation</p>
        </div>

        <button
          onClick={handleSaveMarks}
          disabled={saving || students.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save & Compute Grades'}
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          {notification}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          {error}
        </div>
      )}

      {/* Exam Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Select Examination</label>
        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none bg-slate-50"
        >
          {exams.map(e => (
            <option key={e.id} value={e.id}>
              {e.exam_name} ({e.course_code}: {e.course_name}) • {e.exam_date}
            </option>
          ))}
        </select>
      </div>

      {/* Grade Scale Reference Card */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">Institutional Grade Key:</span>
        <div className="flex flex-wrap items-center gap-2 font-mono">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">90–100%: A+</span>
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">80–89%: A</span>
          <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">70–79%: B</span>
          <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">60–69%: C</span>
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">50–59%: D</span>
          <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">&lt;50%: F</span>
        </div>
      </div>

      {/* Student Marks Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-6">Roll Number</th>
              <th className="py-3 px-6">Student Name</th>
              <th className="py-3 px-6 text-center">Marks Obtained</th>
              <th className="py-3 px-6 text-center">Maximum Marks</th>
              <th className="py-3 px-6 text-center">Grade Preview</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">Loading student roster...</td>
              </tr>
            ) : students.length > 0 ? (
              students.map((s) => {
                const currentObtained = marksMap[s.student_id]?.marks_obtained ?? '';
                const currentMax = marksMap[s.student_id]?.maximum_marks ?? 100;
                const previewGrade = getPreviewGrade(currentObtained, currentMax);

                return (
                  <tr key={s.student_id} className="hover:bg-slate-50">
                    <td className="py-3 px-6 font-mono font-bold text-indigo-600">{s.roll_number}</td>
                    <td className="py-3 px-6 font-bold text-slate-900">{s.first_name} {s.last_name}</td>
                    <td className="py-3 px-6 text-center">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max={currentMax}
                        placeholder="0.0"
                        value={currentObtained}
                        onChange={(e) => handleMarkChange(s.student_id, 'marks_obtained', e.target.value)}
                        className="w-24 px-2.5 py-1.5 text-center font-bold text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                      />
                    </td>
                    <td className="py-3 px-6 text-center font-semibold text-slate-500">
                      / {currentMax}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {previewGrade !== '-' && previewGrade !== 'Invalid' ? (
                        <Badge variant={previewGrade}>{previewGrade}</Badge>
                      ) : (
                        <span className="text-slate-400 font-mono text-xs">{previewGrade}</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No enrolled students found for this examination course
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
