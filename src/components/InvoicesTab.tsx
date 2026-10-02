import React from 'react';
import { FileText, Printer, Plus, Trash2 } from 'lucide-react';
import { Invoice, Outlet } from '../types';
import { formatCurrency } from '../utils/storage';

interface InvoicesTabProps {
  invoices: Invoice[];
  outlets: Outlet[];
  currentOutletId: string;
  onDeleteInvoice: (id: string) => void;
  onOpenAddInvoice: () => void;
  searchTerm: string;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({
  invoices,
  outlets,
  currentOutletId,
  onDeleteInvoice,
  onOpenAddInvoice,
  searchTerm,
}) => {
  const filteredInvoices = invoices.filter(inv => {
    const matchesOutlet = currentOutletId === 'all' || inv.outletId === currentOutletId;
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerPhone.includes(searchTerm);
    return matchesOutlet && matchesSearch;
  });

  const getOutletName = (id: string) => outlets.find(o => o.id === id)?.name || 'Outlet';

  const handlePrintInvoice = (inv: Invoice) => {
    window.print();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Invoices & Billing Dashboard</h3>
          <p className="text-xs text-zinc-400">Manage auto-generated and manual walk-in customer invoices</p>
        </div>
        <button
          onClick={onOpenAddInvoice}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create Manual Invoice</span>
        </button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Invoice # / Date</th>
              <th className="px-6 py-4">Outlet</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Payment Method</th>
              <th className="px-6 py-4">Total Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-white">{inv.invoiceNumber}</div>
                    <div className="text-xs text-zinc-500">{new Date(inv.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-purple-400 font-semibold text-xs">
                    {getOutletName(inv.outletId)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-200">{inv.customerName}</div>
                    <div className="text-xs text-zinc-500">{inv.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium">
                      {inv.paymentMethod}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-white">
                    {formatCurrency(inv.totalAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handlePrintInvoice(inv)}
                      className="text-purple-400 hover:text-purple-300 p-2 rounded-lg hover:bg-zinc-900 transition-colors"
                      title="Print Invoice"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteInvoice(inv.id)}
                      className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-900 transition-colors"
                      title="Delete Invoice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-16 text-zinc-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm font-medium">No invoices found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
