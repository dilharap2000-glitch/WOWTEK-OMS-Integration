/**
 * WOWTEK OMS — Courier Shipments & Batch Waybills Module
 * Business: WOWTEK (wowtek.lk)
 * Physical Thermal Label: 100mm x 150mm (4x6"), 203 DPI
 */

import React, { useState } from 'react';
import {
  Truck,
  Printer,
  CheckSquare,
  Square,
  Search,
  ExternalLink,
  Plus,
  Edit2,
  Barcode as BarcodeIcon,
  Package,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { Waybill } from '../types';
import { Barcode } from './Barcode';
import { formatCurrency, formatNumber, formatDate } from '../lib/formatters';

export const WaybillsView: React.FC = () => {
  const {
    waybills,
    orders,
    createWaybill,
    updateWaybill,
    updateWaybillStatus,
    setPrintableWaybills,
  } = useOMS();

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formatOption, setFormatOption] = useState<'THERMAL_4X6' | 'A4'>('THERMAL_4X6');
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [editingWaybill, setEditingWaybill] = useState<Waybill | null>(null);

  // STRICT BUSINESS RULE: Only WEBSITE orders can appear in the "Ready for Waybill" queue
  const readyOrders = orders.filter((o) => o.source === 'WEBSITE' && !o.waybillNumber);
  const [selectedOrderId, setSelectedOrderId] = useState(readyOrders[0]?.id || '');

  // Manual entry state for create modal
  const [useManualNumber, setUseManualNumber] = useState(false);
  const [manualWaybillNumber, setManualWaybillNumber] = useState('');
  const [manualTrackingNumber, setManualTrackingNumber] = useState('');
  const [courierSelection, setCourierSelection] = useState('Trans Express');

  // Edit modal state
  const [editWbNumber, setEditWbNumber] = useState('');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editCourierName, setEditCourierName] = useState('Trans Express');

  // Only waybills belonging to WEBSITE orders can appear in the waybills list and batch printing
  const websiteWaybills = waybills.filter((wb) => {
    const parentOrder = orders.find((o) => o.id === wb.orderId || o.orderNumber === wb.orderNumber);
    return !parentOrder || parentOrder.source === 'WEBSITE';
  });

  const filteredWaybills = websiteWaybills.filter((wb) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        wb.waybillNumber.toLowerCase().includes(q) ||
        (wb.trackingNumber && wb.trackingNumber.toLowerCase().includes(q)) ||
        wb.orderNumber.toLowerCase().includes(q) ||
        wb.customerName.toLowerCase().includes(q) ||
        wb.customerPhone.includes(q) ||
        wb.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredWaybills.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredWaybills.map((wb) => wb.id));
    }
  };

  // STRICT BUSINESS RULE: Batch printing must only include WEBSITE orders
  const handlePrintBatch = () => {
    const toPrint = websiteWaybills.filter((w) => selectedIds.includes(w.id));
    if (toPrint.length === 0) return;
    setPrintableWaybills(toPrint, formatOption);
  };

  const handlePrintSingle = (wb: Waybill) => {
    setPrintableWaybills([wb], formatOption);
  };

  const handleOpenCreateModal = () => {
    const defaultOrder = readyOrders[0];
    if (defaultOrder) {
      setSelectedOrderId(defaultOrder.id);
    }
    setUseManualNumber(false);
    setManualWaybillNumber('');
    setManualTrackingNumber('');
    setCourierSelection('Trans Express');
    setIsCreatingShipment(true);
  };

  const handleQuickCreate = () => {
    const orderToCreate = readyOrders.find((o) => o.id === selectedOrderId) || readyOrders[0];
    if (!orderToCreate) return;

    createWaybill(
      orderToCreate.id,
      courierSelection,
      formatOption,
      useManualNumber ? manualWaybillNumber : undefined,
      useManualNumber ? manualTrackingNumber : undefined
    );
    setIsCreatingShipment(false);
  };

  const handleOpenEdit = (wb: Waybill) => {
    setEditingWaybill(wb);
    setEditWbNumber(wb.waybillNumber);
    setEditTrackingNumber(wb.trackingNumber || '');
    setEditCourierName(wb.courierName || 'Trans Express');
  };

  const handleSaveEdit = () => {
    if (!editingWaybill) return;
    updateWaybill(editingWaybill.id, {
      waybillNumber: editWbNumber.trim() || editingWaybill.waybillNumber,
      trackingNumber: editTrackingNumber.trim() || editingWaybill.trackingNumber,
      courierName: editCourierName,
    });
    setEditingWaybill(null);
  };

  const activeCreateOrder = readyOrders.find((o) => o.id === selectedOrderId) || readyOrders[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Waybills & Courier Logistics
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
              TRANS EXPRESS HUB
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Strict 100mm × 150mm (4×6") thermal label printing, sequential batch dispatch & COD tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Format selection */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setFormatOption('THERMAL_4X6')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                formatOption === 'THERMAL_4X6'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              100×150mm Thermal (4×6")
            </button>
            <button
              onClick={() => setFormatOption('A4')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                formatOption === 'A4'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              A4 Sheet
            </button>
          </div>

          <button
            onClick={handlePrintBatch}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-cyan-500/30 transition-colors disabled:opacity-40 cursor-pointer"
            title="Batch print all selected waybills sequentially on 100x150mm pages"
          >
            <Printer className="w-4 h-4" />
            <span>Print Selected ({selectedIds.length})</span>
          </button>

          {readyOrders.length > 0 && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dispatch Order ({readyOrders.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Courier & Business Rules Notice */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Courier Integration: Trans Express Logistics</span>
              <span className="text-[10px] font-mono font-normal text-cyan-400 bg-cyan-950 px-1.5 py-0.2 rounded border border-cyan-800">
                Manual / Official API Ready
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] mt-0.5">
              Waybills are strictly restricted to <strong>Website / WooCommerce</strong> orders. Manual waybill numbers from pre-printed Trans Express slips are supported until live API webhooks connect.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-white">{websiteWaybills.length} Dispatches</div>
            <div className="text-[10px] text-neutral-400">100×150mm Thermal Ready</div>
          </div>
        </div>
      </div>

      {/* Search & Bulk Select Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:bg-neutral-800 cursor-pointer"
          >
            {selectedIds.length === filteredWaybills.length && filteredWaybills.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-cyan-400" />
            ) : (
              <Square className="w-4 h-4 text-neutral-500" />
            )}
            <span>Select All ({filteredWaybills.length})</span>
          </button>

          {selectedIds.length > 0 && (
            <span className="text-xs text-neutral-400 font-mono">
              {selectedIds.length} label{selectedIds.length > 1 ? 's' : ''} queued for batch print
            </span>
          )}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Waybill #, Tracking, Order, Phone..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Waybills Table */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-3 w-8">#</th>
                <th className="py-3 px-3">Waybill & Tracking</th>
                <th className="py-3 px-3">Order Ref</th>
                <th className="py-3 px-3">Recipient & City</th>
                <th className="py-3 px-3">COD Amount</th>
                <th className="py-3 px-3">Courier</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredWaybills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-neutral-500">
                    No waybills found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredWaybills.map((wb) => {
                  const isSelected = selectedIds.includes(wb.id);
                  return (
                    <tr
                      key={wb.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-cyan-500/10' : 'hover:bg-neutral-800/40'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleSelect(wb.id)}
                          className="text-neutral-400 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-600" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                          <BarcodeIcon className="w-3.5 h-3.5 text-cyan-500" />
                          <span>{wb.waybillNumber}</span>
                        </div>
                        {wb.trackingNumber && (
                          <div className="text-[10px] text-neutral-400">
                            TRK: <span className="text-neutral-300 font-semibold">{wb.trackingNumber}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-neutral-500">
                          {formatDate(wb.createdAt, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-medium text-white">
                        <div>{wb.orderNumber}</div>
                        {wb.externalOrderId && (
                          <div className="text-[10px] text-neutral-400">{wb.externalOrderId}</div>
                        )}
                        {wb.isFragile && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            FRAGILE
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-200">{wb.customerName}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">{wb.customerPhone}</div>
                        <div className="text-[10px] text-neutral-400 truncate max-w-[170px]">
                          {wb.city}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        {wb.codAmount > 0 ? (
                          <div>
                            <span className="font-black text-amber-400 block">
                              Rs. {formatNumber(wb.codAmount)}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-amber-500">COLLECT CASH</span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            PREPAID
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-200 border border-neutral-700 inline-flex items-center gap-1">
                          <span>{wb.courierName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={wb.status}
                          onChange={(e) => updateWaybillStatus(wb.id, e.target.value as any)}
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-200 cursor-pointer"
                        >
                          <option value="CREATED">CREATED</option>
                          <option value="PICKED_UP">PICKED UP</option>
                          <option value="IN_TRANSIT">IN TRANSIT</option>
                          <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="FAILED">FAILED / RETURNED</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handlePrintSingle(wb)}
                            className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold flex items-center gap-1 border border-neutral-700 cursor-pointer"
                            title="Print 100mm x 150mm waybill label"
                          >
                            <Printer className="w-3 h-3 text-cyan-400" />
                            <span>Print</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(wb)}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
                            title="Edit waybill / manual tracking number"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {wb.courierTrackingUrl && (
                            <a
                              href={wb.courierTrackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
                              title="Open Trans Express Tracking"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Create Shipment Modal */}
      {isCreatingShipment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95">
            <button
              onClick={() => setIsCreatingShipment(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-white mb-1">Generate Dispatch Consignment</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Create 100mm × 150mm thermal shipping label for Trans Express courier pickup
            </p>

            <div className="space-y-4">
              {/* Order selector */}
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Select Order (Website / WooCommerce only)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                >
                  {readyOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.customer.name} ({o.shippingAddress.city}) — Rs. {formatNumber(o.totalAmount)} ({o.paymentMethod})
                    </option>
                  ))}
                </select>
              </div>

              {/* Courier Partner Field (As requested in spec) */}
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Courier Partner</label>
                <div className="relative">
                  <select
                    value={courierSelection}
                    onChange={(e) => setCourierSelection(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-semibold"
                  >
                    <option value="Trans Express">Trans Express (Domestic Logistics Hub)</option>
                    <option value="Trans Express Express">Trans Express (Same-Day Express)</option>
                  </select>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Until official Trans Express API is live, waybill and tracking numbers are generated automatically or can be keyed manually.
                </p>
              </div>

              {/* Manual Entry Toggle */}
              <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Manual Waybill Number Entry</div>
                    <div className="text-[11px] text-neutral-400">
                      Use pre-printed physical barcode slip provided by Trans Express
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useManualNumber}
                    onChange={(e) => setUseManualNumber(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                </div>

                {useManualNumber ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-neutral-800">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Waybill Number</label>
                      <input
                        type="text"
                        placeholder="e.g. WB-TEX-2026-9402"
                        value={manualWaybillNumber}
                        onChange={(e) => setManualWaybillNumber(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Tracking Number</label>
                      <input
                        type="text"
                        placeholder="e.g. TEX-9081234"
                        value={manualTrackingNumber}
                        onChange={(e) => setManualTrackingNumber(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-cyan-400 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Auto-assigning official Trans Express numbering sequence</span>
                  </div>
                )}
              </div>

              {/* Live Barcode Preview Box */}
              <div className="p-3 rounded-xl bg-white text-black border border-neutral-300 text-center">
                <div className="text-[10px] font-mono font-bold text-neutral-700 uppercase mb-1">
                  Code128 Barcode Verification Preview
                </div>
                <Barcode
                  value={
                    useManualNumber && manualWaybillNumber.trim()
                      ? manualWaybillNumber.trim()
                      : `WB-TEX-2026-${activeCreateOrder?.orderNumber.replace(/[^0-9]/g, '') || '9041'}`
                  }
                  height={38}
                  width={1.6}
                  displayValue={true}
                  className="mx-auto"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleQuickCreate}
                  className="w-full py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                >
                  Create Waybill & Assign Trans Express Consignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Edit Waybill Details Modal */}
      {editingWaybill && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95">
            <button
              onClick={() => setEditingWaybill(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-white mb-1">Edit Consignment Details</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Update manual waybill # or tracking number for order {editingWaybill.orderNumber}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Waybill Number</label>
                <input
                  type="text"
                  value={editWbNumber}
                  onChange={(e) => setEditWbNumber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Tracking Number</label>
                <input
                  type="text"
                  value={editTrackingNumber}
                  onChange={(e) => setEditTrackingNumber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Courier</label>
                <input
                  type="text"
                  value={editCourierName}
                  onChange={(e) => setEditCourierName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              {/* Barcode verification */}
              <div className="p-3 rounded-xl bg-white text-black border border-neutral-300 text-center">
                <Barcode value={editWbNumber || 'WB-EMPTY'} height={36} width={1.5} displayValue={true} />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWaybill(null)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
