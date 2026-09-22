/**
 * WOWTEK OMS — Customers Management Module
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  ExternalLink,
  X,
} from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { Customer } from '../types';

export const CustomersView: React.FC = () => {
  const { customers, addCustomer, orders, warranties, businessSettings } = useOMS();

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+94 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Colombo');

  const filteredCustomers = customers.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer({
      name,
      phone,
      email,
      address,
      city,
    });
    setIsAddModalOpen(false);
    setName('');
    setPhone('+94 ');
    setEmail('');
    setAddress('');
  };

  const customerOrders = selectedCustomer
    ? orders.filter((o) => o.customer.phone === selectedCustomer.phone)
    : [];

  const customerWarranties = selectedCustomer
    ? warranties.filter((w) => w.customerPhone === selectedCustomer.phone)
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Customer Directory
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Omnichannel customer profiles, lifetime purchase histories, and registered warranty assets
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex justify-end">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Name, Phone (+94...), City..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/80 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Phone & Email</th>
                <th className="py-3 px-3">City & Address</th>
                <th className="py-3 px-3">Orders Count</th>
                <th className="py-3 px-3">Lifetime Spent</th>
                <th className="py-3 px-3">Last Order</th>
                <th className="py-3 px-3 text-right">View History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {filteredCustomers.map((cust) => (
                <tr
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className="hover:bg-neutral-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{cust.name}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-mono text-cyan-400 font-medium">{cust.phone}</div>
                    {cust.email && <div className="text-[10px] text-neutral-400">{cust.email}</div>}
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-neutral-200">{cust.city}</div>
                    <div className="text-[10px] text-neutral-400 truncate max-w-[180px]">
                      {cust.address}
                    </div>
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-200 font-bold">
                      {cust.orderCount} orders
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                    Rs. {cust.totalSpent.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 font-mono text-[10px] text-neutral-400">
                    {cust.lastOrderDate
                      ? new Date(cust.lastOrderDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCustomer(cust);
                      }}
                      className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-800">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center font-black text-cyan-400 text-lg">
                {selectedCustomer.name[0]}
              </div>
              <div>
                <h2 className="text-lg font-black text-white">{selectedCustomer.name}</h2>
                <div className="text-xs text-neutral-400 font-mono flex items-center gap-3">
                  <span>{selectedCustomer.phone}</span>
                  {selectedCustomer.email && <span>{selectedCustomer.email}</span>}
                  <span>{selectedCustomer.city}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5">
              {/* Lifetime Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-[11px] text-neutral-400">Total Purchase Value</div>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                    Rs. {selectedCustomer.totalSpent.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-[11px] text-neutral-400">Total Orders Placed</div>
                  <div className="text-lg font-black text-white font-mono mt-0.5">
                    {selectedCustomer.orderCount} orders
                  </div>
                </div>
              </div>

              {/* Customer Orders */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Order History ({customerOrders.length})
                </h3>
                {customerOrders.length === 0 ? (
                  <div className="text-xs text-neutral-500 py-3">No orders recorded yet.</div>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((o) => (
                      <div
                        key={o.id}
                        className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-mono font-bold text-cyan-400">{o.orderNumber}</div>
                          <div className="text-neutral-400 text-[11px]">
                            {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-white">
                            Rs. {o.totalAmount.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-cyan-400 font-semibold">{o.orderStatus}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Warranties */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Registered Warranties ({customerWarranties.length})
                </h3>
                {customerWarranties.length === 0 ? (
                  <div className="text-xs text-neutral-500 py-3">No active warranties registered.</div>
                ) : (
                  <div className="space-y-2">
                    {customerWarranties.map((w) => (
                      <div
                        key={w.id}
                        className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-white">{w.productName}</div>
                          <div className="text-[10px] font-mono text-cyan-400">SN: {w.serialNumber}</div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="text-neutral-300">
                            Expires: {new Date(w.expiryDate).toLocaleDateString()}
                          </div>
                          <div className="text-[10px] text-emerald-400 font-semibold">{w.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-1">Add New Customer</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Add contact profile for direct sales, warranty tracking, and SMS
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ruwan Silva"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+94 77 XXX XXXX"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ruwan@example.com"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">City / Town</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Colombo"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="No. 12, Galle Road"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
