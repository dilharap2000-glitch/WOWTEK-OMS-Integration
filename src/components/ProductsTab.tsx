import React, { useState } from 'react';
import { Package, Plus, Trash2, Pencil, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { ProductItem, Supplier, GRNEntry, Outlet } from '../types';
import { formatCurrency } from '../utils/storage';

interface ProductsTabProps {
  products: ProductItem[];
  suppliers: Supplier[];
  outlets: Outlet[];
  grns: GRNEntry[];
  currentOutletId: string;
  onDeleteProduct: (id: string) => void;
  onEditProduct?: (product: ProductItem) => void;
  onOpenAddProduct: () => void;
  onOpenAddGRN: () => void;
  searchTerm: string;
  dbError?: string | null;
  onRetryConnection?: () => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  suppliers,
  outlets,
  grns,
  currentOutletId,
  onDeleteProduct,
  onEditProduct,
  onOpenAddProduct,
  onOpenAddGRN,
  searchTerm,
  dbError,
  onRetryConnection,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'grns'>('catalog');

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getOutletName = (id: string) => outlets.find(o => o.id === id)?.name || 'Outlet';

  return (
    <div className="p-8 space-y-6">
      {/* Database Error Banner if MongoDB Atlas is disconnected */}
      {dbError && (
        <div className="bg-red-950/80 border border-red-800 rounded-2xl p-5 flex items-center justify-between text-red-200 shadow-xl">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-900/60 border border-red-700/60 flex items-center justify-center text-red-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                MongoDB Connection Required
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-red-900 text-red-300 border border-red-700">
                  wowtek_oms
                </span>
              </h4>
              <p className="text-xs text-red-300/90 mt-0.5">
                {dbError}
              </p>
            </div>
          </div>
          {onRetryConnection && (
            <button
              onClick={onRetryConnection}
              className="flex items-center space-x-1.5 bg-red-900/80 hover:bg-red-800 border border-red-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'catalog'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Products Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('grns')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'grns'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            GRN Batches ({grns.length})
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenAddProduct}
            className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>New Product</span>
          </button>
          <button
            onClick={onOpenAddGRN}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-purple-600/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create GRN (Stock Batch)</span>
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-800">
              <tr>
                <th className="px-6 py-4">SKU / Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Cost / Selling Price</th>
                <th className="px-6 py-4">Stock Breakdown</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(prod => {
                  const sup = suppliers.find(s => s.id === prod.supplierId);
                  return (
                    <tr key={prod.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white mb-0.5">{prod.name}</div>
                        <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {prod.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs">
                          {prod.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-400 text-xs">
                        {sup?.name || 'Primary Supplier'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        <div className="text-zinc-400">Cost: {formatCurrency(prod.costPrice)}</div>
                        <div className="text-white font-bold">Sell: {formatCurrency(prod.sellingPrice)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          {outlets.map(o => (
                            <div key={o.id} className="flex items-center justify-between gap-4 text-zinc-300">
                              <span>{o.name}:</span>
                              <span className="font-bold text-purple-400">{prod.stockByOutlet[o.id] || 0}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        {onEditProduct && (
                          <button
                            onClick={() => onEditProduct(prod)}
                            className="text-zinc-400 hover:text-purple-300 p-2 rounded-lg hover:bg-zinc-900 transition-colors"
                            title="Edit Product (PUT /api/products/:id)"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteProduct(prod.id)}
                          className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-900 transition-colors"
                          title="Delete Product (DELETE /api/products/:id)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-zinc-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                    <p className="text-sm font-medium text-zinc-400">No products in catalog</p>
                    <p className="text-xs text-zinc-600 mt-1 max-w-sm mx-auto">
                      {dbError ? 'Cannot load products due to database connection error.' : 'Click "New Product" or "Create GRN" to add inventory.'}
                    </p>
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
                <th className="px-6 py-4">Batch / Date</th>
                <th className="px-6 py-4">Outlet</th>
                <th className="px-6 py-4">Supplier</th>
                <th className="px-6 py-4">Items Received</th>
                <th className="px-6 py-4">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {grns.length > 0 ? (
                grns.map(grn => {
                  const sup = suppliers.find(s => s.id === grn.supplierId);
                  const outlet = outlets.find(o => o.id === grn.outletId);
                  return (
                    <tr key={grn.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-white mb-0.5">{grn.batchNumber}</div>
                        <span className="text-xs text-zinc-500">{new Date(grn.date).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">
                        {outlet?.name || 'Main Hub'}
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {sup?.name || 'Supplier'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          {grn.items.map((item, idx) => (
                            <div key={idx} className="text-zinc-300">
                              <span className="font-semibold text-white">{item.productName}</span>: {item.quantity} units @ {formatCurrency(item.costPrice)}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-purple-400">
                        {formatCurrency(grn.totalAmount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-zinc-500">
                    <p className="text-sm font-medium">No Goods Received Notes (GRN) found</p>
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
