import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { ProductItem, Supplier, Outlet } from '../types';
import { generateId } from '../utils/storage';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  outlets: Outlet[];
  onSaveProduct: (product: ProductItem) => void;
  initialProduct?: ProductItem | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  outlets,
  onSaveProduct,
  initialProduct,
}) => {
  const [sku, setSku] = useState(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [costPrice, setCostPrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [supplierId, setSupplierId] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState(6);
  const [initialStock, setInitialStock] = useState<Record<string, number>>({
    'outlet-1': 5,
    'outlet-2': 3,
    'outlet-3': 2,
  });

  useEffect(() => {
    if (initialProduct) {
      setSku(initialProduct.sku || '');
      setName(initialProduct.name || '');
      setCategory(initialProduct.category || 'Electronics');
      setCostPrice(initialProduct.costPrice || 0);
      setSellingPrice(initialProduct.sellingPrice || 0);
      setSupplierId(initialProduct.supplierId || (suppliers[0]?.id || ''));
      setWarrantyMonths(initialProduct.warrantyPeriodMonths || 6);
      setInitialStock(initialProduct.stockByOutlet || {});
    } else {
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setName('');
      setCategory('Electronics');
      setCostPrice(0);
      setSellingPrice(0);
      setSupplierId(suppliers[0]?.id || '');
      setWarrantyMonths(6);
      setInitialStock({
        'outlet-1': 5,
        'outlet-2': 3,
        'outlet-3': 2,
      });
    }
  }, [initialProduct, isOpen, suppliers]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert('Please fill in product name.');
      return;
    }

    const productPayload: ProductItem = {
      ...(initialProduct || {}),
      id: initialProduct?.id || generateId('prod'),
      sku: sku.trim(),
      name: name.trim(),
      category,
      costPrice: parseFloat(String(costPrice)) || 0,
      sellingPrice: parseFloat(String(sellingPrice)) || 0,
      stockByOutlet: initialStock,
      supplierId: supplierId || (suppliers[0]?.id || ''),
      warrantyPeriodMonths: parseInt(String(warrantyMonths)) || 6,
      createdAt: initialProduct?.createdAt || new Date().toISOString(),
    };

    onSaveProduct(productPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {initialProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <p className="text-xs text-zinc-400">
                {initialProduct ? 'Update product details in MongoDB Atlas' : 'Create product item with multi-outlet initial stock'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="Electronics">Electronics</option>
                <option value="Accessories">Accessories</option>
                <option value="Audio">Audio</option>
                <option value="Smart Gadgets">Smart Gadgets</option>
                <option value="Cables & Chargers">Cables & Chargers</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Product Title / Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. WOWTEK 67W GaN Fast Charger"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Cost Price (LKR)</label>
              <input
                type="number"
                required
                min="0"
                value={costPrice}
                onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Selling Price (LKR)</label>
              <input
                type="number"
                required
                min="0"
                value={sellingPrice}
                onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Primary Supplier</label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Warranty Period (Months)</label>
              <input
                type="number"
                min="0"
                value={warrantyMonths}
                onChange={e => setWarrantyMonths(parseInt(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Initial Stock Breakdown by Outlet</label>
            <div className="space-y-2.5 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              {outlets.map(o => (
                <div key={o.id} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-zinc-300 truncate">{o.name} ({o.code}):</span>
                  <input
                    type="number"
                    min="0"
                    value={initialStock[o.id] || 0}
                    onChange={e => setInitialStock({ ...initialStock, [o.id]: parseInt(e.target.value) || 0 })}
                    className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-right text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-zinc-800 text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              {initialProduct ? 'Update Product in MongoDB' : 'Save to MongoDB Atlas'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
