/**
 * WOWTEK OMS — Print Modals (Invoices & Thermal 100x150mm Waybills)
 * Business: WOWTEK (wowtek.lk)
 * Physical Thermal Label: 100mm x 150mm (4x6 inch), 203 DPI compatible
 */

import React, { useState } from 'react';
import { Printer, X, Download, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { ThermalWaybill } from './ThermalWaybill';

export const PrintModals: React.FC = () => {
  const {
    printableWaybills,
    printableWaybillFormat,
    setPrintableWaybills,
    printableInvoice,
    setPrintableInvoice,
    businessSettings,
    orders,
  } = useOMS();

  const [activeFormat, setActiveFormat] = useState<'THERMAL_4X6' | 'A4'>(
    printableWaybillFormat || 'THERMAL_4X6'
  );
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  if (!printableWaybills && !printableInvoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    setDownloadSuccessToast(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setDownloadSuccessToast(false), 4000);
    }, 400);
  };

  return (
    <>
      {/* 1. Waybill Dedicated Print Preview Modal */}
      {printableWaybills && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          {/* Dynamic Print Styles for exact 100mm x 150mm Page and Margins */}
          <style>{`
            @media print {
              @page {
                size: ${activeFormat === 'THERMAL_4X6' ? '100mm 150mm' : 'A4 portrait'};
                margin: 0;
              }
              html, body {
                width: ${activeFormat === 'THERMAL_4X6' ? '100mm' : '100%'} !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * {
                visibility: hidden;
              }
              #printable-waybill-canvas, #printable-waybill-canvas * {
                visibility: visible;
              }
              #printable-waybill-canvas {
                position: absolute;
                left: 0;
                top: 0;
                width: ${activeFormat === 'THERMAL_4X6' ? '100mm' : '100%'};
                margin: 0;
                padding: 0;
              }
              .waybill-sheet {
                width: 100mm !important;
                height: 150mm !important;
                min-width: 100mm !important;
                min-height: 150mm !important;
                max-width: 100mm !important;
                max-height: 150mm !important;
                margin: 0 !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                box-sizing: border-box !important;
                border: 2px solid #000000 !important;
              }
            }
          `}</style>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl shadow-2xl p-5 sm:p-6 relative max-h-[92vh] flex flex-col print:bg-white print:border-none print:shadow-none print:max-h-none print:p-0">
            {/* Modal Controls (Hidden during physical print) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800 print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>WOWTEK Waybill Print Preview</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-bold border border-cyan-500/20">
                      {printableWaybills.length} {printableWaybills.length === 1 ? 'Label' : 'Labels'}
                    </span>
                  </h2>
                </div>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Target Size: {activeFormat === 'THERMAL_4X6' ? '100mm × 150mm (4 × 6" Thermal Label)' : 'A4 Sheet'} • Courier: Trans Express
                </p>
              </div>

              {/* Format Switcher & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Format selection */}
                <div className="flex items-center bg-neutral-950 border border-neutral-800 rounded-lg p-1 text-xs">
                  <button
                    onClick={() => setActiveFormat('THERMAL_4X6')}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                      activeFormat === 'THERMAL_4X6'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    100 × 150 mm Thermal
                  </button>
                  <button
                    onClick={() => setActiveFormat('A4')}
                    className={`px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                      activeFormat === 'A4'
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    A4 Paper
                  </button>
                </div>

                {/* Print Selected / All */}
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
                  title="Print to thermal label printer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{printableWaybills.length > 1 ? `Print Selected (${printableWaybills.length})` : 'Print Waybill'}</span>
                </button>

                {/* Download PDF */}
                <button
                  onClick={handleDownloadPDF}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer border border-neutral-700"
                  title="Download / Save as PDF"
                >
                  <Download className="w-4 h-4 text-neutral-400" />
                  <span>Download PDF</span>
                </button>

                {/* Close */}
                <button
                  onClick={() => setPrintableWaybills(null)}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {downloadSuccessToast && (
              <div className="mt-3 p-3 bg-cyan-950/60 border border-cyan-500/30 rounded-xl text-cyan-200 text-xs flex items-center justify-between animate-in fade-in print:hidden">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>
                    To save as PDF: in the browser print dialog, set <strong>Destination</strong> to <strong>"Save as PDF"</strong> and select Paper Size: <strong>4 x 6 in (100 x 150 mm)</strong>.
                  </span>
                </div>
              </div>
            )}

            {/* Thermal Waybill Preview Stage */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-neutral-950/50 rounded-xl mt-4 print:p-0 print:m-0 print:bg-white print:overflow-visible">
              <div id="printable-waybill-canvas" className="space-y-6 print:space-y-0">
                {printableWaybills.map((wb) => {
                  const parentOrder = orders.find(
                    (o) => o.id === wb.orderId || o.orderNumber === wb.orderNumber
                  );

                  return (
                    <ThermalWaybill
                      key={wb.id}
                      waybill={wb}
                      order={parentOrder}
                      businessSettings={businessSettings}
                      format={activeFormat}
                      courierName={wb.courierName || 'Trans Express'}
                    />
                  );
                })}
              </div>
            </div>

            {/* Footer Guidance (Print hidden) */}
            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 print:hidden font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span>203 DPI Code128 scannable barcode generated dynamically</span>
              </div>
              <div>Exact physical size: 100 mm × 150 mm (Portrait)</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Official Tax Invoice Print Preview Modal */}
      {printableInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col print:bg-white print:border-none print:shadow-none print:max-h-none print:p-0">
            {/* Modal Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 print:hidden">
              <div>
                <h2 className="text-base font-bold text-white">Commercial Tax Invoice Preview</h2>
                <p className="text-xs text-neutral-400 font-mono">Invoice #{printableInvoice.invoiceNumber}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setPrintableInvoice(null)}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Page */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar print:p-0">
              <div className="bg-white text-black p-8 mx-auto rounded-lg shadow-md print:shadow-none print:rounded-none max-w-3xl border border-neutral-300 print:border-none font-sans min-h-[900px]">
                {/* Official Letterhead */}
                <div className="flex items-start justify-between border-b-2 border-neutral-900 pb-6">
                  <div>
                    <div className="text-2xl font-black tracking-tight text-neutral-900">
                      {businessSettings.name}
                    </div>
                    <div className="text-xs font-semibold text-neutral-600">{businessSettings.legalName}</div>
                    <div className="text-xs text-neutral-600 leading-tight mt-1">{businessSettings.address}</div>
                    <div className="text-xs text-neutral-600 font-mono">
                      Tel: {businessSettings.phone} • Web: {businessSettings.website}
                    </div>
                    <div className="text-xs font-mono font-bold mt-1 text-neutral-800">
                      VAT / TIN: {businessSettings.vatNumber}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black uppercase text-neutral-800">TAX INVOICE</div>
                    <div className="text-sm font-mono font-bold mt-1 text-cyan-700">
                      #{printableInvoice.invoiceNumber}
                    </div>
                    <div className="text-xs font-mono text-neutral-600 mt-1">
                      Date: {new Date(printableInvoice.issueDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs font-mono text-neutral-600">
                      Order: {printableInvoice.orderNumber}
                    </div>
                  </div>
                </div>

                {/* Bill To Info */}
                <div className="grid grid-cols-2 gap-4 py-6 border-b border-neutral-300 text-xs">
                  <div>
                    <div className="font-bold text-neutral-500 uppercase tracking-wider text-[10px] mb-1">
                      Invoiced To:
                    </div>
                    <div className="font-bold text-sm text-neutral-900">{printableInvoice.customer.name}</div>
                    <div className="font-mono text-neutral-800">{printableInvoice.customer.phone}</div>
                    {printableInvoice.customer.email && (
                      <div className="text-neutral-600">{printableInvoice.customer.email}</div>
                    )}
                    <div className="text-neutral-700 leading-tight mt-1">
                      {printableInvoice.customer.address}, {printableInvoice.customer.city}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-bold text-neutral-500 uppercase tracking-wider text-[10px] mb-1">
                      Payment & Logistics:
                    </div>
                    <div>
                      Payment Method: <span className="font-bold font-mono">{printableInvoice.paymentMethod}</span>
                    </div>
                    <div>
                      Payment Status: <span className="font-bold font-mono text-emerald-700">{printableInvoice.paymentStatus}</span>
                    </div>
                    <div>
                      Courier Partner: <span className="font-bold">{printableInvoice.courier || 'Trans Express'}</span>
                    </div>
                    {printableInvoice.trackingNumber && (
                      <div className="font-mono text-[11px]">
                        Tracking #: {printableInvoice.trackingNumber}
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <div className="py-6">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-neutral-900 text-neutral-800 font-bold uppercase text-[10px] font-mono">
                        <th className="py-2">Item Description & Serial #</th>
                        <th className="py-2 text-center">Warranty</th>
                        <th className="py-2 text-right">Qty</th>
                        <th className="py-2 text-right">Price (LKR)</th>
                        <th className="py-2 text-right">Total (LKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {printableInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-3 pr-2">
                            <div className="font-bold text-neutral-900">{item.name}</div>
                            <div className="font-mono text-[10px] text-neutral-600">
                              SKU: {item.sku}
                              {item.serialNumber && ` • SN: ${item.serialNumber}`}
                            </div>
                          </td>
                          <td className="py-3 text-center font-mono text-[11px]">
                            {item.warrantyDuration ? `${item.warrantyDuration} ${item.warrantyUnit}` : 'N/A'}
                          </td>
                          <td className="py-3 text-right font-mono font-semibold">{item.quantity}</td>
                          <td className="py-3 text-right font-mono">{item.unitPrice.toLocaleString()}</td>
                          <td className="py-3 text-right font-mono font-bold text-neutral-900">
                            {item.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotal & Totals Box */}
                <div className="flex justify-end pt-2 pb-6 border-t border-neutral-300">
                  <div className="w-64 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-neutral-600">
                      <span>Subtotal:</span>
                      <span>Rs. {printableInvoice.subtotal.toLocaleString()}</span>
                    </div>

                    {printableInvoice.discount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Discount:</span>
                        <span>- Rs. {printableInvoice.discount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-neutral-600">
                      <span>Delivery / Courier:</span>
                      <span>Rs. {printableInvoice.shippingFee.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between border-t-2 border-neutral-900 pt-2 text-sm font-black text-neutral-900">
                      <span>TOTAL PAYABLE:</span>
                      <span>Rs. {printableInvoice.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Terms and Return Policy */}
                <div className="pt-6 border-t-2 border-neutral-200 text-[10px] text-neutral-500 space-y-1 leading-relaxed">
                  <div className="font-bold text-neutral-800 uppercase">Terms & Conditions:</div>
                  <div>{printableInvoice.terms}</div>
                  <div>Warranty claims require physical presentation of this invoice and original box packaging with matching serial numbers.</div>
                </div>

                {/* Stamp & Authorized Signature Area */}
                <div className="mt-12 flex justify-between text-xs text-neutral-600 pt-8 border-t border-dashed border-neutral-300">
                  <div>
                    <div className="h-10" />
                    <div className="border-t border-neutral-400 pt-1 font-semibold">Customer Signature</div>
                  </div>
                  <div className="text-right">
                    <div className="h-10" />
                    <div className="border-t border-neutral-400 pt-1 font-semibold">
                      For WOWTEK Sri Lanka (Authorized Officer)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
