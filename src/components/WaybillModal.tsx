import React from 'react';
import { X, Printer, Truck, CheckCircle2 } from 'lucide-react';
import { Order } from '../types';
import { formatCurrency } from '../utils/storage';

interface WaybillModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const WaybillModal: React.FC<WaybillModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white text-zinc-900 border border-zinc-300 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl print:shadow-none print:w-full print:max-w-none print:m-0">
        {/* Header (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50 print:hidden">
          <div className="flex items-center space-x-2 text-zinc-800 font-bold">
            <Truck className="w-5 h-5 text-purple-600" />
            <span>Trans Express Courier Waybill</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Waybill</span>
            </button>
            <button 
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-800 p-1 rounded-lg hover:bg-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Waybill Document */}
        <div className="p-8 space-y-6 font-sans">
          <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-purple-700">TRANS EXPRESS</h1>
              <p className="text-xs font-semibold text-zinc-500">COURIER & LOGISTICS PARTNER - SRI LANKA</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold bg-zinc-100 px-3 py-1 rounded border border-zinc-300 inline-block mb-1">
                WAYBILL NO: <span className="font-mono text-purple-700">{order.waybillNumber}</span>
              </div>
              <p className="text-xs text-zinc-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Barcode Mock */}
          <div className="bg-zinc-100 p-4 rounded-xl border border-dashed border-zinc-400 text-center">
            <div className="font-mono text-2xl tracking-[0.3em] font-bold text-zinc-900 mb-1">
              ||| | |||| || ||| || |||||| |
            </div>
            <span className="font-mono text-xs text-zinc-600">{order.waybillNumber}</span>
          </div>

          {/* Shipper & Consignee */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div className="border border-zinc-300 rounded-xl p-4 bg-zinc-50">
              <span className="text-xs font-bold uppercase text-zinc-500 block mb-1">Shipper (Sender)</span>
              <p className="font-bold text-zinc-900">WOWTEK (PVT) LTD</p>
              <p className="text-zinc-600">No 112, Baseline Road, Colombo 08</p>
              <p className="text-zinc-600">Hotline: 011 234 5678</p>
            </div>
            <div className="border border-zinc-300 rounded-xl p-4 bg-zinc-50">
              <span className="text-xs font-bold uppercase text-zinc-500 block mb-1">Consignee (Recipient)</span>
              <p className="font-bold text-zinc-900">{order.customerName}</p>
              <p className="text-zinc-600">{order.customerAddress}</p>
              <p className="text-zinc-600">Phone: {order.customerPhone}</p>
            </div>
          </div>

          {/* Order Items Table */}
          <div className="border border-zinc-300 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 border-b border-zinc-300 text-zinc-700 text-xs uppercase font-bold">
                <tr>
                  <th className="px-4 py-2.5">Item Description</th>
                  <th className="px-4 py-2.5">SKU</th>
                  <th className="px-4 py-2.5">Qty</th>
                  <th className="px-4 py-2.5 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2.5 font-medium text-zinc-900">{item.productName}</td>
                    <td className="px-4 py-2.5 font-mono text-zinc-600">{item.sku}</td>
                    <td className="px-4 py-2.5 text-zinc-900">{item.quantity}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-zinc-900">{formatCurrency(item.price * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* COD & Totals */}
          <div className="flex justify-between items-center bg-zinc-100 p-4 rounded-xl border border-zinc-300">
            <div>
              <span className="text-xs font-bold text-zinc-500 uppercase block">Payment Mode</span>
              <span className="font-bold text-zinc-900">Cash on Delivery (COD)</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-zinc-500 uppercase block">Total COD Amount</span>
              <span className="text-xl font-black text-purple-700">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {/* Footer signature */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-zinc-200 text-xs text-zinc-600">
            <div>
              <p className="font-bold text-zinc-800 mb-6">Shipper Signature:</p>
              <div className="border-b border-zinc-400 w-48"></div>
            </div>
            <div>
              <p className="font-bold text-zinc-800 mb-6">Receiver Signature (Proof of Delivery):</p>
              <div className="border-b border-zinc-400 w-48"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
