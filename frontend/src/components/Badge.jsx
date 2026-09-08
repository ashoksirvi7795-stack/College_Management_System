import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  };

  const getVariantClasses = (val) => {
    if (!val) return 'bg-slate-100 text-slate-700 border-slate-200';
    const normalized = String(val).toUpperCase();

    switch (normalized) {
      // Roles
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'FACULTY':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'STUDENT':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';

      // Fee & Payment statuses
      case 'PAID':
      case 'SUCCESS':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'PARTIAL':
        return 'bg-amber-100 text-amber-700 border-amber-200';

      // Attendance statuses
      case 'PRESENT':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'ABSENT':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'LATE':
        return 'bg-amber-100 text-amber-700 border-amber-200';

      // Academic Grades
      case 'A+':
      case 'A':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'D':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'F':
        return 'bg-rose-100 text-rose-800 border-rose-300';

      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const badgeClass = variant !== 'default' ? getVariantClasses(variant) : getVariantClasses(children);

  return (
    <span className={`inline-flex items-center rounded-full border shadow-sm ${sizeClasses[size]} ${badgeClass}`}>
      {children}
    </span>
  );
}
