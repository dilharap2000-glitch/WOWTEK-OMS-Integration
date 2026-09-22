/**
 * WOWTEK OMS — Courier Shipments & Batch Waybills Module
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import {
  Truck,
  Printer,
  CheckSquare,
  Square,
  Search,
  ExternalLink,
  RotateCcw,
  Plus,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { Waybill } from '../types';

export const WaybillsView: React.FC = () => {
  const {
    waybills,
    orders,
    createWaybill,
    updateWaybillStatus,
    setPrintableWaybills,
    businessSettings,
    integrations,
  } = useOMS();

  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [formatOption, setFormatOption] = useState<'THERMAL_4X6' | 'A4'>('THERMAL_4X6');
  const [isCreatingShipment, setIsCreatingShipment] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(orders[0]?.id || '');

  const filteredWaybills = waybills.filter((wb) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        wb.waybillNumber.toLowerCase().includes(q) ||
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

  const handlePrintBatch = () => {
    const toPrint = waybills.filter((w) => selectedIds.includes(w.id));
    if (toPrint.length === 0) return;
    setPrintableWaybills(toPrint, formatOption);
  };

  const handlePrintSingle = (wb: Waybill) => {
    setPrintableWaybills([wb], formatOption);
  };

  const handleQuickCreate = () => {
    if (!selectedOrderId) return;
    createWaybill(selectedOrderId, 'Trans Express', formatOption);
    setIsCreatingShipment(false);
  };

  // Available orders ready for waybill
  const readyOrders = orders.filter((o) => !o.waybillNumber);

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
              TRANS EXPRESS PARTNER
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Bulk dispatch labels, COD payment tracking, and automated tracking SMS notifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Format selection */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setFormatOption('THERMAL_4X6')}
              className={`px-2 py-1 rounded font-semibold transition-colors ${
                formatOption === 'THERMAL_4X6'
                  ? 'bg-cyan-500/20 text-cyan-300'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Thermal (4×6")
            </button>
            <button
              onClick={() => setFormatOption('A4')}
              className={`px-2 py-1 rounded font-semibold transition-colors ${
                formatOption === 'A4'
                  ? 'bg-cyan-500/20 text-cyan-300'
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
          >
            <Printer className="w-4 h-4" />
            <span>Print Batch ({selectedIds.length})</span>
          </button>

          {readyOrders.length > 0 && (
            <button
              onClick={() => setIsCreatingShipment(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Dispatch Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Integration Notice */}
      <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-neutral-300">
            Trans Express Logistics: Connected via official Sri Lanka API endpoint. Automatic webhook tracking enabled.
          </span>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          ONLINE
        </span>
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
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Waybill #, Customer, Phone..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500"
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
                <th className="py-3 px-3">Waybill #</th>
                <th className="py-3 px-3">Order Ref</th>
                <th className="py-3 px-3">Recipient & City</th>
                <th className="py-3 px-3">COD Amount</th>
                <th className="py-3 px-3">Courier</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredWaybills.map((wb) => {
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
                        className="text-neutral-400 hover:text-white"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <Square className="w-4 h-4 text-neutral-600" />
                        )}
                      </button>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                      <div>{wb.waybillNumber}</div>
                      <div className="text-[10px] text-neutral-500">
                        {new Date(wb.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-white">
                      {wb.orderNumber}
                      {wb.externalOrderId && (
                        <div className="text-[10px] text-neutral-400">{wb.externalOrderId}</div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-neutral-200">{wb.customerName}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{wb.customerPhone}</div>
                      <div className="text-[10px] text-neutral-400 truncate max-w-[160px]">
                        {wb.city}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono">
                      {wb.codAmount > 0 ? (
                        <span className="font-bold text-amber-400">
                          Rs. {wb.codAmount.toLocaleString()} COD
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">PREPAID</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {wb.courierName}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={wb.status}
                        onChange={(e) => updateWaybillStatus(wb.id, e.target.value as any)}
                        className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-200"
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
                        >
                          <Printer className="w-3 h-3 text-cyan-400" />
                          <span>Print</span>
                        </button>
                        <a
                          href={wb.courierTrackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
                          title="Open Trans Express Tracking"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Shipment Modal */}
      {isCreatingShipment && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95">
            <button
              onClick={() => setIsCreatingShipment(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-base font-bold text-white mb-1">Generate Dispatch Consignment</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Select order ready for Trans Express courier pickup
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Select Order</label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                >
                  {readyOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.customer.name} (Rs. {o.totalAmount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Courier Partner</label>
                <input
                  type="text"
                  readOnly
                  value="Trans Express (Colombo Hub Service)"
                  className="w-full bg-neutral-950/60 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-400 cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleQuickCreate}
                  className="w-full py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                >
                  Create Waybill & Assign Tracking #
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
