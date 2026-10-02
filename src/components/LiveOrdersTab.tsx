import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Truck, 
  Printer, 
  Trash2, 
  CheckSquare, 
  Square
} from 'lucide-react';
import { Order, OrderStatus, Outlet } from '../types';
import { formatCurrency } from '../utils/storage';

interface LiveOrdersTabProps {
  orders: Order[];
  outlets: Outlet[];
  currentOutletId: string;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onDeleteOrder: (orderId: string) => void;
  onBulkDeleteOrders: (orderIds: string[]) => void;
  onViewWaybill: (order: Order) => void;
  searchTerm: string;
}

export const LiveOrdersTab: React.FC<LiveOrdersTabProps> = ({
  orders,
  outlets,
  currentOutletId,
  onUpdateOrderStatus,
  onDeleteOrder,
  onBulkDeleteOrders,
  onViewWaybill,
  searchTerm,
}) => {
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string>('All');

  const filteredOrders = orders.filter(order => {
    const matchesOutlet = currentOutletId === 'all' || order.outletId === currentOutletId;
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    const matchesSource = sourceFilter === 'All' || order.source === sourceFilter;
    return matchesOutlet && matchesSearch && matchesSource;
  });

  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter(i => i !== id));
    } else {
      setSelectedOrderIds([...selectedOrderIds, id]);
    }
  };

  const handleBulkPrintWaybills = () => {
    const websiteOrdersWithWaybill = orders.filter(o => selectedOrderIds.includes(o.id) && (o.source === 'Website' || o.source === 'WooCommerce'));
    if (websiteOrdersWithWaybill.length === 0) {
      alert('Please select at least one Website / WooCommerce order to print waybills.');
      return;
    }
    window.print();
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'Website':
      case 'WooCommerce':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">🌐 {source}</span>;
      case 'PickMe':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">🛵 PickMe</span>;
      case 'Uber':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">🚗 Uber</span>;
      default:
        return null;
    }
  };

  const getOutletName = (id: string) => outlets.find(o => o.id === id)?.name || 'Outlet';

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          {['All', 'Website', 'WooCommerce', 'PickMe', 'Uber'].map(src => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                sourceFilter === src
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {src === 'All' ? 'All Channels' : src}
            </button>
          ))}
        </div>

        {selectedOrderIds.length > 0 && (
          <div className="flex items-center space-x-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl">
            <span className="text-xs text-zinc-400">{selectedOrderIds.length} selected</span>
            <button
              onClick={handleBulkPrintWaybills}
              className="flex items-center space-x-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Bulk Print Waybills</span>
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete ${selectedOrderIds.length} selected orders?`)) {
                  onBulkDeleteOrders(selectedOrderIds);
                  setSelectedOrderIds([]);
                }
              }}
              className="flex items-center space-x-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4 w-10">
                <button onClick={handleSelectAll} className="text-zinc-400 hover:text-white">
                  {selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="px-6 py-4">Order / Outlet</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Items</th>
              <th className="px-6 py-4">Total Amount</th>
              <th className="px-6 py-4">Net Profit</th>
              <th className="px-6 py-4">Waybill</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => {
                const isSelected = selectedOrderIds.includes(order.id);
                return (
                  <tr key={order.id} className={`hover:bg-zinc-900/60 transition-colors ${isSelected ? 'bg-purple-950/20' : ''}`}>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleSelect(order.id)} className="text-zinc-400 hover:text-white">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-white mb-0.5">{order.orderNumber}</div>
                      <div className="text-[11px] text-purple-400 mb-1">{getOutletName(order.outletId)}</div>
                      <div>{getSourceBadge(order.source)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-200">{order.customerName}</div>
                      <div className="text-xs text-zinc-400">{order.customerPhone}</div>
                      <div className="text-xs text-zinc-500 truncate max-w-xs">{order.customerAddress}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-0.5">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-zinc-300">
                            • {item.productName} <span className="text-purple-400 font-semibold">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {formatCurrency(order.netProfit)}
                    </td>
                    <td className="px-6 py-4">
                      {order.source === 'Website' || order.source === 'WooCommerce' ? (
                        <button
                          onClick={() => onViewWaybill(order)}
                          className="flex items-center space-x-1 text-xs font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2.5 py-1.5 rounded-lg border border-purple-500/20 transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span className="font-mono">{order.waybillNumber}</span>
                        </button>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded bg-zinc-900 text-zinc-500 border border-zinc-800">
                          No Waybill Required
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border focus:outline-none ${
                          order.status === 'Delivered' 
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : order.status === 'Processing'
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            : order.status === 'Cancelled' || order.status === 'Refunded'
                            ? 'bg-red-500/15 text-red-300 border-red-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <option value="Pending" className="bg-zinc-900 text-zinc-300">Pending</option>
                        <option value="Processing" className="bg-zinc-900 text-zinc-300">Processing</option>
                        <option value="Shipped" className="bg-zinc-900 text-zinc-300">Shipped</option>
                        <option value="Delivered" className="bg-zinc-900 text-zinc-300">Delivered</option>
                        <option value="Cancelled" className="bg-zinc-900 text-zinc-300">Cancelled</option>
                        <option value="Refunded" className="bg-zinc-900 text-zinc-300">Refunded</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onDeleteOrder(order.id)}
                        className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-900 transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-16 text-zinc-500">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm font-medium">No live orders found</p>
                  <p className="text-xs text-zinc-600 mt-1">Click "Simulate Incoming Order" to test WooCommerce, PickMe or Uber orders.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
