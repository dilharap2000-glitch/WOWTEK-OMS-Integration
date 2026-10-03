import React, { useState } from 'react';
import { X, Printer, Barcode, CheckSquare, Square, Sliders, Tag } from 'lucide-react';
import { ProductItem } from '../types';
import { formatCurrency } from '../utils/storage';

interface PrintBarcodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProducts: ProductItem[];
}

export const PrintBarcodesModal: React.FC<PrintBarcodesModalProps> = ({
  isOpen,
  onClose,
  selectedProducts,
}) => {
  const [labelSize, setLabelSize] = useState('38x25');
  const [includePrice, setIncludePrice] = useState(true);
  const [includeDescription, setIncludeDescription] = useState(true);
  
  // Mapping of productId -> labelCount
  const [labelCounts, setLabelCounts] = useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    selectedProducts.forEach(p => {
      counts[p.id] = 1;
    });
    return counts;
  });

  if (!isOpen || selectedProducts.length === 0) return null;

  const handleCountChange = (productId: string, val: number) => {
    setLabelCounts(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(100, val || 1)),
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate printable stickers array based on labelCounts
  const printItems: { product: ProductItem; index: number }[] = [];
  selectedProducts.forEach(p => {
    const count = labelCounts[p.id] || 1;
    for (let i = 0; i < count; i++) {
      printItems.push({ product: p, index: i + 1 });
    }
  });

  const totalLabels = Object.values(labelCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-950 text-zinc-100 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl print:border-none print:shadow-none print:w-full print:max-w-none print:m-0 print:p-0 print:bg-white print:text-black">
        
        {/* Modal Header (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Print Barcode Labels
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  {selectedProducts.length} Items Selected ({totalLabels} Total Labels)
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Configure sticker dimensions, attributes, and print quantity</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls (Hidden during print) */}
        <div className="p-6 space-y-6 print:hidden max-h-[75vh] overflow-y-auto">
          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                Label Size (Dimension)
              </label>
              <select
                value={labelSize}
                onChange={e => setLabelSize(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="38x25">38 x 25 mm SUP (Standard Retail)</option>
                <option value="50x30">50 x 30 mm Standard Barcode</option>
                <option value="40x20">40 x 20 mm Compact Jewelry/Cable</option>
                <option value="100x50">100 x 50 mm Shipping Carton</option>
              </select>
            </div>

            <div className="flex flex-col justify-center space-y-2.5 pt-2">
              <label className="flex items-center space-x-2 text-xs text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePrice}
                  onChange={e => setIncludePrice(e.target.checked)}
                  className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500 bg-zinc-800"
                />
                <span className="font-medium">Include Selling Price</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-zinc-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDescription}
                  onChange={e => setIncludeDescription(e.target.checked)}
                  className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500 bg-zinc-800"
                />
                <span className="font-medium">Include Category / Description</span>
              </label>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={handlePrint}
                className="w-full md:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Sticker Sheet ({totalLabels})</span>
              </button>
            </div>
          </div>

          {/* Selected Products Table with Editable Label Counts */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-zinc-900 border-b border-zinc-800 uppercase tracking-wider text-[10px] text-zinc-400 font-semibold">
                <tr>
                  <th className="px-4 py-3">Product Name & SKU</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Labels Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {selectedProducts.map(prod => (
                  <tr key={prod.id} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{prod.name}</div>
                      <span className="font-mono text-[10px] text-purple-400">{prod.sku}</span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-emerald-400">
                      {formatCurrency(prod.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {prod.category}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={labelCounts[prod.id] || 1}
                        onChange={e => handleCountChange(prod.id, parseInt(e.target.value) || 1)}
                        className="w-20 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Live Preview Box */}
          <div>
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-400" />
              Live Label Sticker Preview ({labelSize} mm)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-zinc-900/40 rounded-xl border border-dashed border-zinc-800">
              {printItems.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white text-zinc-900 p-3 rounded-lg border border-zinc-300 shadow-sm text-center space-y-1 font-sans"
                >
                  <div className="text-[9px] font-black uppercase tracking-tight text-purple-800">WOWTEK (PVT) LTD</div>
                  <div className="text-[11px] font-bold truncate text-zinc-900">{item.product.name}</div>
                  <div className="bg-zinc-50 border border-zinc-200 py-1 px-2 rounded">
                    <div className="font-mono text-sm tracking-[0.2em] font-bold text-zinc-950">|||| | || ||||| | ||</div>
                    <div className="font-mono text-[9px] text-zinc-600">{item.product.sku}</div>
                  </div>
                  {includePrice && (
                    <div className="text-xs font-black text-purple-900">
                      {formatCurrency(item.product.sellingPrice)}
                    </div>
                  )}
                  {includeDescription && (
                    <div className="text-[8px] text-zinc-500 uppercase">{item.product.category}</div>
                  )}
                </div>
              ))}
              {printItems.length > 4 && (
                <div className="flex items-center justify-center p-3 text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                  +{printItems.length - 4} more labels ready to print
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Printable Barcode Sheet (Visible ONLY during print via CSS @media print) */}
        <div className="hidden print:block print:w-full print:m-0 print:p-4 bg-white text-black font-sans">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-container, .print-container * { visibility: visible; }
              .print-container { position: absolute; left: 0; top: 0; width: 100%; }
            }
          `}</style>
          
          <div className="print-container grid grid-cols-3 gap-3 p-2">
            {printItems.map((item, idx) => (
              <div
                key={idx}
                className="border border-black p-2 text-center space-y-1 rounded bg-white text-black break-inside-avoid"
                style={{ width: '38mm', minHeight: '25mm' }}
              >
                <div className="text-[8px] font-bold uppercase tracking-wider">WOWTEK (PVT) LTD</div>
                <div className="text-[9px] font-bold truncate leading-tight">{item.product.name}</div>
                <div className="font-mono text-xs tracking-[0.25em] font-bold leading-none my-0.5">|||| | || ||||| | ||</div>
                <div className="font-mono text-[8px]">{item.product.sku}</div>
                {includePrice && (
                  <div className="text-[10px] font-black">{formatCurrency(item.product.sellingPrice)}</div>
                )}
                {includeDescription && (
                  <div className="text-[7px] uppercase text-zinc-600">{item.product.category}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print {totalLabels} Labels</span>
          </button>
        </div>

      </div>
    </div>
  );
};
