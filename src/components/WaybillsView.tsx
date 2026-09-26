/**
 * WOWTEK OMS — Courier Shipments & Batch Waybills Module
 * Business: WOWTEK (wowtek.lk)
 * Physical Thermal Label: 100mm x 150mm (4x6"), 203 DPI
 * Integrates with Trans Express Production API (https://portal.transexpress.lk/api)
 */

import React, { useState, useEffect } from 'react';
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
  RotateCcw,
  Loader2,
  Wifi,
  MapPin,
  X,
  Phone,
  FileText,
} from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { Waybill, TransExpressProvince, TransExpressDistrict, TransExpressCity } from '../types';
import { Barcode } from './Barcode';
import { formatCurrency, formatNumber, formatDate } from '../lib/formatters';
import { apiClient } from '../services/apiClient';

export const WaybillsView: React.FC = () => {
  const {
    waybills,
    orders,
    createWaybill,
    createTransExpressShipment,
    testTransExpressConnection,
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

  // Cascading Location Selection State for Trans Express API
  const [provinces, setProvinces] = useState<TransExpressProvince[]>([]);
  const [districts, setDistricts] = useState<TransExpressDistrict[]>([]);
  const [cities, setCities] = useState<TransExpressCity[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | ''>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
  const [selectedCityId, setSelectedCityId] = useState<number | ''>('');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Additional form fields for Trans Express upload
  const [shipmentNote, setShipmentNote] = useState('');
  const [phone2, setPhone2] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Manual fallback toggle
  const [useManualNumber, setUseManualNumber] = useState(false);
  const [manualWaybillNumber, setManualWaybillNumber] = useState('');
  const [manualTrackingNumber, setManualTrackingNumber] = useState('');
  const [courierSelection, setCourierSelection] = useState('Trans Express');

  // Edit modal state
  const [editWbNumber, setEditWbNumber] = useState('');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editCourierName, setEditCourierName] = useState('Trans Express');

  // Test connection state
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
  } | null>(null);

  // Fetch Provinces on component mount or modal open
  useEffect(() => {
    let isMounted = true;
    const loadProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const provs = await apiClient.getTransExpressProvinces();
        if (isMounted) {
          setProvinces(provs);
          if (provs.length > 0 && selectedProvinceId === '') {
            // Default to Western Province (id: 1) if available
            const western = provs.find((p) => p.name.toLowerCase().includes('western')) || provs[0];
            setSelectedProvinceId(western.id);
          }
        }
      } catch (err) {
        console.error('Failed to load Trans Express provinces:', err);
      } finally {
        if (isMounted) setLoadingProvinces(false);
      }
    };
    loadProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Districts when selectedProvinceId changes
  useEffect(() => {
    let isMounted = true;
    if (selectedProvinceId === '') {
      setDistricts([]);
      setSelectedDistrictId('');
      setCities([]);
      setSelectedCityId('');
      return;
    }

    const loadDistricts = async () => {
      setLoadingDistricts(true);
      try {
        const dists = await apiClient.getTransExpressDistricts(Number(selectedProvinceId));
        if (isMounted) {
          setDistricts(dists);
          if (dists.length > 0) {
            // Default to first district (e.g. Colombo)
            setSelectedDistrictId(dists[0].id);
          } else {
            setSelectedDistrictId('');
            setCities([]);
            setSelectedCityId('');
          }
        }
      } catch (err) {
        console.error('Failed to load districts:', err);
      } finally {
        if (isMounted) setLoadingDistricts(false);
      }
    };
    loadDistricts();
    return () => {
      isMounted = false;
    };
  }, [selectedProvinceId]);

  // Fetch Cities when selectedDistrictId changes
  useEffect(() => {
    let isMounted = true;
    if (selectedDistrictId === '') {
      setCities([]);
      setSelectedCityId('');
      return;
    }

    const loadCities = async () => {
      setLoadingCities(true);
      try {
        const cts = await apiClient.getTransExpressCities(Number(selectedDistrictId));
        if (isMounted) {
          setCities(cts);
          if (cts.length > 0) {
            setSelectedCityId(cts[0].id);
          } else {
            setSelectedCityId('');
          }
        }
      } catch (err) {
        console.error('Failed to load cities:', err);
      } finally {
        if (isMounted) setLoadingCities(false);
      }
    };
    loadCities();
    return () => {
      isMounted = false;
    };
  }, [selectedDistrictId]);

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

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedbackToast({ type, message });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

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

  const handleOpenCreateModal = (orderId?: string) => {
    const targetOrderId = orderId || readyOrders[0]?.id || '';
    setSelectedOrderId(targetOrderId);
    setUseManualNumber(false);
    setManualWaybillNumber('');
    setManualTrackingNumber('');
    setCourierSelection('Trans Express');
    setShipmentNote('');
    setPhone2('');
    setModalError(null);
    setIsCreatingShipment(true);
  };

  // Safe Test Connection (Harmless authenticated endpoint, never creates shipment)
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await testTransExpressConnection();
      const formattedResult =
        (res as any).result ||
        (res.success
          ? 'SUCCESS → Trans Express API connected'
          : `FAILED → ${res.message}`);

      setConnectionStatus({
        tested: true,
        success: res.success,
        message: formattedResult,
      });
      if (res.success) {
        showToast('success', formattedResult);
      } else {
        showToast('error', formattedResult);
      }
    } catch (err: any) {
      const safeMsg = `FAILED → connection failed: ${err.message || 'Connection test failed'}`;
      setConnectionStatus({ tested: true, success: false, message: safeMsg });
      showToast('error', safeMsg);
    } finally {
      setTestingConnection(false);
    }
  };

  // Real Trans Express API Shipment Creation with Auto Waybill
  const handleSubmitShipment = async () => {
    const orderToCreate = readyOrders.find((o) => o.id === selectedOrderId) || readyOrders[0];
    if (!orderToCreate) {
      setModalError('No valid Website order selected.');
      return;
    }

    if (orderToCreate.source !== 'WEBSITE') {
      setModalError('Waybill can only be created for WEBSITE / WooCommerce orders.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    // If warehouse selected manual physical slip mode
    if (useManualNumber) {
      try {
        const wb = createWaybill(
          orderToCreate.id,
          courierSelection,
          formatOption,
          manualWaybillNumber.trim() || undefined,
          manualTrackingNumber.trim() || undefined,
          selectedCityId ? Number(selectedCityId) : undefined,
          shipmentNote
        );
        setIsCreatingShipment(false);
        showToast('success', `Waybill ${wb.waybillNumber} assigned manually.`);
      } catch (err: any) {
        setModalError(err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Normal Automated Production API Workflow
    try {
      const cityIdNum = selectedCityId !== '' ? Number(selectedCityId) : undefined;
      const res = await createTransExpressShipment(orderToCreate.id, cityIdNum, shipmentNote);

      if (res.success) {
        setIsCreatingShipment(false);
        showToast('success', res.message || `Trans Express Waybill ${res.waybill?.waybillNumber} created.`);
      } else {
        setModalError(res.error || res.message || 'Trans Express API upload failed.');
      }
    } catch (err: any) {
      setModalError(err.message || 'An unexpected error occurred during waybill creation.');
    } finally {
      setIsSubmitting(false);
    }
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
    showToast('success', 'Waybill record updated successfully.');
  };

  const activeCreateOrder = readyOrders.find((o) => o.id === selectedOrderId) || readyOrders[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedbackToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Waybills & Courier Logistics
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
              TRANS EXPRESS LIVE API
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Strict 100mm × 150mm (4×6") thermal label printing, sequential batch dispatch & Trans Express auto-consignment
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Test Connection Button */}
          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 border border-neutral-700 hover:border-purple-500/40 text-neutral-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="Safe check that tests API connection without creating orders"
          >
            {testingConnection ? (
              <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-purple-400" />
            )}
            <span>{testingConnection ? 'Testing...' : 'Test Trans Express API'}</span>
          </button>

          {/* Format selection */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setFormatOption('THERMAL_4X6')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                formatOption === 'THERMAL_4X6'
                  ? 'bg-purple-500/20 text-purple-300 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              100×150mm Thermal (4×6")
            </button>
            <button
              onClick={() => setFormatOption('A4')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                formatOption === 'A4'
                  ? 'bg-purple-500/20 text-purple-300 font-bold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              A4 Sheet
            </button>
          </div>

          <button
            onClick={handlePrintBatch}
            disabled={selectedIds.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 disabled:opacity-40 text-white transition-all cursor-pointer"
            title="Batch print all selected waybills sequentially on 100x150mm pages"
          >
            <Printer className="w-4 h-4 text-purple-400" />
            <span>Print Selected ({selectedIds.length})</span>
          </button>

          {readyOrders.length > 0 && (
            <button
              onClick={() => handleOpenCreateModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Waybill ({readyOrders.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Courier & Business Rules Notice */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>Trans Express Production Integration</span>
              <span className="text-[10px] font-mono font-normal text-purple-400 bg-purple-950 px-1.5 py-0.5 rounded border border-purple-800">
                portal.transexpress.lk/api
              </span>
            </div>
            <p className="text-neutral-400 text-[11px] mt-0.5">
              Waybills are strictly restricted to <strong>Website / WooCommerce</strong> orders. PickMe & Uber Eats orders handle their own delivery and are excluded.
            </p>
          </div>
        </div>

        {connectionStatus && (
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              connectionStatus.success
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            {connectionStatus.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <span className="truncate max-w-[280px]">{connectionStatus.message}</span>
          </div>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right font-mono">
            <div className="text-xs font-bold text-white">{websiteWaybills.length} Dispatches</div>
            <div className="text-[10px] text-neutral-400">100×150mm Thermal Ready</div>
          </div>
        </div>
      </div>

      {/* Ready for Waybill Queue (STRICTLY WEBSITE ORDERS ONLY) */}
      {readyOrders.length > 0 && (
        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Ready for Waybill Queue ({readyOrders.length} Website Orders)
              </h2>
            </div>
            <span className="text-[10px] text-purple-400/80 font-mono">
              WooCommerce Orders Awaiting Trans Express Consignment
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {readyOrders.slice(0, 6).map((ord) => (
              <div
                key={ord.id}
                className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white">{ord.orderNumber}</span>
                    <span className="text-purple-400 font-bold">
                      Rs. {formatNumber(ord.totalAmount || ord.total)}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-300 mt-1 font-semibold">
                    {ord.customer.name}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {ord.shippingAddress.addressLine1 || ord.shippingAddress.city},{' '}
                    {ord.shippingAddress.city}
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                    {ord.customer.phone} • {ord.paymentMethod}
                  </div>
                </div>

                {ord.transExpress?.errorMessage && (
                  <div className="text-[10px] text-rose-400 bg-rose-950/30 p-1.5 rounded border border-rose-900/40 truncate">
                    ⚠️ {ord.transExpress.errorMessage}
                  </div>
                )}

                <button
                  onClick={() => handleOpenCreateModal(ord.id)}
                  className="w-full py-1.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {ord.transExpress?.errorMessage
                      ? 'Retry Waybill (Trans Express)'
                      : 'Create Trans Express Waybill'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Bulk Select Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:bg-neutral-800 cursor-pointer"
          >
            {selectedIds.length === filteredWaybills.length && filteredWaybills.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-purple-400" />
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
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500"
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
                        isSelected ? 'bg-purple-500/10' : 'hover:bg-neutral-800/40'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleSelect(wb.id)}
                          className="text-neutral-400 hover:text-white cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-600" />
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-purple-400 flex items-center gap-1.5">
                          <BarcodeIcon className="w-3.5 h-3.5 text-purple-400" />
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
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
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
                            title="Print 100mm x 150mm thermal waybill label"
                          >
                            <Printer className="w-3 h-3 text-purple-400" />
                            <span>Print</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(wb)}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
                            title="Edit waybill / manual tracking number"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={
                              wb.courierTrackingUrl ||
                              `https://portal.transexpress.lk/track/${wb.trackingNumber || wb.waybillNumber}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-purple-300 cursor-pointer"
                            title="Track live on Trans Express Portal"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
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

      {/* CREATE WAYBILL MODAL WITH CASCADING CITY SELECTION */}
      {isCreatingShipment && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative my-8">
            <button
              onClick={() => setIsCreatingShipment(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <Truck className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-bold text-white">Create Trans Express Waybill</h2>
            </div>
            <p className="text-xs text-neutral-400 mb-4">
              Upload order details to Trans Express Production API & generate thermal shipping label (100mm × 150mm)
            </p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Waybill Upload Failed</div>
                  <div className="text-[11px] text-rose-300">{modalError}</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Order selector */}
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">
                  Select Order (Website / WooCommerce only)
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-semibold"
                >
                  {readyOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {o.customer.name} ({o.shippingAddress.city}) — Rs. {formatNumber(o.totalAmount || o.total)} ({o.paymentMethod})
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Details Preview Box */}
              {activeCreateOrder && (
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-neutral-300">
                    <span className="text-neutral-500">Customer:</span>
                    <span className="font-semibold text-white">{activeCreateOrder.customer.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-300">
                    <span className="text-neutral-500">Phone:</span>
                    <span className="font-mono">{activeCreateOrder.customer.phone}</span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-300">
                    <span className="text-neutral-500">Address:</span>
                    <span className="text-right truncate max-w-[240px]">
                      {activeCreateOrder.shippingAddress.addressLine1 || activeCreateOrder.shippingAddress.city}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-300 pt-1 border-t border-neutral-800/80">
                    <span className="text-neutral-500">COD Collection:</span>
                    <span className="font-mono font-bold text-amber-400">
                      {activeCreateOrder.paymentStatus === 'PAID'
                        ? 'PREPAID (Rs. 0)'
                        : `Rs. ${formatNumber(activeCreateOrder.totalAmount || activeCreateOrder.total)}`}
                    </span>
                  </div>
                </div>
              )}

              {/* CASCADING CITY SELECTION (PROVINCE → DISTRICT → CITY) */}
              <div className="p-3.5 bg-neutral-950/80 border border-purple-900/30 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
                  <MapPin className="w-3.5 h-3.5 text-purple-400" />
                  <span>Trans Express Destination Mapping (Sri Lanka)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 1. Province Dropdown */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">
                      Province {loadingProvinces && '(loading...)'}
                    </label>
                    <select
                      value={selectedProvinceId}
                      onChange={(e) => setSelectedProvinceId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200"
                    >
                      {provinces.map((prov) => (
                        <option key={prov.id} value={prov.id}>
                          {prov.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. District Dropdown */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">
                      District {loadingDistricts && '(loading...)'}
                    </label>
                    <select
                      value={selectedDistrictId}
                      onChange={(e) => setSelectedDistrictId(e.target.value ? Number(e.target.value) : '')}
                      disabled={districts.length === 0}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 disabled:opacity-50"
                    >
                      {districts.map((dist) => (
                        <option key={dist.id} value={dist.id}>
                          {dist.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. City Dropdown */}
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">
                      City / Hub {loadingCities && '(loading...)'}
                    </label>
                    <select
                      value={selectedCityId}
                      onChange={(e) => setSelectedCityId(e.target.value ? Number(e.target.value) : '')}
                      disabled={cities.length === 0}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 disabled:opacity-50 font-semibold text-purple-300"
                    >
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>
                          {city.name} (ID: {city.id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[10px] text-neutral-400 flex items-center justify-between font-mono pt-1">
                  <span>Selected City ID: <strong className="text-purple-400">{selectedCityId || 'None'}</strong></span>
                  <span className="text-[9px] text-neutral-500">Auto-routes to Trans Express Hub</span>
                </div>
              </div>

              {/* Optional Fields: Secondary Phone & Special Delivery Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">
                    Alternate Phone (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 0771234567"
                    value={phone2}
                    onChange={(e) => setPhone2(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">
                    Driver Note / Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Call before delivery, near church"
                    value={shipmentNote}
                    onChange={(e) => setShipmentNote(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                  />
                </div>
              </div>

              {/* Manual Entry Fallback Toggle */}
              <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">Manual Slip Entry (Fallback)</div>
                    <div className="text-[10px] text-neutral-400">
                      Use pre-printed physical barcode slip if API upload is bypassed
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={useManualNumber}
                    onChange={(e) => setUseManualNumber(e.target.checked)}
                    className="w-4 h-4 accent-purple-500 cursor-pointer"
                  />
                </div>

                {useManualNumber ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-800">
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">Waybill Number</label>
                      <input
                        type="text"
                        placeholder="e.g. WB-TEX-2026-9402"
                        value={manualWaybillNumber}
                        onChange={(e) => setManualWaybillNumber(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-purple-300 font-mono"
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
                  <div className="text-[10px] text-purple-300 font-mono flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Trans Express Production API will automatically allocate the Waybill & Barcode</span>
                  </div>
                )}
              </div>

              {/* Live Barcode Verification Preview */}
              <div className="p-3 rounded-xl bg-white text-black border border-neutral-300 text-center">
                <div className="text-[10px] font-mono font-bold text-neutral-700 uppercase mb-1">
                  Code128 Barcode Verification Preview
                </div>
                <Barcode
                  value={
                    useManualNumber && manualWaybillNumber.trim()
                      ? manualWaybillNumber.trim()
                      : `WB-TEX-${(activeCreateOrder?.orderNumber || '').replace(/[^0-9]/g, '') || '9041'}`
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
                  disabled={isSubmitting}
                  onClick={handleSubmitShipment}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Trans Express API...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Waybill & Upload to Trans Express</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingWaybill && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl relative">
            <button
              onClick={() => setEditingWaybill(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-1">Edit Consignment Details</h2>
            <p className="text-xs text-neutral-400 mb-4 font-mono">
              Order: {editingWaybill.orderNumber}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Waybill Number</label>
                <input
                  type="text"
                  value={editWbNumber}
                  onChange={(e) => setEditWbNumber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-purple-300 font-mono font-bold"
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
                <label className="text-[11px] text-neutral-400 block mb-1">Courier Partner</label>
                <input
                  type="text"
                  value={editCourierName}
                  onChange={(e) => setEditCourierName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWaybill(null)}
                  className="w-1/2 py-2 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-semibold hover:bg-neutral-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="w-1/2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md cursor-pointer"
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
