/**
 * WOWTEK OMS — Products & Inventory Management
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpDown,
  History,
  Edit2,
  Trash2,
  TrendingUp,
  X,
  CheckCircle,
} from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { InventoryMovementType, Product } from '../types';

export const ProductsView: React.FC = () => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    inventoryTransactions,
    businessSettings,
    currentUser,
  } = useOMS();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Stock Adjustment Form State
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [adjustmentType, setAdjustmentType] = useState<InventoryMovementType>('PURCHASE');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  // New Product Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Chargers & Power Banks');
  const [costPrice, setCostPrice] = useState<number>(5000);
  const [sellingPrice, setSellingPrice] = useState<number>(8500);
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [minStock, setMinStock] = useState<number>(5);
  const [warrantyDuration, setWarrantyDuration] = useState<number>(12);
  const [warrantyUnit, setWarrantyUnit] = useState<'DAYS' | 'MONTHS' | 'YEARS' | string>('MONTHS');

  const categories = ['ALL', ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setCostPrice(p.costPrice);
    setSellingPrice(p.sellingPrice);
    setMinStock(p.minStock);
    setWarrantyDuration(p.warrantyDuration);
    setWarrantyUnit(p.warrantyUnit);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        sku,
        category,
        costPrice,
        sellingPrice,
        minStock,
        warrantyDuration,
        warrantyUnit,
      });
      setEditingProduct(null);
    } else {
      addProduct({
        name,
        sku,
        category,
        costPrice,
        sellingPrice,
        stockQuantity,
        minStock,
        warrantyDuration,
        warrantyUnit,
        isActive: true,
      });
      setIsAddModalOpen(false);
    }
  };

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    // For purchases & returns, qty is positive; for adjustments / damaged, handle negative
    const finalChange =
      adjustmentType === 'PURCHASE' || adjustmentType === 'RETURN'
        ? Math.abs(adjustmentQty)
        : adjustmentType === 'DAMAGED'
        ? -Math.abs(adjustmentQty)
        : adjustmentQty;

    adjustStock(adjustingProduct.id, finalChange, adjustmentType, adjustmentNotes);
    setAdjustingProduct(null);
    setAdjustmentQty(1);
    setAdjustmentNotes('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Product Catalog & Inventory
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time stock control, SKU tracking, cost of goods, and warranty periods
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-cyan-400" />
            <span>Stock Movement Log</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setName('');
              setSku('');
              setCategory('Chargers & Power Banks');
              setCostPrice(5000);
              setSellingPrice(8500);
              setStockQuantity(10);
              setMinStock(5);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New SKU</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-neutral-400">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, product title..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-3">SKU & Item Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Stock Level</th>
                <th className="py-3 px-3">Cost Price (LKR)</th>
                <th className="py-3 px-3">Selling Price (LKR)</th>
                <th className="py-3 px-3">Margin</th>
                <th className="py-3 px-3">Warranty</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredProducts.map((p) => {
                const isLow = p.stockQuantity <= p.minStock;
                const margin =
                  p.sellingPrice > 0
                    ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
                    : 0;

                return (
                  <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="font-mono text-[10px] text-cyan-400">{p.sku}</div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isLow ? 'text-rose-400' : 'text-neutral-100'
                          }`}
                        >
                          {p.stockQuantity}
                        </span>
                        {isLow && (
                          <span className="text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded font-bold border border-rose-500/20">
                            LOW
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        Min: {p.minStock} units
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-neutral-300">
                      Rs. {p.costPrice.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-white">
                      Rs. {p.sellingPrice.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-mono text-emerald-400 font-semibold">
                      +{margin}%
                    </td>

                    <td className="py-3 px-3 text-neutral-400 font-mono text-[11px]">
                      {p.warrantyDuration} {p.warrantyUnit}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setAdjustingProduct(p);
                            setAdjustmentQty(1);
                            setAdjustmentType('PURCHASE');
                          }}
                          className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 cursor-pointer"
                        >
                          Adjust Stock
                        </button>

                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {currentUser.role === 'ADMIN' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete product ${p.name}?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300"
                            title="Delete SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-5 relative animate-in zoom-in-95">
            <button
              onClick={() => setAdjustingProduct(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-1">Stock Adjustment</h2>
            <p className="text-xs text-neutral-400 mb-4 font-mono">
              {adjustingProduct.name} ({adjustingProduct.sku})
            </p>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Adjustment Type</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                >
                  <option value="PURCHASE">Purchase Receipt (Stock In +)</option>
                  <option value="SALE">Sale (Stock Out -)</option>
                  <option value="RETURN">Customer Return (Stock In +)</option>
                  <option value="ADJUSTMENT">Inventory Count Audit Adjustment (+/-)</option>
                  <option value="DAMAGED">Damaged / Written-Off (Stock Out -)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Quantity ({adjustmentType === 'DAMAGED' ? 'Deduction' : 'Quantity'})
                </label>
                <input
                  type="number"
                  required
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="e.g. Supplier batch receipt from Anker Sri Lanka"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Save Stock Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-1">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-neutral-400 mb-4">
              Configure product details, stock warning limits, and warranty periods
            </p>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ugreen Nexode 100W GaN 4-Port Fast Charger"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="UGR-CHG-100W"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Cost Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Selling Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">
                    {editingProduct ? 'Current Stock' : 'Initial Stock Qty'}
                  </label>
                  <input
                    type="number"
                    disabled={Boolean(editingProduct)}
                    value={editingProduct ? editingProduct.stockQuantity : stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Min Stock Threshold</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
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
                  <label className="text-[11px] text-neutral-400 block mb-1">Warranty Unit</label>
                  <select
                    value={warrantyUnit}
                    onChange={(e) => setWarrantyUnit(e.target.value as any)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                  >
                    <option value="DAYS">Days</option>
                    <option value="MONTHS">Months</option>
                    <option value="YEARS">Years</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                >
                  {editingProduct ? 'Update Product' : 'Create Product SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl shadow-2xl p-6 relative max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-cyan-400" />
              <div>
                <h2 className="text-base font-bold text-white">Stock Movement History Audit</h2>
                <p className="text-xs text-neutral-400">
                  Detailed ledger of all stock purchases, sales, returns, and write-offs
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar border border-neutral-800 rounded-xl">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Item / SKU</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Change</th>
                    <th className="py-2.5 px-3">Stock Before/After</th>
                    <th className="py-2.5 px-3">User & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-sans">
                  {inventoryTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-800/30">
                      <td className="py-2.5 px-3 font-mono text-[10px] text-neutral-400">
                        {new Date(tx.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-neutral-200">
                        <div>{tx.productName}</div>
                        <div className="font-mono text-[10px] text-cyan-400">{tx.sku}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span className={tx.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {tx.quantityChange > 0 ? `+${tx.quantityChange}` : tx.quantityChange}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-400">
                        {tx.previousStock} → <span className="text-white font-bold">{tx.newStock}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-neutral-300">{tx.notes}</div>
                        <div className="text-[10px] text-neutral-400">{tx.createdBy}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
