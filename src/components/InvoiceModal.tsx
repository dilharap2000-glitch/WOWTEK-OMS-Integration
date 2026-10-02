import React, { useState } from 'react';
import { X, FileText, Plus, Trash2, Printer } from 'lucide-react';
import { Invoice, Outlet, PaymentMethod, ProductItem } from '../types';
import { formatCurrency, generateId } from '../utils/storage';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  outlets: Outlet[];
  products: ProductItem[];
  currentOutletId: string;
  onSaveInvoice: (invoice: Invoice) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  outlets,
  products,
  currentOutletId,
  onSaveInvoice,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [outletId, setOutletId] = useState(currentOutletId === 'all' ? outlets[0]?.id : currentOutletId);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash/COD');
  const [discount, setDiscount] = useState(0);

  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(1);

  if (!isOpen) return null;

  const handleAddItem = () => {
    if (!currentProductId) return;
    const existing = selectedItems.find(i => i.productId === currentProductId);
    if (existing) {
      setSelectedItems(selectedItems.map(i => 
        i.productId === currentProductId ? { ...i, quantity: i.quantity + currentQuantity } : i
      ));
    } else {
      setSelectedItems([...selectedItems, { productId: currentProductId, quantity: currentQuantity }]);
    }
    setCurrentProductId('');
    setCurrentQuantity(1);
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(i => i.productId !== productId));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    const items = selectedItems.map(si => {
      const prod = products.find(p => p.id === si.productId);
      const price = prod ? prod.sellingPrice : 0;
      subtotal += price * si.quantity;
      return {
        productName: prod ? prod.name : 'Walk-in Item',
        sku: prod ? prod.sku : 'SKU',
        quantity: si.quantity,
        price,
      };
    });

    // 12% payment fee for card/PayHere/Koko/Mintpay
    const paymentFee = (paymentMethod !== 'Cash/COD') ? (subtotal - discount) * 0.12 : 0;
    const totalAmount = subtotal - discount + paymentFee;

    return { items, subtotal, paymentFee, totalAmount };
  };

  const { items, subtotal, paymentFee, totalAmount } = calculateTotals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || items.length === 0) {
      alert('Please fill in customer details and add at least one item.');
      return;
    }

    const newInvoice: Invoice = {
      id: generateId('inv'),
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      discount,
      paymentMethod,
      paymentFee,
      totalAmount,
      outletId: outletId || outlets[0].id,
      status: 'Paid',
      createdAt: new Date().toISOString(),
    };

    onSaveInvoice(newInvoice);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create Manual Invoice</h3>
              <p className="text-xs text-zinc-400">Generate professional invoice for walk-in or direct customers</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Nuwan Silva"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="e.g. 0771234567"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="Cash/COD">Cash / COD (0% Fee)</option>
                <option value="PayHere">PayHere (12% Fee)</option>
                <option value="Koko">Koko (12% Fee)</option>
                <option value="Visa/Mastercard">Visa / Mastercard (12% Fee)</option>
                <option value="Mintpay">Mintpay (12% Fee)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Outlet</label>
              <select
                value={outletId}
                onChange={e => setOutletId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Invoice Items</label>
            <div className="flex gap-2 mb-3">
              <select
                value={currentProductId}
                onChange={e => setCurrentProductId(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatCurrency(p.sellingPrice)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={currentQuantity}
                onChange={e => setCurrentQuantity(parseInt(e.target.value) || 1)}
                className="w-20 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-200 text-center focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={handleAddItem}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            {items.length > 0 ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-4 py-2.5">Price</th>
                      <th className="px-4 py-2.5">Qty</th>
                      <th className="px-4 py-2.5">Total</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {selectedItems.map((si, idx) => {
                      const prod = products.find(p => p.id === si.productId);
                      return (
                        <tr key={idx} className="hover:bg-zinc-900/80">
                          <td className="px-4 py-2.5 text-zinc-200 font-medium">{prod?.name}</td>
                          <td className="px-4 py-2.5 text-zinc-400">{formatCurrency(prod?.sellingPrice || 0)}</td>
                          <td className="px-4 py-2.5 text-zinc-200">{si.quantity}</td>
                          <td className="px-4 py-2.5 text-purple-400 font-medium">{formatCurrency((prod?.sellingPrice || 0) * si.quantity)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(si.productId)}
                              className="text-red-400 hover:text-red-300 p-1 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-xl text-xs text-zinc-500">
                No items added to invoice yet.
              </div>
            )}
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal:</span>
              <span className="text-zinc-200 font-medium">{formatCurrency(subtotal)}</span>
            </div>
            {paymentFee > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Payment Gateway Fee (12%):</span>
                <span className="text-amber-400 font-medium">+{formatCurrency(paymentFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-200 font-bold text-sm pt-2 border-t border-zinc-800">
              <span>Total Invoice Amount:</span>
              <span className="text-purple-400">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-5 py-2.5 rounded-xl text-sm font-medium border border-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/25"
            >
              Create & Issue Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
