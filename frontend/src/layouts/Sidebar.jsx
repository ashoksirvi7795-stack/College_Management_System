import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  Receipt,
  BarChart3,
  UserCog,
  BookMarked,
  UserCheck,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isFaculty, isStudent } = useAuth();

  const adminLinks = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: GraduationCap },
    { name: 'Faculty', path: '/admin/faculty', icon: Users },
    { name: 'Courses', path: '/admin/courses', icon: BookOpen },
    { name: 'Attendance', path: '/admin/attendance', icon: CalendarCheck },
    { name: 'Examinations', path: '/admin/examinations', icon: BookMarked },
    { name: 'Marks & Grades', path: '/admin/marks', icon: Award },
    { name: 'Fee Management', path: '/admin/fees', icon: CreditCard },
    { name: 'Payments', path: '/admin/payments', icon: Receipt },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'User Management', path: '/admin/users', icon: UserCog }
  ];

  const facultyLinks = [
    { name: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
    { name: 'My Courses', path: '/faculty/courses', icon: BookOpen },
    { name: 'My Students', path: '/faculty/students', icon: GraduationCap },
    { name: 'Attendance', path: '/faculty/attendance', icon: CalendarCheck },
    { name: 'Enter Marks', path: '/faculty/marks', icon: Award }
  ];

  const studentLinks = [
    { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
    { name: 'My Profile', path: '/student/profile', icon: UserCheck },
    { name: 'My Courses', path: '/student/courses', icon: BookOpen },
    { name: 'My Attendance', path: '/student/attendance', icon: CalendarCheck },
    { name: 'My Marks', path: '/student/marks', icon: Award },
    { name: 'Fees & Receipts', path: '/student/fees', icon: CreditCard }
  ];

  const currentLinks = isAdmin ? adminLinks : isFaculty ? facultyLinks : studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          {/* Top Branding */}
          <div>
            <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-indigo-600/20">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                    Academia<span className="text-indigo-600">Pro</span>
                  </h1>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    College Portal
                  </span>
                </div>
              </div>

              {/* Close button on mobile */}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-10rem)]">
              <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {isAdmin ? 'Administration' : isFaculty ? 'Faculty Portal' : 'Student Portal'}
              </div>
              {currentLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === '/admin' || link.path === '/faculty' || link.path === '/student'}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600 font-bold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{link.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* User Footer Card */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-3 rounded-2xl border">
            <div className="flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.profile?.first_name ? `${user.profile.first_name} ${user.profile.last_name}` : user?.username}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <Badge variant={user?.role} size="sm">{user?.role}</Badge>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
