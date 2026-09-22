/**
 * WOWTEK OMS — Print Modals (Invoices & Thermal 4x6 Waybills)
 * Business: WOWTEK (wowtek.lk)
 */

import React from 'react';
import { Printer, X, Download } from 'lucide-react';
import { useOMS } from '../context/OMSContext';

export const PrintModals: React.FC = () => {
  const {
    printableWaybills,
    printableWaybillFormat,
    setPrintableWaybills,
    printableInvoice,
    setPrintableInvoice,
    businessSettings,
  } = useOMS();

  if (!printableWaybills && !printableInvoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 1. Waybill Print Preview Modal */}
      {printableWaybills && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl shadow-2xl p-6 relative max-h-[90vh] flex flex-col print:bg-white print:border-none print:shadow-none print:max-h-none print:p-0">
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800 print:hidden">
              <div>
                <h2 className="text-base font-bold text-white">
                  Waybill Print Preview ({printableWaybills.length} consignment{printableWaybills.length > 1 ? 's' : ''})
                </h2>
                <p className="text-xs text-neutral-400 font-mono">
                  Layout: {printableWaybillFormat === 'THERMAL_4X6' ? 'Thermal 4×6" Label (Courier Standard)' : 'A4 Sheet'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Labels Now</span>
                </button>
                <button
                  onClick={() => setPrintableWaybills(null)}
                  className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content Canvas */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6 print:space-y-8 print:p-0">
              {printableWaybills.map((wb, index) => (
                <div
                  key={wb.id}
                  className={`bg-white text-black p-6 mx-auto rounded-lg shadow-md print:shadow-none print:rounded-none border border-neutral-300 print:border-black ${
                    printableWaybillFormat === 'THERMAL_4X6'
                      ? 'w-[384px] min-h-[576px] font-sans' // 4x6 approx 96dpi
                      : 'w-full max-w-2xl min-h-[800px]'
                  }`}
                  style={{ pageBreakAfter: 'always' }}
                >
                  {/* Courier & Waybill Header */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-3">
                    <div>
                      <div className="text-xl font-black tracking-tight">{wb.courierName.toUpperCase()}</div>
                      <div className="text-[10px] font-mono">DOMESTIC LOGISTICS NETWORK</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold">{wb.waybillNumber}</div>
                      <div className="text-[10px] font-mono">DATE: {new Date(wb.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* COD Warning Box */}
                  <div className="my-3 p-3 bg-neutral-100 border-2 border-black flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider">Payment Term</div>
                      <div className="text-base font-black">
                        {wb.codAmount > 0 ? `COLLECT COD: Rs. ${wb.codAmount.toLocaleString()}` : 'PREPAID / NO COD'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-black text-white font-black text-xs">
                        {wb.codAmount > 0 ? 'COD' : 'PAID'}
                      </span>
                    </div>
                  </div>

                  {/* Sender & Receiver Info */}
                  <div className="grid grid-cols-2 gap-3 text-xs my-3 border-b border-black pb-3">
                    <div>
                      <div className="text-[10px] font-bold text-neutral-600 uppercase">Shipper (From):</div>
                      <div className="font-bold">{businessSettings.name}</div>
                      <div className="text-[11px] leading-tight">{businessSettings.address}</div>
                      <div className="text-[11px] font-mono">Tel: {businessSettings.phone}</div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-neutral-600 uppercase">Consignee (To):</div>
                      <div className="font-bold text-sm">{wb.customerName}</div>
                      <div className="font-mono font-bold text-sm">{wb.customerPhone}</div>
                      <div className="text-[11px] leading-tight font-medium mt-1">{wb.address}</div>
                      <div className="font-bold uppercase mt-0.5 text-xs">{wb.city}</div>
                    </div>
                  </div>

                  {/* Simulated Courier Barcode */}
                  <div className="my-4 py-2 text-center border-t border-b border-black">
                    <div className="h-12 bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_5px)] w-4/5 mx-auto" />
                    <div className="font-mono text-xs font-bold mt-1 tracking-widest">
                      *{wb.waybillNumber}*
                    </div>
                  </div>

                  {/* Footer Order Note */}
                  <div className="text-[10px] text-neutral-700 flex justify-between pt-2">
                    <span>Order Ref: {wb.orderNumber}</span>
                    <span>Trans Express Tracking LK</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Official Invoice Print Preview Modal */}
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
