/**
 * WOWTEK OMS — Warranty Hub & Automated SMS Reminder Engine
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Send,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { evaluateWarrantyStatus } from '../services/warrantyService';
import { WarrantyRecord, WarrantyStatus } from '../types';

export const WarrantyView: React.FC = () => {
  const {
    warranties,
    createWarranty,
    addWarrantyClaim,
    runWarrantyReminderCheck,
    orders,
    products,
  } = useOMS();

  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'EXPIRING_30' | 'EXPIRING_7' | 'EXPIRED' | 'CLAIMS'>('ALL');
  const [search, setSearch] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [claimingWarranty, setClaimingWarranty] = useState<WarrantyRecord | null>(null);
  const [reminderNotification, setReminderNotification] = useState<string | null>(null);

  // New Warranty Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+94 ');
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [serialNumber, setSerialNumber] = useState('');
  const [imei, setImei] = useState('');
  const [warrantyDuration, setWarrantyDuration] = useState(12);
  const [warrantyUnit, setWarrantyUnit] = useState<'DAYS' | 'MONTHS' | 'YEARS'>('MONTHS');

  // Claim Form State
  const [issueDescription, setIssueDescription] = useState('');
  const [claimNotes, setClaimNotes] = useState('');

  const handleRunReminders = () => {
    const res = runWarrantyReminderCheck();
    if (res.sentCount === 0) {
      setReminderNotification('No warranties currently due for automated SMS reminders.');
    } else {
      setReminderNotification(
        `Dispatched ${res.sentCount} automated warranty SMS alert(s) to customers: ${res.reminders.join(', ')}`
      );
    }
    setTimeout(() => setReminderNotification(null), 6000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = orders.find((o) => o.id === selectedOrderId);
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    createWarranty({
      customerId: order?.customer.id || `cust_${Date.now()}`,
      customerName,
      customerPhone,
      orderId: order?.id || 'MANUAL-ORDER',
      orderNumber: order?.orderNumber || 'WTK-MANUAL',
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      serialNumber: serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      imei: imei || undefined,
      warrantyDuration,
      warrantyUnit,
      startDate: new Date().toISOString(),
    });

    setIsRegisterModalOpen(false);
    setSerialNumber('');
    setImei('');
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingWarranty) return;

    addWarrantyClaim(claimingWarranty.id, {
      date: new Date().toISOString(),
      claimDate: new Date().toISOString(),
      issueDescription,
      status: 'PENDING',
      notes: claimNotes,
    });

    setClaimingWarranty(null);
    setIssueDescription('');
    setClaimNotes('');
  };

  const filteredWarranties = warranties.filter((w) => {
    const { status, daysRemaining } = evaluateWarrantyStatus(w.expiryDate, w.status);

    if (activeTab === 'ACTIVE' && status !== 'ACTIVE') return false;
    if (activeTab === 'EXPIRING_30' && !(status === 'EXPIRING_SOON' && daysRemaining <= 30 && daysRemaining > 7)) return false;
    if (activeTab === 'EXPIRING_7' && !(daysRemaining <= 7 && daysRemaining > 0)) return false;
    if (activeTab === 'EXPIRED' && status !== 'EXPIRED') return false;
    if (activeTab === 'CLAIMS' && w.claims.length === 0) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        w.customerName.toLowerCase().includes(q) ||
        w.customerPhone.includes(q) ||
        w.productName.toLowerCase().includes(q) ||
        w.serialNumber.toLowerCase().includes(q) ||
        w.orderNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Warranty & Claim Management
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold">
              SMS AUTOMATION READY
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Serial tracking, IMEI validation, claim lifecycle, and automated expiry alerts (30d, 14d, 7d, 1d)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Automation Runner Button */}
          <button
            onClick={handleRunReminders}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-orange-300 border border-orange-500/30 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Run Expiry SMS Check</span>
          </button>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Warranty</span>
          </button>
        </div>
      </div>

      {/* Reminder Notification Toast */}
      {reminderNotification && (
        <div className="p-3.5 rounded-xl bg-orange-950/80 border border-orange-500/50 text-orange-200 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
            <span>{reminderNotification}</span>
          </div>
          <button onClick={() => setReminderNotification(null)} className="text-orange-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-800">
        {[
          { label: 'All Warranties', value: 'ALL' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Expiring in 30 Days', value: 'EXPIRING_30' },
          { label: 'Expiring in 7 Days', value: 'EXPIRING_7' },
          { label: 'Expired', value: 'EXPIRED' },
          { label: 'Warranty Claims', value: 'CLAIMS' },
        ].map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value as any)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-orange-500 text-orange-300 bg-neutral-900/60'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Serial, Customer, or Product..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500"
          />
        </div>
      </div>

      {/* Warranties Table */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-3">Product & Serial #</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Order Ref</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Reminders Sent</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredWarranties.map((w) => {
                const { status, daysRemaining } = evaluateWarrantyStatus(w.expiryDate, w.status);
                return (
                  <tr key={w.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{w.productName}</div>
                      <div className="font-mono text-[10px] text-cyan-400">
                        SN: {w.serialNumber}
                      </div>
                      {w.imei && (
                        <div className="font-mono text-[10px] text-neutral-400">
                          IMEI: {w.imei}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-neutral-200">{w.customerName}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{w.customerPhone}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-cyan-400">
                      {w.orderNumber}
                    </td>

                    <td className="py-3 px-3 font-mono text-neutral-400">
                      {w.warrantyDuration} {w.warrantyUnit}
                    </td>

                    <td className="py-3 px-3 font-mono">
                      <div className="font-bold text-neutral-100">
                        {new Date(w.expiryDate).toLocaleDateString([], {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div
                        className={`text-[10px] ${
                          daysRemaining <= 0
                            ? 'text-rose-400'
                            : daysRemaining <= 30
                            ? 'text-orange-400'
                            : 'text-neutral-400'
                        }`}
                      >
                        {daysRemaining <= 0 ? 'Expired' : `${daysRemaining} days left`}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          status === 'ACTIVE'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : status === 'EXPIRING_SOON'
                            ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                            : status === 'CLAIMED'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      {w.reminderHistory.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {w.reminderHistory.map((rem) => (
                            <span
                              key={rem}
                              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700"
                            >
                              {rem}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-500">None</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setClaimingWarranty(w)}
                        className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-purple-300 text-[11px] font-semibold border border-purple-500/30 cursor-pointer"
                      >
                        File Claim
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Warranty Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95">
            <button
              onClick={() => setIsRegisterModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-1">Register New Warranty</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Link product serial number to customer & calculate expiry date
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Kasun Fernando"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Customer Phone *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+94 77 XXX XXXX"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Product Item *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const prod = products.find((p) => p.id === e.target.value);
                    if (prod) {
                      setWarrantyDuration(prod.warrantyDuration);
                      setWarrantyUnit(prod.warrantyUnit);
                    }
                  }}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Hardware Serial #</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="ANK-2026-94812"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">IMEI (If applicable)</label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    placeholder="358941029481920"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Warranty Period</label>
                  <input
                    type="number"
                    value={warrantyDuration}
                    onChange={(e) => setWarrantyDuration(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Unit</label>
                  <select
                    value={warrantyUnit}
                    onChange={(e) => setWarrantyUnit(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                  >
                    <option value="MONTHS">Months</option>
                    <option value="DAYS">Days</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                >
                  Activate Warranty Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Warranty Modal */}
      {claimingWarranty && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95">
            <button
              onClick={() => setClaimingWarranty(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-1">File Warranty Claim</h2>
            <p className="text-xs text-neutral-400 mb-4 font-mono">
              {claimingWarranty.productName} (SN: {claimingWarranty.serialNumber})
            </p>

            <form onSubmit={handleClaimSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Customer Issue Description *</label>
                <textarea
                  required
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="e.g. USB-C port 1 not charging laptops at 140W PD mode"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Internal Diagnostic Notes</label>
                <input
                  type="text"
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder="e.g. Inspected at Bambalapitiya showroom, technician confirmed defect"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Submit Official Warranty Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
