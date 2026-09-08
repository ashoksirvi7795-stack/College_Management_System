import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Receipt, IndianRupee, Eye } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import ReceiptModal from '../../components/ReceiptModal';
import { formatINR } from '../../utils/format';

export default function FeeManagement() {
  const [fees, setFees] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const [createFormData, setCreateFormData] = useState({
    student_id: '',
    fee_type: 'Tuition Fee - Semester 4',
    amount: '',
    due_date: new Date().toISOString().split('T')[0]
  });

  const [payFormData, setPayFormData] = useState({
    amount_paid: '',
    payment_method: 'Net Banking'
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchFees(pagination.page);
  }, [statusFilter, pagination.page]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students?limit=200');
      if (res.data?.success) setAllStudents(res.data.data);
    } catch (e) {}
  };

  const fetchFees = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/fees', {
        params: {
          page,
          limit: 10,
          status: statusFilter
        }
      });
      if (res.data?.success) {
        setFees(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch fees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCreateFormData({
      student_id: allStudents[0]?.id || '',
      fee_type: 'Tuition Fee - Semester 4',
      amount: '3500.00',
      due_date: new Date().toISOString().split('T')[0]
    });
    setFormError('');
    setIsCreateOpen(true);
  };

  const handleOpenPay = (fee) => {
    setSelectedFee(fee);
    setPayFormData({
      amount_paid: parseFloat(fee.remaining_amount || 0).toFixed(2),
      payment_method: 'Net Banking'
    });
    setFormError('');
    setIsPayOpen(true);
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.post('/fees', createFormData);
      if (res.data?.success) {
        setIsCreateOpen(false);
        fetchFees(1);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create fee obligation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setFormError('');
      const res = await api.post('/payments', {
        fee_id: selectedFee.id,
        amount_paid: payFormData.amount_paid,
        payment_method: payFormData.payment_method
      });
      if (res.data?.success) {
        setIsPayOpen(false);
        setReceiptData(res.data.data);
        fetchFees(pagination.page);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Student',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.first_name} {row.last_name}</p>
          <span className="font-mono text-xs text-indigo-600 font-bold">{row.roll_number}</span>
        </div>
      )
    },
    {
      header: 'Fee Type',
      accessor: 'fee_type',
      cellClassName: 'font-semibold text-slate-800'
    },
    {
      header: 'Total Assessed',
      render: (row) => (
        <span className="font-bold text-slate-800">{formatINR(row.amount)}</span>
      )
    },
    {
      header: 'Paid Amount',
      render: (row) => (
        <span className="font-bold text-emerald-600">{formatINR(row.paid_amount || 0)}</span>
      )
    },
    {
      header: 'Remaining Due',
      render: (row) => (
        <span className={`font-bold ${parseFloat(row.remaining_amount) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
          {formatINR(row.remaining_amount || 0)}
        </span>
      )
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
      cellClassName: 'text-xs text-slate-500'
    },
    {
      header: 'Status',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {parseFloat(row.remaining_amount) > 0 && (
            <button
              onClick={() => handleOpenPay(row)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              Collect
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fee Administration & Billing</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Manage student tuition, lab fees, installments, and payment ledger</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Create Fee Obligation
        </button>
      </div>

      <DataTable
        columns={columns}
        data={fees}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        filterComponents={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none text-slate-700 font-medium"
          >
            <option value="">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="PENDING">PENDING</option>
          </select>
        }
      />

      {/* Create Fee Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Fee Obligation"
        subtitle="Assesses a fee to student account in MySQL"
        size="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateFee} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Student *</label>
            <select
              required
              value={createFormData.student_id}
              onChange={(e) => setCreateFormData({ ...createFormData, student_id: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none bg-white font-medium"
            >
              {allStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.roll_number} - {s.first_name} {s.last_name} ({s.department})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fee Type / Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Tuition Fee - Semester 4"
              value={createFormData.fee_type}
              onChange={(e) => setCreateFormData({ ...createFormData, fee_type: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="0.00"
                value={createFormData.amount}
                onChange={(e) => setCreateFormData({ ...createFormData, amount: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={createFormData.due_date}
                onChange={(e) => setCreateFormData({ ...createFormData, due_date: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Assess Fee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title="Record Fee Payment"
        subtitle={`Collecting payment for ${selectedFee?.first_name} ${selectedFee?.last_name} (${selectedFee?.roll_number})`}
        size="md"
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}

        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Fee Assessment:</span>
              <strong className="text-slate-800">{selectedFee?.fee_type}</strong>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Remaining Balance:</span>
              <strong className="text-rose-600 font-bold">{formatINR(selectedFee?.remaining_amount || 0)}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={parseFloat(selectedFee?.remaining_amount || 0)}
              required
              value={payFormData.amount_paid}
              onChange={(e) => setPayFormData({ ...payFormData, amount_paid: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none font-bold text-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method *</label>
            <select
              value={payFormData.payment_method}
              onChange={(e) => setPayFormData({ ...payFormData, payment_method: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none bg-white font-medium"
            >
              <option value="Net Banking">Net Banking</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash Deposit</option>
              <option value="Cheque">Demand Draft / Cheque</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPayOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Payment & Print Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        receipt={receiptData}
      />
    </div>
  );
}
