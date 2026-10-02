import React, { useState } from 'react';
import { X, ArrowLeftRight } from 'lucide-react';
import { Outlet, ProductItem, StockTransfer } from '../types';
import { generateId } from '../utils/storage';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  outlets: Outlet[];
  products: ProductItem[];
  onSaveTransfer: (transfer: StockTransfer) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  outlets,
  products,
  onSaveTransfer,
}) => {
  const [sourceOutletId, setSourceOutletId] = useState(outlets[0]?.id || '');
  const [targetOutletId, setTargetOutletId] = useState(outlets[1]?.id || '');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [serialsText, setSerialsText] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceOutletId || !targetOutletId || !productId || sourceOutletId === targetOutletId) {
      alert('Please select different source and target outlets and a valid product.');
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const availableStock = prod.stockByOutlet[sourceOutletId] || 0;
    if (quantity > availableStock) {
      alert(`Insufficient stock in source outlet! Available: ${availableStock}`);
      return;
    }

    const serials = serialsText.split(',').map(s => s.trim()).filter(Boolean);

    const newTransfer: StockTransfer = {
      id: generateId('trf'),
      transferNumber: `TRF-${Math.floor(100000 + Math.random() * 900000)}`,
      sourceOutletId,
      targetOutletId,
      productId,
      productName: prod.name,
      quantity,
      serials,
      status: 'Pending',
      requestedBy: 'Dilhara Perera (Admin)',
      createdAt: new Date().toISOString(),
    };

    onSaveTransfer(newTransfer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Stock Transfer</h3>
              <p className="text-xs text-zinc-400">Transfer inventory between WOWTEK outlets securely</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Source Outlet</label>
              <select
                value={sourceOutletId}
                onChange={e => setSourceOutletId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Target Outlet</label>
              <select
                value={targetOutletId}
                onChange={e => setTargetOutletId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Product</label>
            <select
              required
              value={productId}
              onChange={e => setProductId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">Select Product...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) [Available in Source: {p.stockByOutlet[sourceOutletId] || 0}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Quantity to Transfer</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Item Serials / Barcodes (Comma Separated)</label>
            <input
              type="text"
              value={serialsText}
              onChange={e => setSerialsText(e.target.value)}
              placeholder="e.g. WT-123456-1, WT-123456-2"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
            />
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
              Initiate Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
