import React from 'react';
import { Printer, CheckCircle, GraduationCap } from 'lucide-react';
import Modal from './Modal';
import Badge from './Badge';
import { formatINR, formatDateIN } from '../utils/format';

export default function ReceiptModal({ isOpen, onClose, receipt }) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receipt.payment_date
    ? new Date(receipt.payment_date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('en-IN');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Fee Payment Receipt">
      <div className="space-y-6">
        {/* Printable Area */}
        <div id="printable-receipt" className="border border-slate-200 rounded-2xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">ACADEMIA PRO COLLEGE</h2>
                <p className="text-xs text-slate-500 font-medium">Affiliated Technological University & Research Institute</p>
                <p className="text-xs text-slate-400">Institutional Area, Outer Ring Road, Bengaluru, Karnataka 560103</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Official Receipt
              </span>
              <p className="text-xs font-mono text-slate-500 mt-2 font-semibold">
                TXN: {receipt.transaction_id}
              </p>
            </div>
          </div>

          {/* Student & Payment Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-100">
            <div>
              <p className="text-slate-400 uppercase font-semibold">Student Name</p>
              <p className="text-slate-800 font-bold text-sm mt-0.5">{receipt.first_name} {receipt.last_name}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold">Roll Number</p>
              <p className="text-slate-800 font-bold text-sm mt-0.5">{receipt.roll_number}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold">Department</p>
              <p className="text-slate-800 font-semibold mt-0.5">{receipt.department}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold">Semester</p>
              <p className="text-slate-800 font-semibold mt-0.5">Semester {receipt.semester}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold">Payment Date</p>
              <p className="text-slate-800 font-semibold mt-0.5">{formattedDate}</p>
            </div>
            <div>
              <p className="text-slate-400 uppercase font-semibold">Payment Method</p>
              <p className="text-slate-800 font-semibold mt-0.5">{receipt.payment_method}</p>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Fee Item / Description</th>
                  <th className="py-2.5 px-4 text-right">Total Assessed</th>
                  <th className="py-2.5 px-4 text-right">Amount Paid</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {receipt.fee_type}
                    <span className="block text-[11px] text-slate-400 font-normal">Academic Session 2025-2026</span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatINR(receipt.total_fee_amount || 0)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">
                    {formatINR(receipt.amount_paid || 0)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={receipt.fee_status}>{receipt.fee_status || 'SUCCESS'}</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Balance & Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-2 gap-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Verified Electronic Transaction
            </div>

            <div className="w-full sm:w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Total Amount Paid (Cumulative):</span>
                <span className="font-semibold text-slate-800">{formatINR(receipt.total_paid_so_far || receipt.amount_paid)}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-bold border-t border-slate-100 pt-1.5 text-sm">
                <span>Balance Remaining:</span>
                <span className={`${parseFloat(receipt.balance_remaining || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {formatINR(receipt.balance_remaining || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-4 text-center">
            This is a computer-generated official receipt. No physical signature is required. Keep for records.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 no-print pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print / Save Receipt
          </button>
        </div>
      </div>
    </Modal>
  );
}
