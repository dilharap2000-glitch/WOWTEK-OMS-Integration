/**
 * WOWTEK OMS — Invoices Module
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import { FileText, Search, Printer, Send, ExternalLink, CheckCircle } from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { Invoice } from '../types';
import { formatNumber, formatDate } from '../lib/formatters';

export const InvoicesView: React.FC = () => {
  const { invoices, setPrintableInvoice, sendSMS, businessSettings } = useOMS();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const filteredInvoices = invoices.filter((inv) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.orderNumber.toLowerCase().includes(q) ||
        inv.customer.name.toLowerCase().includes(q) ||
        inv.customer.phone.includes(q)
      );
    }
    return true;
  });

  const handleSendInvoiceSMS = async (inv: Invoice) => {
    const msg = `WOWTEK: Hi ${inv.customer.name}, your invoice ${inv.invoiceNumber} for order ${inv.orderNumber} (Rs. ${formatNumber(inv.total)}) has been issued. Thank you for shopping with wowtek.lk`;
    await sendSMS(inv.customer.phone, inv.customer.name, msg, 'INVOICE_AVAILABLE', inv.orderNumber);
    setToast(`Invoice SMS sent to ${inv.customer.phone}!`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Invoices & Billing
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Official commercial VAT invoices, itemized serial numbers, and SMS billing alerts
          </p>
        </div>
      </div>

      {toast && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="flex justify-end">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Invoice #, Order #, Customer..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500"
          />
        </div>
      </div>

      <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-3">Invoice #</th>
                <th className="py-3 px-3">Order Ref</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Payment</th>
                <th className="py-3 px-3">Issue Date</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                    {inv.invoiceNumber}
                  </td>

                  <td className="py-3 px-3 font-mono text-neutral-200 font-medium">
                    {inv.orderNumber}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{inv.customer.name}</div>
                    <div className="font-mono text-[10px] text-neutral-400">{inv.customer.phone}</div>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-white">
                    Rs. {formatNumber(inv.total)}
                  </td>

                  <td className="py-3 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-emerald-400 border border-emerald-500/30">
                      {inv.paymentMethod} • {inv.paymentStatus}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-neutral-400">
                    {formatDate(inv.issueDate, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPrintableInvoice(inv)}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 border border-cyan-500/30 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Invoice</span>
                      </button>

                      <button
                        onClick={() => handleSendInvoiceSMS(inv)}
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-white"
                        title="Send SMS"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
