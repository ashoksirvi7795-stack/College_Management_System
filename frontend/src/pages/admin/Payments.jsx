import React, { useState, useEffect } from 'react';
import { Receipt, Eye, Search, IndianRupee } from 'lucide-react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import ReceiptModal from '../../components/ReceiptModal';
import { formatINR } from '../../utils/format';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchPayments(pagination.page);
  }, [search, pagination.page]);

  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/payments', {
        params: {
          page,
          limit: 10,
          transaction_id: search
        }
      });
      if (res.data?.success) {
        setPayments(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch payments:', err);
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

  const columns = [
    {
      header: 'Transaction ID',
      accessor: 'transaction_id',
      cellClassName: 'font-mono font-bold text-indigo-600'
    },
    {
      header: 'Student',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.first_name} {row.last_name}</p>
          <span className="font-mono text-xs text-slate-400">{row.roll_number}</span>
        </div>
      )
    },
    {
      header: 'Fee Assessment',
      accessor: 'fee_type',
      cellClassName: 'font-medium text-slate-700'
    },
    {
      header: 'Amount Paid',
      render: (row) => (
        <span className="font-mono font-bold text-emerald-600">
          {formatINR(row.amount_paid)}
        </span>
      )
    },
    {
      header: 'Payment Method',
      accessor: 'payment_method',
      cellClassName: 'text-xs text-slate-600'
    },
    {
      header: 'Date & Time',
      render: (row) => (
        <span className="text-xs text-slate-500 font-medium">
          {new Date(row.payment_date).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Status',
      render: (row) => <Badge variant="SUCCESS">SUCCESS</Badge>
    },
    {
      header: 'Receipt',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleViewReceipt(row.id)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View Receipt
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment Ledger & Receipts</h1>
        <p className="text-xs text-slate-500 mt-1 font-medium">Audit trail of all processed fee payments with official printable receipts</p>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by transaction ID..."
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
}
