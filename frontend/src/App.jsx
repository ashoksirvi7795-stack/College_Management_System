import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Login from './pages/auth/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import StudentDetails from './pages/admin/StudentDetails';
import FacultyManagement from './pages/admin/FacultyManagement';
import CourseManagement from './pages/admin/CourseManagement';
import AttendanceManagement from './pages/admin/AttendanceManagement';
import Examinations from './pages/admin/Examinations';
import MarksManagement from './pages/admin/MarksManagement';
import FeeManagement from './pages/admin/FeeManagement';
import Payments from './pages/admin/Payments';
import Reports from './pages/admin/Reports';
import UserManagement from './pages/admin/UserManagement';

// Faculty Pages
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import MyCourses from './pages/faculty/MyCourses';
import MyStudents from './pages/faculty/MyStudents';
import FacultyAttendance from './pages/faculty/FacultyAttendance';
import FacultyMarks from './pages/faculty/FacultyMarks';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import MyProfile from './pages/student/MyProfile';
import StudentCourses from './pages/student/MyCourses';
import MyAttendance from './pages/student/MyAttendance';
import MyMarks from './pages/student/MyMarks';
import MyFees from './pages/student/MyFees';

/**
 * Route guard ensuring authentication and role matching
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
        Verifying session credentials...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect to user's permitted dashboard
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'FACULTY') return <Navigate to="/faculty" replace />;
    if (user?.role === 'STUDENT') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Root redirect based on role
 */
function RootRedirect() {
  const { user, isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  if (user?.role === 'FACULTY') return <Navigate to="/faculty" replace />;
  return <Navigate to="/student" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="students/:id" element={<StudentDetails />} />
            <Route path="faculty" element={<FacultyManagement />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="attendance" element={<AttendanceManagement />} />
            <Route path="examinations" element={<Examinations />} />
            <Route path="marks" element={<MarksManagement />} />
            <Route path="fees" element={<FeeManagement />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          {/* Faculty Protected Routes */}
          <Route
            path="/faculty"
            element={
              <ProtectedRoute allowedRoles={['FACULTY']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<FacultyDashboard />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="students" element={<MyStudents />} />
            <Route path="attendance" element={<FacultyAttendance />} />
            <Route path="marks" element={<FacultyMarks />} />
          </Route>

          {/* Student Protected Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="courses" element={<StudentCourses />} />
            <Route path="attendance" element={<MyAttendance />} />
            <Route path="marks" element={<MyMarks />} />
            <Route path="fees" element={<MyFees />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
