import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Trash2, Truck } from 'lucide-react';
import { Order, OrderSource, PaymentMethod, ProductItem, Outlet } from '../types';
import { formatCurrency, generateId } from '../utils/storage';

interface SimulateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductItem[];
  outlets: Outlet[];
  currentOutletId: string;
  onSaveOrder: (order: Order) => void;
}

export const SimulateOrderModal: React.FC<SimulateOrderModalProps> = ({
  isOpen,
  onClose,
  products,
  outlets,
  currentOutletId,
  onSaveOrder,
}) => {
  const [source, setSource] = useState<OrderSource>('Website');
  const [outletId, setOutletId] = useState(currentOutletId === 'all' ? outlets[0]?.id : currentOutletId);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash/COD');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState(1);

  const [deliveryFee, setDeliveryFee] = useState(450);
  const [commissionFee, setCommissionFee] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [discount, setDiscount] = useState(0);

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
    let totalCost = 0;

    const orderItems = selectedItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const price = prod ? prod.sellingPrice : 0;
      const cost = prod ? prod.costPrice : 0;
      subtotal += price * item.quantity;
      totalCost += cost * item.quantity;
      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Unknown Product',
        sku: prod ? prod.sku : 'SKU',
        quantity: item.quantity,
        price,
      };
    });

    // 12% payment fee if not cash/COD
    const paymentFee = (paymentMethod !== 'Cash/COD') ? (subtotal - discount) * 0.12 : 0;
    const totalAmount = subtotal + (source === 'Website' || source === 'WooCommerce' ? deliveryFee : 0) - discount + paymentFee;
    const grossSalesProfit = subtotal - totalCost;
    const calculatedCommission = source !== 'Website' && source !== 'WooCommerce' ? subtotal * 0.18 : 0;
    
    // Net Profit = Selling Price - Item Cost - Payment/Platform Commission (12%) - Shipping Fee
    const netProfit = grossSalesProfit - calculatedCommission - paymentFee - (source === 'Website' || source === 'WooCommerce' ? deliveryFee : 0) - serviceFee - discount;

    return { orderItems, totalAmount, netProfit, calculatedCommission, paymentFee };
  };

  const { orderItems, totalAmount, netProfit, calculatedCommission, paymentFee } = calculateTotals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || selectedItems.length === 0) {
      alert('Please fill in customer details and add at least one product item.');
      return;
    }

    const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const waybillNumber = source === 'Website' || source === 'WooCommerce' ? `TE-${Math.floor(10000000 + Math.random() * 90000000)}` : 'No Waybill Required';

    const newOrder: Order = {
      id: generateId('ord'),
      orderNumber,
      platformId: orderNumber,
      source,
      outletId: outletId || outlets[0].id,
      customerName,
      customerPhone,
      customerAddress,
      items: orderItems,
      paymentMethod,
      totalAmount,
      deliveryFee: source === 'Website' || source === 'WooCommerce' ? deliveryFee : 0,
      commissionFee: source !== 'Website' && source !== 'WooCommerce' ? calculatedCommission : commissionFee,
      paymentFee,
      serviceFee,
      discount,
      netProfit,
      status: 'Pending',
      waybillNumber,
      stockDeducted: true,
      createdAt: new Date().toISOString(),
    };

    onSaveOrder(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Simulate Incoming Order</h3>
              <p className="text-xs text-zinc-400">Test WooCommerce, PickMe, or Uber orders with payment methods & commissions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Order Source</label>
              <select
                value={source}
                onChange={e => setSource(e.target.value as OrderSource)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="Website">🌐 Website</option>
                <option value="WooCommerce">🛒 WooCommerce</option>
                <option value="PickMe">🛵 PickMe</option>
                <option value="Uber">🚗 Uber Eats</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="Cash/COD">Cash / COD</option>
                <option value="PayHere">PayHere (12%)</option>
                <option value="Koko">Koko (12%)</option>
                <option value="Visa/Mastercard">Visa/MC (12%)</option>
                <option value="Mintpay">Mintpay (12%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Outlet</label>
              <select
                value={outletId}
                onChange={e => setOutletId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="e.g. Kasun Perera"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="text"
                required
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="e.g. 0771234567"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Delivery Address</label>
            <input
              type="text"
              required
              value={customerAddress}
              onChange={e => setCustomerAddress(e.target.value)}
              placeholder="e.g. No 45, Galle Road, Colombo 03"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Order Items</label>
            <div className="flex gap-2 mb-3">
              <select
                value={currentProductId}
                onChange={e => setCurrentProductId(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">Select Product from Inventory...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) - {formatCurrency(p.sellingPrice)} [Stock: {p.stockByOutlet[outletId] || 0}]
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

            {selectedItems.length > 0 ? (
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
                    {selectedItems.map((item, idx) => {
                      const prod = products.find(p => p.id === item.productId);
                      return (
                        <tr key={idx} className="hover:bg-zinc-900/80">
                          <td className="px-4 py-2.5 text-zinc-200 font-medium">{prod?.name || 'Item'}</td>
                          <td className="px-4 py-2.5 text-zinc-400">{formatCurrency(prod?.sellingPrice || 0)}</td>
                          <td className="px-4 py-2.5 text-zinc-200">{item.quantity}</td>
                          <td className="px-4 py-2.5 text-purple-400 font-medium">{formatCurrency((prod?.sellingPrice || 0) * item.quantity)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productId)}
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
                No items added to this order yet.
              </div>
            )}
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Total Amount:</span>
              <span className="text-zinc-200 font-bold text-sm">{formatCurrency(totalAmount)}</span>
            </div>
            {paymentFee > 0 && (
              <div className="flex justify-between text-zinc-400">
                <span>Payment Gateway Fee (12%):</span>
                <span className="text-amber-400 font-medium">+{formatCurrency(paymentFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-zinc-400">
              <span>Real Net Profit:</span>
              <span className="text-emerald-400 font-bold text-sm">{formatCurrency(netProfit)}</span>
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
              Process Order & Auto-Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
