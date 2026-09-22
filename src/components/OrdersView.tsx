/**
 * WOWTEK OMS — Order Management Module
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Truck,
  FileText,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Package,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Clock,
  Printer,
  Copy,
  Plus,
} from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { ChannelSource, Order, OrderStatus } from '../types';

interface OrdersViewProps {
  selectedOrder?: Order | null;
  setSelectedOrder?: (order: Order | null) => void;
  onOpenNewOrderModal?: () => void;
  globalSearchQuery?: string;
}

const STATUS_TABS: { label: string; value: OrderStatus | 'ALL' }[] = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'New', value: 'NEW' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Ready to Ship', value: 'READY_TO_SHIP' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const CHANNEL_OPTIONS: { label: string; value: ChannelSource | 'ALL' }[] = [
  { label: 'All Channels', value: 'ALL' },
  { label: 'Website (wowtek.lk)', value: 'WEBSITE' },
  { label: 'PickMe', value: 'PICKME' },
  { label: 'Uber Eats', value: 'UBER_EATS' },
  { label: 'Manual / POS', value: 'MANUAL' },
];

export const OrdersView: React.FC<OrdersViewProps> = ({
  selectedOrder: propSelectedOrder,
  setSelectedOrder: propSetSelectedOrder,
  onOpenNewOrderModal,
  globalSearchQuery = '',
}) => {
  const [internalSelectedOrder, setInternalSelectedOrder] = useState<Order | null>(null);
  const selectedOrder = propSelectedOrder !== undefined ? propSelectedOrder : internalSelectedOrder;
  const setSelectedOrder = propSetSelectedOrder || setInternalSelectedOrder;

  const {
    orders,
    updateOrderStatus,
    cancelOrder,
    businessSettings,
    generateInvoice,
    createWaybill,
    sendSMS,
    setPrintableInvoice,
    setPrintableWaybills,
    waybills,
    setIsNewOrderModalOpen,
  } = useOMS();

  const handleOpenNewOrder = onOpenNewOrderModal || (() => setIsNewOrderModalOpen(true));

  const [activeStatusTab, setActiveStatusTab] = useState<OrderStatus | 'ALL'>('ALL');
  const [activeChannel, setActiveChannel] = useState<ChannelSource | 'ALL'>('ALL');
  const [localSearch, setLocalSearch] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const query = (globalSearchQuery || localSearch).toLowerCase().trim();

  const showFeedback = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const formatLKR = (amount: number) => {
    return `${businessSettings.currencySymbol} ${amount.toLocaleString('en-LK')}`;
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (activeStatusTab !== 'ALL' && order.orderStatus !== activeStatusTab) {
      return false;
    }
    if (activeChannel !== 'ALL' && order.source !== activeChannel) {
      return false;
    }
    if (query) {
      const matchNum = order.orderNumber.toLowerCase().includes(query);
      const matchExt = order.externalOrderId?.toLowerCase().includes(query);
      const matchName = order.customer.name.toLowerCase().includes(query);
      const matchPhone = order.customer.phone.toLowerCase().includes(query);
      const matchTrack = order.trackingNumber?.toLowerCase().includes(query);
      const matchItems = order.items.some(
        (i) => i.name.toLowerCase().includes(query) || i.sku.toLowerCase().includes(query)
      );
      return matchNum || matchExt || matchName || matchPhone || matchTrack || matchItems;
    }
    return true;
  });

  // Actions for Order Detail
  const handleConfirm = (order: Order) => {
    updateOrderStatus(order.id, 'CONFIRMED');
    showFeedback(`Order ${order.orderNumber} confirmed & invoice auto-generated!`);
  };

  const handleMarkReadyToShip = (order: Order) => {
    updateOrderStatus(order.id, 'READY_TO_SHIP');
    showFeedback(`Order ${order.orderNumber} marked Ready to Ship! Waybill generated.`);
  };

  const handleCreateShipment = (order: Order) => {
    const wb = createWaybill(order.id, 'Trans Express', 'THERMAL_4X6');
    showFeedback(`Trans Express shipment created! Waybill: ${wb.waybillNumber}`);
  };

  const handleMarkShipped = (order: Order) => {
    const tracking = order.trackingNumber || `TEX-${Math.floor(1000000 + Math.random() * 9000000)}`;
    updateOrderStatus(order.id, 'SHIPPED', tracking, 'Trans Express');
    showFeedback(`Order ${order.orderNumber} dispatched! Customer notified via SMS.`);
  };

  const handleMarkDelivered = (order: Order) => {
    updateOrderStatus(order.id, 'DELIVERED');
    showFeedback(`Order ${order.orderNumber} marked Delivered! Official warranty registered.`);
  };

  const handleCancel = (order: Order) => {
    if (window.confirm(`Are you sure you want to cancel ${order.orderNumber}? Stock will be restocked.`)) {
      cancelOrder(order.id, 'Customer cancellation request');
      showFeedback(`Order ${order.orderNumber} cancelled and items returned to stock.`);
    }
  };

  const handlePrintInvoice = (order: Order) => {
    const inv = generateInvoice(order.id);
    setPrintableInvoice(inv);
  };

  const handlePrintWaybill = (order: Order) => {
    const existingWb = waybills.find((w) => w.orderId === order.id);
    if (existingWb) {
      setPrintableWaybills([existingWb], 'THERMAL_4X6');
    } else {
      const newWb = createWaybill(order.id, order.courier || 'Trans Express', 'THERMAL_4X6');
      setPrintableWaybills([newWb], 'THERMAL_4X6');
    }
  };

  const handleSendInvoiceSMS = async (order: Order) => {
    const invoiceNum = order.invoiceNumber || `INV-${order.orderNumber.replace('WTK-', '')}`;
    const msg = `WOWTEK: Hi ${order.customer.name}, your invoice ${invoiceNum} for order ${order.orderNumber} (Rs. ${order.totalAmount.toLocaleString()}) is available at wowtek.lk`;
    await sendSMS(order.customer.phone, order.customer.name, msg, 'INVOICE_AVAILABLE', order.orderNumber);
    showFeedback(`Invoice SMS dispatched to ${order.customer.phone}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Order Management
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Unified omnichannel orders from WooCommerce, PickMe, Uber Eats, and Colombo Store POS
          </p>
        </div>

        <button
          onClick={handleOpenNewOrder}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Manual Order</span>
        </button>
      </div>

      {/* Action Toast Feedback */}
      {actionSuccessMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Search Row */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-800">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatusTab === tab.value;
            const count =
              tab.value === 'ALL'
                ? orders.length
                : orders.filter((o) => o.orderStatus === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveStatusTab(tab.value)}
                className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'border-cyan-500 text-cyan-300 bg-neutral-900/60'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          {/* Channel Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-neutral-400 font-medium">Channel:</span>
            <select
              value={activeChannel}
              onChange={(e) => setActiveChannel(e.target.value as any)}
              className="bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-hidden focus:border-cyan-500"
            >
              {CHANNEL_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search inside Orders */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter by Order # or Name..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table & Detail Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table Column */}
        <div className={`space-y-4 ${selectedOrder ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300">
                <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
                  <tr>
                    <th className="py-3 px-3">Order Info</th>
                    <th className="py-3 px-3">Channel</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Total Amount</th>
                    <th className="py-3 px-3">Net Profit</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-sans">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-neutral-500">
                        No orders match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isSelected = selectedOrder?.id === order.id;
                      return (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrder(order)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-cyan-500/10 border-l-4 border-l-cyan-500'
                              : 'hover:bg-neutral-800/40'
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-mono font-bold text-cyan-400">
                              {order.orderNumber}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              {order.externalOrderId || 'MANUAL-POS'}
                            </div>
                            <div className="text-[9px] text-neutral-400">
                              {new Date(order.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                              {order.source}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="font-semibold text-neutral-200">
                              {order.customer.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono">
                              {order.customer.phone}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                              {order.shippingAddress.city}
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono">
                            <div className="font-bold text-white">
                              {formatLKR(order.totalAmount)}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {order.paymentMethod}
                            </div>
                          </td>

                          <td className="py-3 px-3 font-mono">
                            <div className="font-bold text-emerald-400">
                              {formatLKR(order.profit?.netProfit || 0)}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {order.profit?.profitMargin || 0}% margin
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                order.orderStatus === 'NEW'
                                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                  : order.orderStatus === 'CONFIRMED'
                                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                  : order.orderStatus === 'READY_TO_SHIP'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : order.orderStatus === 'SHIPPED'
                                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                  : order.orderStatus === 'DELIVERED'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {order.orderStatus.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <ChevronRight className="w-4 h-4 text-neutral-400 inline" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Detail Panel Column */}
        {selectedOrder && (
          <div className="lg:col-span-5 rounded-xl bg-neutral-900 border border-neutral-800 p-5 shadow-lg space-y-5 animate-in slide-in-from-right-4 duration-200">
            {/* Detail Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-lg text-white">
                    {selectedOrder.orderNumber}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {selectedOrder.source}
                  </span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {/* Status Workflow Action Buttons */}
            <div className="p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Order Workflow Controls
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedOrder.orderStatus === 'NEW' && (
                  <button
                    onClick={() => handleConfirm(selectedOrder)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Order
                  </button>
                )}

                {(selectedOrder.orderStatus === 'CONFIRMED' || selectedOrder.orderStatus === 'PROCESSING') && (
                  <button
                    onClick={() => handleMarkReadyToShip(selectedOrder)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" /> Mark Ready to Ship
                  </button>
                )}

                {selectedOrder.orderStatus === 'READY_TO_SHIP' && (
                  <button
                    onClick={() => handleMarkShipped(selectedOrder)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" /> Mark Shipped (Dispatch)
                  </button>
                )}

                {selectedOrder.orderStatus === 'SHIPPED' && (
                  <button
                    onClick={() => handleMarkDelivered(selectedOrder)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                  </button>
                )}

                {selectedOrder.orderStatus !== 'CANCELLED' && selectedOrder.orderStatus !== 'DELIVERED' && (
                  <button
                    onClick={() => handleCancel(selectedOrder)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-rose-950 text-rose-400 hover:text-rose-300 border border-neutral-700 hover:border-rose-700/50 transition-colors cursor-pointer"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Complete Profit Calculation Card (Mandatory Requirement) */}
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800/90 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Profit & Loss Calculation Breakdown
                  </span>
                </div>
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  {selectedOrder.profit?.profitMargin || 0}% Margin
                </span>
              </div>

              <div className="grid grid-cols-2 gap-y-1.5 text-xs">
                <span className="text-neutral-400">Gross Merchandise Revenue:</span>
                <span className="font-mono text-right text-neutral-200">
                  {formatLKR(selectedOrder.profit?.revenue || selectedOrder.subtotal)}
                </span>

                <span className="text-neutral-400">Discount Given:</span>
                <span className="font-mono text-right text-rose-400">
                  - {formatLKR(selectedOrder.profit?.discount || selectedOrder.discount)}
                </span>

                <span className="text-neutral-400 font-medium">Net Sales Value:</span>
                <span className="font-mono text-right text-neutral-100 font-semibold">
                  {formatLKR(selectedOrder.profit?.netRevenue || selectedOrder.totalAmount)}
                </span>

                <span className="text-neutral-400">Product Cost (COGS):</span>
                <span className="font-mono text-right text-rose-400">
                  - {formatLKR(selectedOrder.profit?.productCost || 0)}
                </span>

                <div className="col-span-2 border-t border-neutral-800/80 my-1" />

                <span className="text-neutral-300 font-semibold">Gross Profit:</span>
                <span className="font-mono text-right text-neutral-100 font-bold">
                  {formatLKR(selectedOrder.profit?.grossProfit || 0)}
                </span>

                {/* Fees Deductions */}
                <span className="text-neutral-400">
                  Platform Commission ({selectedOrder.source}):
                </span>
                <span className="font-mono text-right text-amber-400">
                  - {formatLKR(selectedOrder.profit?.platformCommission || 0)}
                </span>

                <span className="text-neutral-400">
                  Payment Processing Fee ({selectedOrder.paymentMethod}):
                </span>
                <span className="font-mono text-right text-amber-400">
                  - {formatLKR(selectedOrder.profit?.paymentFee || 0)}
                </span>

                <span className="text-neutral-400">Courier / Shipping Cost:</span>
                <span className="font-mono text-right text-amber-400">
                  - {formatLKR(selectedOrder.profit?.courierFee || 0)}
                </span>

                <span className="text-neutral-400">Packaging & Other Costs:</span>
                <span className="font-mono text-right text-amber-400">
                  - {formatLKR(selectedOrder.profit?.otherCosts || 0)}
                </span>

                <div className="col-span-2 border-t border-neutral-800 my-1" />

                <span className="text-emerald-300 font-black text-sm">Net Order Profit:</span>
                <span className="font-mono text-right text-emerald-400 font-black text-sm">
                  {formatLKR(selectedOrder.profit?.netProfit || 0)}
                </span>
              </div>
            </div>

            {/* Customer & Delivery Information */}
            <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 space-y-2 text-xs">
              <div className="font-bold text-neutral-200">Customer & Shipping Information</div>
              <div className="space-y-1 text-neutral-300">
                <div className="font-semibold text-white">{selectedOrder.customer.name}</div>
                <div className="font-mono text-cyan-400">{selectedOrder.customer.phone}</div>
                {selectedOrder.customer.email && (
                  <div className="text-neutral-400">{selectedOrder.customer.email}</div>
                )}
                <div className="text-neutral-400 pt-1">
                  {selectedOrder.shippingAddress.addressLine1}, {selectedOrder.shippingAddress.city},{' '}
                  {selectedOrder.shippingAddress.country}
                </div>
              </div>

              {/* Courier & Tracking Details */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                <span className="text-neutral-400">Courier Partner:</span>
                <span className="font-semibold text-neutral-200">
                  {selectedOrder.courier || 'Trans Express'}
                </span>
              </div>
              {selectedOrder.trackingNumber && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Tracking Number:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {selectedOrder.trackingNumber}
                  </span>
                </div>
              )}
              {selectedOrder.waybillNumber && (
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-400">Waybill Consignment:</span>
                  <span className="font-mono text-purple-400 font-bold">
                    {selectedOrder.waybillNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Line Items Table */}
            <div className="space-y-2">
              <div className="font-bold text-xs text-neutral-200">Ordered Products</div>
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-neutral-950/80 border border-neutral-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-neutral-200">{item.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        SKU: {item.sku} • Cost: {formatLKR(item.unitCost)}
                      </div>
                      {item.serialNumber && (
                        <div className="text-[10px] text-cyan-400 font-mono">
                          SN: {item.serialNumber}
                        </div>
                      )}
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-white">
                        {item.quantity} × {formatLKR(item.unitPrice)}
                      </div>
                      <div className="text-[10px] text-emerald-400">
                        Gross: +{formatLKR(item.grossProfit)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions (Print Invoice, Waybill, Send SMS) */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => handlePrintInvoice(selectedOrder)}
                className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Print Invoice</span>
              </button>

              <button
                onClick={() => handlePrintWaybill(selectedOrder)}
                className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-purple-400" />
                <span>Print Waybill</span>
              </button>

              <button
                onClick={() => handleSendInvoiceSMS(selectedOrder)}
                className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>SMS Invoice</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
