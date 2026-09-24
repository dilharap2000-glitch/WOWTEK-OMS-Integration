/**
 * WOWTEK OMS — Settings & Audit Trail Module
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  CreditCard,
  Percent,
  Building,
  History,
  UserPlus,
  Save,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { formatTime } from '../lib/formatters';

export const SettingsView: React.FC = () => {
  const {
    businessSettings,
    updateBusinessSettings,
    paymentMethods,
    updatePaymentMethod,
    platformCommissions,
    updatePlatformCommission,
    users,
    addUser,
    auditLogs,
    currentUser,
  } = useOMS();

  const [activeSubTab, setActiveSubTab] = useState<'BUSINESS' | 'FEES' | 'USERS' | 'AUDIT'>('BUSINESS');
  const [toast, setToast] = useState<string | null>(null);

  // Business Form
  const [businessName, setBusinessName] = useState(businessSettings.name);
  const [legalName, setLegalName] = useState(businessSettings.legalName);
  const [website, setWebsite] = useState(businessSettings.website);
  const [phone, setPhone] = useState(businessSettings.phone);
  const [email, setEmail] = useState(businessSettings.email);
  const [address, setAddress] = useState(businessSettings.address);
  const [city, setCity] = useState(businessSettings.city);
  const [vatNumber, setVatNumber] = useState(businessSettings.vatNumber);
  const [invoiceTerms, setInvoiceTerms] = useState(businessSettings.invoiceTerms);
  const [warrantyTerms, setWarrantyTerms] = useState(businessSettings.warrantyTerms);

  // User Form
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessSettings({
      name: businessName,
      legalName,
      website,
      phone,
      email,
      address,
      city,
      vatNumber,
      invoiceTerms,
      warrantyTerms,
    });
    showToast('Business profile updated successfully!');
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    addUser({
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      isActive: true,
    });
    setNewUserName('');
    setNewUserEmail('');
    showToast(`Created user ${newUserName} (${newUserRole})`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            System Administration & Settings
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure business identity, platform commissions, payment gateways, and view immutable audit trails
          </p>
        </div>
      </div>

      {toast && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-800">
        {[
          { id: 'BUSINESS', label: 'Business Profile & Legal', icon: Building },
          { id: 'FEES', label: 'Fees & Channel Commissions', icon: Percent },
          { id: 'USERS', label: 'Staff & Roles (RBAC)', icon: Shield },
          { id: 'AUDIT', label: 'Security & Audit Logs', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-2 transition-colors ${
                isActive
                  ? 'border-cyan-500 text-cyan-300 bg-neutral-900/60'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: Business Profile */}
      {activeSubTab === 'BUSINESS' && (
        <form onSubmit={handleSaveBusiness} className="space-y-5">
          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Legal Business Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Trading Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Registered Legal Entity</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Official Website</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Official Helpline Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Support Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Sri Lanka VAT / TIN Registration #</label>
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-neutral-400 block mb-1">Store / Hub Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-neutral-800">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Invoice Terms & Return Policy</label>
                <textarea
                  rows={2}
                  value={invoiceTerms}
                  onChange={(e) => setInvoiceTerms(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Warranty Policy & Terms</label>
                <textarea
                  rows={2}
                  value={warrantyTerms}
                  onChange={(e) => setWarrantyTerms(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Business Identity</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab Content: Fees & Commissions (Do not hardcode rule!) */}
      {activeSubTab === 'FEES' && (
        <div className="space-y-6">
          {/* Payment Gateway Fee Rates */}
          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Payment Gateway Merchant Fees
              </h2>
              <p className="text-xs text-neutral-400">
                Configure processing deduction rates without modifying system code.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-neutral-200">{pm.name}</span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      {pm.feePercentage}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      value={pm.feePercentage}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        updatePaymentMethod(pm.id, { feePercentage: val });
                      }}
                      className="w-20 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                    <span className="text-xs text-neutral-400">% fee</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Platform Channel Commissions */}
          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Platform Channel Commissions
              </h2>
              <p className="text-xs text-neutral-400">
                Configure commission deducted by PickMe, Uber Eats, or partner channels.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {platformCommissions.map((pc) => (
                <div key={pc.id} className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-neutral-200">{pc.name}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {pc.commissionPercentage}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      value={pc.commissionPercentage}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        updatePlatformCommission(pc.id, { commissionPercentage: val });
                      }}
                      className="w-20 bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white font-mono"
                    />
                    <span className="text-xs text-neutral-400">% commission</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Team & RBAC */}
      {activeSubTab === 'USERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Active Team Members & Roles
            </h2>

            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-cyan-400">
                      {u.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">{u.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {u.role}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Add Staff Member
            </h2>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Nimalka Dias"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="staff@wowtek.lk"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Assigned Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                >
                  <option value="STAFF">STAFF (Orders, Products, Waybills)</option>
                  <option value="ADMIN">ADMIN (Full Access & Configuration)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab Content: Audit Logs */}
      {activeSubTab === 'AUDIT' && (
        <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                System Security & Activity Audit Log
              </h2>
              <p className="text-xs text-neutral-400">
                Immutable trace of order transitions, inventory mutations, and settings changes
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">{auditLogs.length} events recorded</span>
          </div>

          <div className="rounded-xl border border-neutral-800 overflow-hidden">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">User & IP</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Module</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {auditLogs.slice(0, 15).map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-800/30">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-neutral-400">
                      {formatTime(log.createdAt, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-neutral-200">{log.userName}</div>
                      <div className="font-mono text-[10px] text-neutral-500">{log.ipAddress}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-800 text-cyan-300 border border-neutral-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-400 font-mono text-[11px]">
                      {log.module}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-300 max-w-[320px] truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
