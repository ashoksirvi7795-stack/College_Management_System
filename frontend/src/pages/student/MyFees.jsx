import React, { useState, useEffect } from 'react';
import { CreditCard, Receipt, Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import Badge from '../../components/Badge';
import ReceiptModal from '../../components/ReceiptModal';
import { formatINR } from '../../utils/format';

export default function MyFees() {
  const [fees, setFees] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const [feeRes, payRes] = await Promise.all([
        api.get('/fees'),
        api.get('/payments')
      ]);
      if (feeRes.data?.success) setFees(feeRes.data.data || []);
      if (payRes.data?.success) setPayments(payRes.data.data || []);
    } catch (err) {
      console.error('Failed to load student fee ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReceipt = async (paymentId) => {
    try {
      const res = await api.get(`/payments/${paymentId}/receipt`);
      if (res.data?.success) {
        setSelectedReceipt(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load receipt:', err);
    }
  };

  const totalAssessed = fees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
  const totalBalanceDue = Math.max(0, totalAssessed - totalPaid);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fee Ledger & Payment Receipts</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Verified student account obligations, payment history, and official downloadable receipts</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Assessed</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{formatINR(totalAssessed)}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Tuition & campus obligations</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Total Amount Paid</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{formatINR(totalPaid)}</p>
          <span className="text-[11px] text-emerald-600/80 mt-1 block">Cleared through verified transactions</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block">Outstanding Balance</span>
          <p className={`text-2xl sm:text-3xl font-black mt-2 ${totalBalanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatINR(totalBalanceDue)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalBalanceDue === 0 ? 'All fees settled' : 'Payment due this semester'}
          </span>
        </div>
      </div>

      {/* Fee Obligations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">Assessed Fees & Balances</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Fee Item Description</th>
                <th className="py-3 px-4 text-right">Total Assessed</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4 text-right">Remaining Due</th>
                <th className="py-3 px-4 text-center">Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fees && fees.length > 0 ? (
                fees.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{f.fee_type}</td>
                    <td className="py-3.5 px-4 text-right font-medium">{formatINR(f.amount)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{formatINR(f.paid_amount || 0)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">{formatINR(f.remaining_amount || 0)}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500 font-medium">{f.due_date}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={f.status}>{f.status}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No fee records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Transactions & Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-4">Payment Transaction Receipts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Fee Applied To</th>
                <th className="py-3 px-4 text-right">Amount Paid</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-right">Official Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments && payments.length > 0 ? (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{p.transaction_id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{p.fee_type}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{formatINR(p.amount_paid)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{p.payment_method}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-medium">{new Date(p.payment_date).toLocaleString()}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewReceipt(p.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No payment receipts logged yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
