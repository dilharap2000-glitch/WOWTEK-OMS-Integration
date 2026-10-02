import React, { useState } from 'react';
import { Truck, ShieldCheck, Plus, Trash2, Send, AlertTriangle } from 'lucide-react';
import { Supplier, WarrantyRecord, WarrantyStatus } from '../types';
import { formatCurrency } from '../utils/storage';

interface SuppliersWarrantyTabProps {
  suppliers: Supplier[];
  warranties: WarrantyRecord[];
  onDeleteSupplier: (id: string) => void;
  onUpdateWarrantyStatus: (id: string, status: WarrantyStatus) => void;
  onOpenAddSupplier: () => void;
  onOpenAddWarranty: () => void;
  searchTerm: string;
}

export const SuppliersWarrantyTab: React.FC<SuppliersWarrantyTabProps> = ({
  suppliers,
  warranties,
  onDeleteSupplier,
  onUpdateWarrantyStatus,
  onOpenAddSupplier,
  onOpenAddWarranty,
  searchTerm,
}) => {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'warranties'>('warranties');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const filteredWarranties = warranties.filter(w => {
    const matchesSearch = 
      w.warrantyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerPhone.includes(searchTerm) ||
      w.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.barcode.includes(searchTerm) ||
      (w.invoiceNumber && w.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'All' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sendReminderSms = (warranty: WarrantyRecord) => {
    alert(`[SMS Dispatch Simulation] Sent 30-day warranty expiry reminder to ${warranty.customerName} (${warranty.customerPhone}) for ${warranty.productName} (Serial: ${warranty.serialNumber}).`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('warranties')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'warranties'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Customer Warranty Tracker ({warranties.length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'suppliers'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Suppliers Directory ({suppliers.length})
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {activeTab === 'warranties' ? (
            <button
              onClick={onOpenAddWarranty}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-purple-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Log Warranty Record</span>
            </button>
          ) : (
            <button
              onClick={onOpenAddSupplier}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-purple-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'warranties' && (
        <div className="flex items-center space-x-2">
          {['All', 'Active', 'Expiring Soon', 'Expired', 'Sent for Warranty', 'Fixed/Received', 'Replaced', 'Rejected'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'suppliers' ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Company Name</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4">Phone / Email</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map(sup => (
                  <tr key={sup.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{sup.name}</td>
                    <td className="px-6 py-4 text-zinc-300">{sup.contactPerson || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-200">{sup.phone}</div>
                      <div className="text-xs text-zinc-500">{sup.email}</div>
                    </td>
                    <td className="px-6 py-4 text-purple-400 font-medium text-xs">{sup.category}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDeleteSupplier(sup.id)}
                        className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-900 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-zinc-500">
                    <Truck className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                    <p className="text-sm font-medium">No suppliers registered</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">Warranty / Invoice</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product & Serial</th>
                <th className="px-6 py-4">Expiry Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredWarranties.length > 0 ? (
                filteredWarranties.map(w => (
                  <tr key={w.id} className="hover:bg-zinc-900/60 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-white">{w.warrantyNumber}</div>
                      <div className="text-xs text-purple-400">{w.invoiceNumber || 'Manual'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-200">{w.customerName}</div>
                      <div className="text-xs text-zinc-500">{w.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{w.productName}</div>
                      <div className="font-mono text-xs text-purple-400">Serial: {w.serialNumber}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-300">
                      {new Date(w.expiryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={w.status}
                        onChange={(e) => onUpdateWarrantyStatus(w.id, e.target.value as WarrantyStatus)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border focus:outline-none ${
                          w.status === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : w.status === 'Expiring Soon'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                        }`}
                      >
                        <option value="Active" className="bg-zinc-900 text-zinc-300">Active</option>
                        <option value="Expiring Soon" className="bg-zinc-900 text-zinc-300">Expiring Soon</option>
                        <option value="Expired" className="bg-zinc-900 text-zinc-300">Expired</option>
                        <option value="Claimed" className="bg-zinc-900 text-zinc-300">Claimed</option>
                        <option value="Sent for Warranty" className="bg-zinc-900 text-zinc-300">Sent for Warranty</option>
                        <option value="Fixed/Received" className="bg-zinc-900 text-zinc-300">Fixed/Received</option>
                        <option value="Replaced" className="bg-zinc-900 text-zinc-300">Replaced</option>
                        <option value="Rejected" className="bg-zinc-900 text-zinc-300">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => sendReminderSms(w)}
                        className="flex items-center space-x-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ml-auto"
                        title="Send SMS Expiry Reminder"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send SMS Reminder</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-zinc-500">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                    <p className="text-sm font-medium">No customer warranty records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
