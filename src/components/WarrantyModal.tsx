import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { Supplier, WarrantyRecord, WarrantyStatus } from '../types';
import { generateId } from '../utils/storage';

interface WarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onSaveRecord: (record: WarrantyRecord) => void;
}

export const WarrantyModal: React.FC<WarrantyModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  onSaveRecord,
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('SKU-001');
  const [serialNumber, setSerialNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState(6);
  const [status, setStatus] = useState<WarrantyStatus>('Active');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !serialNumber || !customerName) {
      alert('Please fill in supplier, customer name, and serial number.');
      return;
    }

    const warrantyNumber = `WRN-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + warrantyMonths);

    const newRecord: WarrantyRecord = {
      id: generateId('wrn'),
      warrantyNumber,
      supplierId,
      customerName,
      customerPhone,
      productName,
      sku,
      serialNumber,
      barcode: barcode || `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      purchaseDate: now.toISOString(),
      startDate: now.toISOString(),
      expiryDate: expiry.toISOString(),
      status,
      reminderSent: false,
      createdAt: now.toISOString(),
    };

    onSaveRecord(newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Log Customer Warranty</h3>
              <p className="text-xs text-zinc-400">Register customer warranty with start and calculated expiry dates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Supplier / Vendor</label>
            <select
              required
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">Select Supplier...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Dinesh Mendis"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Customer Phone</label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="e.g. 0719876543"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Product Name</label>
              <input
                type="text"
                required
                value={productName}
                onChange={e => setProductName(e.target.value)}
                placeholder="e.g. Smart Watch Pro"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">SKU</label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Serial Number</label>
              <input
                type="text"
                required
                value={serialNumber}
                onChange={e => setSerialNumber(e.target.value)}
                placeholder="e.g. WT-SER-94812"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Warranty Duration (Months)</label>
              <input
                type="number"
                min="1"
                required
                value={warrantyMonths}
                onChange={e => setWarrantyMonths(parseInt(e.target.value) || 6)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Initial Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as WarrantyStatus)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
            >
              <option value="Active">Active</option>
              <option value="Sent for Warranty">Sent for Warranty</option>
              <option value="Claimed">Claimed</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-5 py-2.5 rounded-xl text-sm font-medium border border-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/25"
            >
              Save Warranty Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
