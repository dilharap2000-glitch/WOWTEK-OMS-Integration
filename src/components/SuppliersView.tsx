/**
 * WOWTEK OMS — Suppliers Management Module
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import { Building2, Plus, Search, Phone, Mail, MapPin, X } from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { formatNumber } from '../lib/formatters';

export const SuppliersView: React.FC = () => {
  const { suppliers, addSupplier } = useOMS();

  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('+94 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const filteredSuppliers = suppliers.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.company.toLowerCase().includes(q) ||
        s.phone.includes(q)
      );
    }
    return true;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSupplier({
      name,
      company,
      phone,
      email,
      address,
    });
    setIsAddModalOpen(false);
    setName('');
    setCompany('');
    setPhone('+94 ');
    setEmail('');
    setAddress('');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Suppliers & Procurement
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Authorized tech product distributors, purchase orders, and inventory cost tracking
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-linear-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      <div className="flex justify-end">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Supplier, Company, Phone..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supp) => (
          <div
            key={supp.id}
            className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3 hover:border-cyan-500/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                AUTHORIZED
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                Purchased: Rs. {formatNumber(supp.totalPurchases)}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-white text-base">{supp.company}</h3>
              <p className="text-xs text-neutral-400">Contact Person: {supp.name}</p>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-neutral-800/80 text-xs text-neutral-300">
              <div className="flex items-center gap-2 font-mono text-neutral-200">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                <span>{supp.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <Mail className="w-3.5 h-3.5" />
                <span>{supp.email}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{supp.address}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-1">Add Tech Supplier</h2>
            <p className="text-xs text-neutral-400 mb-4">
              Register hardware vendor for inventory cost accounting
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Company / Distributor Name *</label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Ugreen Lanka Holdings"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Representative Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sajith Jayawardena"
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
                  placeholder="+94 11 XXX XXXX"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sales@distributor.lk"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Office / Warehouse Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Colombo 03"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
