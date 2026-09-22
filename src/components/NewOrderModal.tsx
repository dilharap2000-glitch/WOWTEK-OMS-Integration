/**
 * WOWTEK OMS — Create Manual Store Order Modal
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import { X, Plus, Trash2, TrendingUp, ShoppingBag, Check } from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { OrderItem } from '../types';

interface NewOrderModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const {
    products,
    customers,
    paymentMethods,
    createManualOrder,
    businessSettings,
    isNewOrderModalOpen,
    setIsNewOrderModalOpen,
  } = useOMS();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isNewOrderModalOpen;
  const onClose = propOnClose || (() => setIsNewOrderModalOpen(false));

  const [customerType, setCustomerType] = useState<'EXISTING' | 'NEW'>('NEW');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+94 ');
  const [customerEmail, setCustomerEmail] = useState('');
  const [addressLine, setAddressLine] = useState('Store Pickup — Bambalapitiya Showroom');
  const [city, setCity] = useState('Colombo');

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [shippingFee, setShippingFee] = useState(0);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const existingIdx = orderItems.findIndex((i) => i.productId === product.id);
    if (existingIdx >= 0) {
      const updated = [...orderItems];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].totalPrice = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setOrderItems(updated);
    } else {
      const newItem: OrderItem = {
        id: `item_${Date.now()}_${Math.random()}`,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        unitPrice: product.sellingPrice,
        unitCost: product.costPrice,
        discount: 0,
        totalPrice: product.sellingPrice,
        grossProfit: product.sellingPrice - product.costPrice,
        warrantyDuration: product.warrantyDuration,
        warrantyUnit: product.warrantyUnit,
        serialNumber: `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      };
      setOrderItems([...orderItems, newItem]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleUpdateQty = (index: number, qty: number) => {
    if (qty <= 0) return;
    const updated = [...orderItems];
    updated[index].quantity = qty;
    updated[index].totalPrice = qty * updated[index].unitPrice;
    setOrderItems(updated);
  };

  const subtotal = orderItems.reduce((sum, i) => sum + i.totalPrice, 0);
  const totalAmount = Math.max(0, subtotal - overallDiscount + shippingFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('Please add at least one product to the order.');
      return;
    }

    let customerInfo = {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
    };

    if (customerType === 'EXISTING') {
      const existing = customers.find((c) => c.id === selectedCustomerId);
      if (existing) {
        customerInfo = {
          name: existing.name,
          phone: existing.phone,
          email: existing.email || '',
        };
      }
    }

    createManualOrder({
      source: 'MANUAL',
      customer: customerInfo,
      items: orderItems,
      discount: overallDiscount,
      shippingFee,
      paymentMethod,
      notes,
      shippingAddress: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        addressLine1: addressLine,
        city,
        country: 'Sri Lanka',
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative my-8 animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Create Manual Order</h2>
            <p className="text-xs text-neutral-400">
              For walk-in counter sales, direct phone calls, or WhatsApp orders
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Selection */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-neutral-200">Customer Details</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCustomerType('NEW')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    customerType === 'NEW'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-neutral-400'
                  }`}
                >
                  New Customer
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerType('EXISTING')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                    customerType === 'EXISTING'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-neutral-400'
                  }`}
                >
                  Existing
                </button>
              </div>
            </div>

            {customerType === 'EXISTING' ? (
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.phone} ({c.city})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ruwan Silva"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+94 7X XXX XXXX"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">City / Region</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Colombo"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Add Product Section */}
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800/80 space-y-3">
            <div className="text-xs font-bold text-neutral-200">Add Order Items</div>
            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>
                    {p.name} (Stock: {p.stockQuantity}) — Rs. {p.sellingPrice.toLocaleString()}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 font-semibold text-xs rounded-lg border border-cyan-500/30 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* Selected Items List */}
            {orderItems.length > 0 && (
              <div className="space-y-2 mt-3 pt-3 border-t border-neutral-800">
                {orderItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs"
                  >
                    <div className="flex-1 truncate pr-3">
                      <div className="font-semibold text-neutral-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{item.sku}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-neutral-400">Qty:</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value) || 1)}
                          className="w-12 bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-xs text-center font-mono text-white"
                        />
                      </div>

                      <div className="font-mono font-bold text-white min-w-[70px] text-right">
                        Rs. {item.totalPrice.toLocaleString()}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-neutral-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
              >
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.name}>
                    {pm.name} ({pm.feePercentage}% Fee)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Courier / Shipping (Rs.)</label>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
              />
            </div>
          </div>

          {/* Order Total Card */}
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-cyan-300 font-medium">Order Total</span>
              <div className="text-xl font-black text-white font-mono">
                Rs. {totalAmount.toLocaleString()}
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
            >
              Complete & Place Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
