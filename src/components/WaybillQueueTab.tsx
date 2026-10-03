import React, { useState } from 'react';
import { 
  Truck, 
  Printer, 
  CheckSquare, 
  Square, 
  Search, 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { Order } from '../types';
import { formatCurrency } from '../utils/storage';

interface WaybillQueueTabProps {
  orders: Order[];
  onUpdateCourierStatus: (orderId: string, status: string) => void;
  onBulkUpdateCourierStatus: (orderIds: string[], status: string) => void;
  onViewWaybill: (order: Order) => void;
  searchTerm: string;
}

export const WaybillQueueTab: React.FC<WaybillQueueTabProps> = ({
  orders,
  onUpdateCourierStatus,
  onBulkUpdateCourierStatus,
  onViewWaybill,
  searchTerm,
}) => {
  const [filterMode, setFilterMode] = useState<'pending' | 'dispatched' | 'all'>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkPrintModalOpen, setIsBulkPrintModalOpen] = useState(false);

  // Filter only orders with Trans Express waybills
  const waybillOrders = orders.filter(o => 
    o.waybillNumber && 
    o.waybillNumber !== 'No Waybill Required' &&
    o.waybillNumber.startsWith('TE-')
  );

  const filteredOrders = waybillOrders.filter(o => {
    const isDispatched = o.courierStatus === 'Dispatched' || o.courierStatus === 'In Transit' || o.courierStatus === 'Delivered';
    const matchesFilter = 
      filterMode === 'all' ||
      (filterMode === 'pending' && !isDispatched) ||
      (filterMode === 'dispatched' && isDispatched);

    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.waybillNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone.includes(searchTerm) ||
      o.customerAddress.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handlePrintSelected = () => {
    if (selectedIds.length === 0) {
      alert('Please select at least one waybill order to print.');
      return;
    }
    // Open bulk print view
    setIsBulkPrintModalOpen(true);
  };

  const confirmPrintAndDispatch = () => {
    window.print();
    onBulkUpdateCourierStatus(selectedIds, 'Dispatched');
    setSelectedIds([]);
    setIsBulkPrintModalOpen(false);
  };

  const pendingCount = waybillOrders.filter(o => o.courierStatus !== 'Dispatched' && o.courierStatus !== 'Delivered').length;
  const dispatchedCount = waybillOrders.filter(o => o.courierStatus === 'Dispatched' || o.courierStatus === 'Delivered').length;

  const selectedOrdersToPrint = waybillOrders.filter(o => selectedIds.includes(o.id));

  return (
    <div className="p-8 space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-950 p-6 rounded-2xl border border-purple-500/20 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Trans Express Waybill Queue
              <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                Official Logistics Gateway
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Print official courier shipping stickers and dispatch orders automatically
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handlePrintSelected}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Selected Labels ({selectedIds.length}) & Mark Dispatched</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'pending'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Pending Dispatch ({pendingCount})
          </button>
          <button
            onClick={() => setFilterMode('dispatched')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'dispatched'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Dispatched ({dispatchedCount})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Waybills ({waybillOrders.length})
          </button>
        </div>

        {filteredOrders.length > 0 && (
          <div className="flex items-center space-x-3 text-xs text-zinc-400">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-1.5 hover:text-zinc-200 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800"
            >
              {selectedIds.length === filteredOrders.length ? (
                <>
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  <span>Select All ({filteredOrders.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Waybills Table / Queue */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-900/80 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                      onChange={handleSelectAll}
                      className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500 bg-zinc-800 cursor-pointer"
                    />
                  </th>
                  <th className="p-4">Waybill & Order</th>
                  <th className="p-4">Customer & Destination</th>
                  <th className="p-4">Items & COD Amount</th>
                  <th className="p-4">Courier Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredOrders.map(order => {
                  const isSelected = selectedIds.includes(order.id);
                  const isDispatched = order.courierStatus === 'Dispatched' || order.courierStatus === 'Delivered';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleToggleSelect(order.id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? 'bg-purple-950/20' : 'hover:bg-zinc-900/50'
                      }`}
                    >
                      <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(order.id)}
                          className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500 bg-zinc-800 cursor-pointer"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-purple-400 font-bold bg-purple-950/40 border border-purple-800/50 px-2 py-0.5 rounded text-xs">
                            {order.waybillNumber}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-400 font-mono mt-1">
                          Ref: {order.orderNumber}
                        </div>
                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-semibold text-white">{order.customerName}</div>
                        <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {order.customerPhone}
                        </div>
                        <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 line-clamp-1 max-w-xs">
                          <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                          {order.customerAddress}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="text-xs text-zinc-300">
                          {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                        </div>
                        <div className="text-sm font-bold text-emerald-400 mt-1">
                          COD: {formatCurrency(order.totalAmount)}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isDispatched
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isDispatched ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                          {order.courierStatus || 'Pending Dispatch'}
                        </span>
                      </td>

                      <td className="p-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onViewWaybill(order)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Label</span>
                        </button>

                        {!isDispatched ? (
                          <button
                            onClick={() => {
                              onUpdateCourierStatus(order.id, 'Dispatched');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/30 text-xs font-medium text-purple-300 hover:bg-purple-600 hover:text-white transition-colors inline-flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onUpdateCourierStatus(order.id, 'Pending Dispatch');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-zinc-500 space-y-3">
            <Truck className="w-12 h-12 mx-auto text-zinc-700" />
            <p className="text-base font-medium text-zinc-400">No waybills found in this filter</p>
            <p className="text-xs text-zinc-600 max-w-sm mx-auto">
              Simulate or receive WooCommerce Website orders to automatically generate Trans Express courier waybills in this queue.
            </p>
          </div>
        )}
      </div>

      {/* Bulk Print Waybill Labels Modal */}
      {isBulkPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white text-zinc-900 border border-zinc-300 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl print:border-none print:shadow-none print:p-0 print:max-w-none">
            {/* Header (hidden in print) */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-200 print:hidden">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-lg text-zinc-900">
                  Ready to Print {selectedOrdersToPrint.length} Courier Waybills
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={confirmPrintAndDispatch}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-lg transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print All & Mark Dispatched</span>
                </button>
                <button
                  onClick={() => setIsBulkPrintModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Printable Stickers Sheet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
              {selectedOrdersToPrint.map(order => (
                <div
                  key={order.id}
                  className="border-2 border-zinc-900 rounded-xl p-5 bg-white text-zinc-900 space-y-4 print:border-black print:break-inside-avoid"
                >
                  {/* Waybill Header */}
                  <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-3">
                    <div>
                      <div className="font-black text-lg text-purple-800 tracking-tight">TRANS EXPRESS</div>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase">COURIER & LOGISTICS - LK</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold bg-zinc-100 border border-zinc-300 px-2 py-0.5 rounded text-purple-700">
                        {order.waybillNumber}
                      </div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Ref: {order.orderNumber}</div>
                    </div>
                  </div>

                  {/* Mock Barcode Graphic */}
                  <div className="bg-zinc-50 p-2 rounded-lg border border-dashed border-zinc-400 text-center">
                    <div className="font-mono text-xl tracking-[0.25em] font-bold text-zinc-900">
                      ||| | |||| || ||| || |||||| |
                    </div>
                    <span className="font-mono text-[10px] text-zinc-600">{order.waybillNumber}</span>
                  </div>

                  {/* Consignee */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-xs space-y-1">
                    <div className="text-[10px] font-bold uppercase text-zinc-500">Deliver To (Consignee):</div>
                    <div className="font-bold text-sm text-zinc-900">{order.customerName}</div>
                    <div className="text-zinc-700 font-medium">{order.customerAddress}</div>
                    <div className="text-zinc-800 font-bold">Tel: {order.customerPhone}</div>
                  </div>

                  {/* Items summary & COD */}
                  <div className="flex justify-between items-center bg-zinc-100 p-3 rounded-lg border border-zinc-300 text-xs">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Payment Type</span>
                      <span className="font-bold text-zinc-800">Cash on Delivery</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block">Collect COD</span>
                      <span className="text-base font-black text-purple-700">{formatCurrency(order.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Sender Note */}
                  <div className="text-[9px] text-zinc-500 flex justify-between border-t border-zinc-200 pt-2">
                    <span>Sender: WOWTEK (PVT) LTD (011-2345678)</span>
                    <span>Date: {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
