import React, { useState } from 'react';
import { X, PackagePlus, Sparkles } from 'lucide-react';
import { ProductItem, Supplier, Outlet, GRNEntry, BarcodeLabel } from '../types';
import { generateId } from '../utils/storage';

interface GRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  outlets: Outlet[];
  products: ProductItem[];
  onSaveGRN: (grn: GRNEntry, newBarcodes: BarcodeLabel[], updatedProducts: ProductItem[]) => void;
}

export const GRNModal: React.FC<GRNModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  outlets,
  products,
  onSaveGRN,
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [outletId, setOutletId] = useState(outlets[0]?.id || '');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [batchNumber, setBatchNumber] = useState(`GRN-${Math.floor(1000 + Math.random() * 9000)}`);
  const [costPrice, setCostPrice] = useState(0);
  const [serials, setSerials] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleQuantityChange = (newQty: number) => {
    const qty = Math.max(1, newQty);
    setQuantity(qty);
    const prefix = `WT-${Math.floor(100000 + Math.random() * 900000)}`;
    const newSerials = Array.from({ length: qty }, (_, i) => `${prefix}-${i + 1}`);
    setSerials(newSerials);
  };

  const handleProductSelect = (pid: string) => {
    setProductId(pid);
    const prod = products.find(p => p.id === pid);
    if (prod) {
      setCostPrice(prod.costPrice);
    }
  };

  const handleAutoGenerateSerials = () => {
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    const newSerials = Array.from({ length: quantity }, (_, i) => `WT-${randomCode}-${i + 1}`);
    setSerials(newSerials);
  };

  const handleSerialChange = (index: number, val: string) => {
    const updated = [...serials];
    updated[index] = val;
    setSerials(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !productId || !outletId || serials.length === 0) {
      alert('Please select supplier, outlet, product, and ensure barcodes are generated.');
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const totalAmount = costPrice * quantity;

    const grnEntry: GRNEntry = {
      id: generateId('grn'),
      supplierId,
      outletId,
      batchNumber,
      date: new Date().toISOString(),
      items: [
        {
          productId,
          productName: prod.name,
          quantity,
          costPrice,
        }
      ],
      totalAmount,
    };

    const newBarcodes: BarcodeLabel[] = serials.map(serial => ({
      id: generateId('bc'),
      productId,
      productName: prod.name,
      sku: prod.sku,
      serialOrBarcode: serial,
      isPrinted: false,
      grnBatch: batchNumber,
      outletId,
      createdAt: new Date().toISOString(),
    }));

    const currentOutletStock = prod.stockByOutlet[outletId] || 0;
    const updatedStockByOutlet = {
      ...prod.stockByOutlet,
      [outletId]: currentOutletStock + quantity,
    };

    const updatedProduct: ProductItem = {
      ...prod,
      stockByOutlet: updatedStockByOutlet,
      costPrice: costPrice > 0 ? costPrice : prod.costPrice,
    };

    onSaveGRN(grnEntry, newBarcodes, [updatedProduct]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Goods Received Note (GRN)</h3>
              <p className="text-xs text-zinc-400">Add stock and auto-generate unique serial / barcode labels per outlet</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Supplier</label>
              <select
                required
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Supplier...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Outlet</label>
              <select
                required
                value={outletId}
                onChange={e => setOutletId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">GRN Batch Number</label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={e => setBatchNumber(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Unit Cost Price (LKR)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={costPrice}
                onChange={e => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Select Product</label>
              <select
                required
                value={productId}
                onChange={e => handleProductSelect(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={e => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 text-center focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Barcode Generator Section */}
          <div className="border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-white">Barcode & Serial Number Generator</h4>
                <p className="text-xs text-zinc-400">Review or customize generated unique item barcodes for this GRN</p>
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateSerials}
                className="flex items-center space-x-1.5 bg-purple-600/25 hover:bg-purple-600/35 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Auto-Regenerate Barcodes</span>
              </button>
            </div>

            {serials.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                {serials.map((serial, idx) => (
                  <div key={idx} className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg">
                    <span className="text-xs font-mono text-zinc-500 w-6">#{idx + 1}</span>
                    <input
                      type="text"
                      value={serial}
                      onChange={e => handleSerialChange(idx, e.target.value)}
                      className="bg-transparent text-xs font-mono text-zinc-200 w-full focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500">
                Select a product and quantity above to generate barcodes.
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
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
              Confirm GRN & Generate Labels
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
