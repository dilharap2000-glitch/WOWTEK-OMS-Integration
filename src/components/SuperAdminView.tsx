/**
 * WOWTEK OMS — Super Admin SaaS Management Dashboard
 * Platform Owner Command Center for Multi-Tenant Management
 */

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldAlert,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  Server,
  Layers,
  ArrowRight,
  Shield,
  Clock,
  Briefcase,
  DollarSign,
  Activity,
} from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { apiClient } from '../services/apiClient';
import { Tenant, SuperAdminMetrics, SubscriptionPlan, AuditLog } from '../types';

export const SuperAdminView: React.FC = () => {
  const {
    tenants,
    currentTenant,
    switchTenant,
    currentUser,
    refreshData,
  } = useOMS();

  const [metrics, setMetrics] = useState<SuperAdminMetrics | null>(null);
  const [tenantList, setTenantList] = useState<Tenant[]>(tenants);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New Tenant Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizEmail, setNewBizEmail] = useState('');
  const [newBizPhone, setNewBizPhone] = useState('+94 11 ');
  const [newBizAddress, setNewBizAddress] = useState('');
  const [newBizPlan, setNewBizPlan] = useState('STARTER');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sub-tabs
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BUSINESSES' | 'PLANS' | 'AUDIT'>('OVERVIEW');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [metricsData, tenantsData, plansData] = await Promise.allSettled([
        apiClient.getSuperAdminMetrics(),
        apiClient.getSuperAdminTenants(),
        apiClient.getSubscriptionPlans(),
      ]);

      if (metricsData.status === 'fulfilled' && metricsData.value) {
        setMetrics(metricsData.value.metrics);
        if (metricsData.value.tenants && metricsData.value.tenants.length > 0) {
          setTenantList(metricsData.value.tenants);
        }
      } else if (tenantsData.status === 'fulfilled' && tenantsData.value.length > 0) {
        setTenantList(tenantsData.value);
      }

      if (plansData.status === 'fulfilled' && plansData.value.length > 0) {
        setPlans(plansData.value);
      }
    } catch (err: any) {
      console.warn('[SUPER ADMIN LOAD]', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName || !newBizEmail) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.createTenant({
        businessName: newBizName,
        email: newBizEmail,
        phone: newBizPhone,
        address: newBizAddress,
        planId: newBizPlan,
      });

      if (res.success && res.tenant) {
        showNotification(`Tenant "${res.tenant.businessName}" created with 14-day trial!`);
        setIsCreateModalOpen(false);
        setNewBizName('');
        setNewBizEmail('');
        setNewBizPhone('+94 11 ');
        setNewBizAddress('');
        await loadData();
        await refreshData();
      } else {
        showNotification(res.error || 'Failed to create tenant', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (tenantId: string, newStatus: string) => {
    try {
      const ok = await apiClient.updateTenantStatus(tenantId, newStatus);
      if (ok) {
        showNotification(`Tenant ${tenantId} status set to ${newStatus}`);
        setTenantList((prev) =>
          prev.map((t) =>
            t.tenantId === tenantId ? { ...t, subscriptionStatus: newStatus as any } : t
          )
        );
      } else {
        showNotification('Failed to update tenant status', 'error');
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  const handleSwitchToTenant = async (t: Tenant) => {
    try {
      await switchTenant(t.tenantId);
      showNotification(`Switched active context to ${t.businessName}`);
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  // Filtered tenants
  const filteredTenants = tenantList.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.businessName.toLowerCase().includes(q) ||
      t.tenantId.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.phone && t.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-linear-to-r from-neutral-900 via-neutral-900/90 to-purple-950/30 border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-black shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  SaaS Super Admin Platform Center
                </h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  GLOBAL ROOT
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Centralized tenant provisioning, plan governance, and database isolation oversight
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 transition-colors cursor-pointer"
              title="Refresh Global SaaS Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New Business</span>
            </button>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Total Tenants</span>
            </div>
            <div className="text-xl font-black text-white mt-1">
              {metrics?.totalBusinesses ?? tenantList.length}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              Across all regions
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Paid</span>
            </div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {metrics?.activeBusinesses ?? tenantList.filter((t) => t.subscriptionStatus === 'ACTIVE').length}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              Paid Subscriptions
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Trials</span>
            </div>
            <div className="text-xl font-black text-amber-400 mt-1">
              {metrics?.trialBusinesses ?? tenantList.filter((t) => t.subscriptionStatus === 'TRIAL').length}
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              14-day evaluation
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800">
            <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
              <span>Platform GMV</span>
            </div>
            <div className="text-xl font-black text-cyan-400 mt-1">
              Rs. {((metrics?.totalRevenueAcrossPlatform ?? 285400) / 1000).toFixed(1)}k
            </div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
              {metrics?.totalOrdersAcrossPlatform ?? 14} total orders
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-neutral-800">
        {[
          { id: 'OVERVIEW', label: 'Platform Overview & Isolation', icon: Server },
          { id: 'BUSINESSES', label: `Registered Tenants (${tenantList.length})`, icon: Building2 },
          { id: 'PLANS', label: 'Subscription Plan Governance', icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-purple-500 text-purple-300 bg-neutral-900/60'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ISOLATION CHECK */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-5">
          {/* Active Tenant Context Bar */}
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-mono">
                Currently Emulating Business Context:
              </div>
              <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                <span>{currentTenant?.businessName || 'WOWTEK Colombo Hub'}</span>
                <span className="text-xs font-mono text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                  {currentTenant?.tenantId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Switch active context:</span>
              <select
                value={currentTenant?.tenantId || ''}
                onChange={(e) => {
                  const target = tenantList.find((t) => t.tenantId === e.target.value);
                  if (target) handleSwitchToTenant(target);
                }}
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 font-mono focus:border-purple-500 focus:outline-hidden"
              >
                {tenantList.map((t) => (
                  <option key={t.tenantId} value={t.tenantId}>
                    {t.businessName} ({t.tenantId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Architecture Guardrails Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Automated Tenant Injection</span>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed">
                All database queries utilize <code className="text-cyan-400">scopeCollection</code> to guarantee that every document operation implicitly binds to <code className="text-cyan-400">req.tenantId</code>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                <Shield className="w-4 h-4" />
                <span>AES-256-GCM Vault</span>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Third-party API keys (WooCommerce, PickMe, Uber Eats, Trans Express) are stored encrypted at rest with random 12-byte IVs. Keys are never sent to browsers.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
                <Layers className="w-4 h-4" />
                <span>Strict Limit Enforcement</span>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Monthly order quotas, staff seat allocations, and adapter counts are validated server-side on creation before database insertion.
              </p>
            </div>
          </div>

          {/* Plan Distribution Breakdown */}
          <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Subscription Plan Distribution Across Platform
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { plan: 'FREE', color: 'text-neutral-400', border: 'border-neutral-800', count: metrics?.subscriptionsByPlan?.FREE ?? 0 },
                { plan: 'STARTER', color: 'text-blue-400', border: 'border-blue-500/30', count: metrics?.subscriptionsByPlan?.STARTER ?? 1 },
                { plan: 'BUSINESS', color: 'text-purple-400', border: 'border-purple-500/30', count: metrics?.subscriptionsByPlan?.BUSINESS ?? 1 },
                { plan: 'PRO / ENTERPRISE', color: 'text-amber-400', border: 'border-amber-500/30', count: metrics?.subscriptionsByPlan?.PRO ?? 1 },
              ].map((p) => (
                <div key={p.plan} className={`p-4 rounded-xl bg-neutral-950 border ${p.border}`}>
                  <div className="text-[11px] font-mono text-neutral-400">{p.plan}</div>
                  <div className={`text-2xl font-black ${p.color} mt-1`}>{p.count}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">Active Tenants</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TENANTS LIST & MANAGEMENT */}
      {activeTab === 'BUSINESSES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search businesses by name, slug, or tenantId..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-purple-500"
              />
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Business</span>
            </button>
          </div>

          <div className="rounded-xl border border-neutral-800 overflow-hidden bg-neutral-900">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Business & Tenant ID</th>
                  <th className="py-3 px-4">Contact & Location</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {filteredTenants.map((t) => {
                  const isCurrent = t.tenantId === currentTenant?.tenantId;
                  return (
                    <tr key={t.tenantId} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-white text-sm">{t.businessName}</div>
                          {isCurrent && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-neutral-400 mt-0.5">{t.tenantId}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-neutral-200">{t.email}</div>
                        <div className="font-mono text-[11px] text-neutral-400">{t.phone} • {t.country}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[11px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          {t.subscriptionPlan || 'STARTER'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={t.subscriptionStatus}
                          onChange={(e) => handleStatusChange(t.tenantId, e.target.value)}
                          className={`font-mono text-[10px] font-bold px-2 py-1 rounded border bg-neutral-950 cursor-pointer ${
                            t.subscriptionStatus === 'ACTIVE'
                              ? 'text-emerald-400 border-emerald-500/30'
                              : t.subscriptionStatus === 'TRIAL'
                              ? 'text-amber-400 border-amber-500/30'
                              : 'text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="TRIAL">TRIAL</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                          <option value="EXPIRED">EXPIRED</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSwitchToTenant(t)}
                          disabled={isCurrent}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                              : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30'
                          }`}
                        >
                          {isCurrent ? 'Current' : 'Emulate Context'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION PLANS GOVERNANCE */}
      {activeTab === 'PLANS' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              SaaS Subscription Tier Configurations & Limits
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Limits enforced automatically during order creation, team additions, and integration configuration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                id: 'FREE',
                name: 'Free Starter',
                price: 'Rs. 0 / mo',
                orders: 50,
                staff: 1,
                integrations: 1,
                desc: 'Suitable for single-owner popups and testing.',
              },
              {
                id: 'STARTER',
                name: 'Starter Growth',
                price: 'Rs. 6,500 / mo',
                orders: 500,
                staff: 3,
                integrations: 2,
                desc: 'Standard setup with WooCommerce and SMS reminders.',
              },
              {
                id: 'BUSINESS',
                name: 'Business Pro',
                price: 'Rs. 18,500 / mo',
                orders: 2500,
                staff: 10,
                integrations: 5,
                desc: 'Full omnichannel sync with PickMe, Uber, and Trans Express.',
              },
              {
                id: 'PRO',
                name: 'Enterprise Unlimited',
                price: 'Rs. 45,000 / mo',
                orders: -1,
                staff: -1,
                integrations: -1,
                desc: 'Unlimited throughput, custom SLA, and dedicated cluster.',
              },
            ].map((p) => (
              <div key={p.id} className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-sm">{p.name}</h3>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {p.id}
                  </span>
                </div>

                <div className="text-xl font-black text-cyan-400 font-mono">{p.price}</div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">{p.desc}</p>

                <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-400">Monthly Orders:</span>
                    <span className="text-emerald-400 font-bold">{p.orders === -1 ? 'Unlimited' : p.orders}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-400">Team Seats:</span>
                    <span className="text-cyan-400 font-bold">{p.staff === -1 ? 'Unlimited' : p.staff}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span className="text-neutral-400">Integrations:</span>
                    <span className="text-purple-400 font-bold">{p.integrations === -1 ? 'All' : p.integrations}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CREATE NEW TENANT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-neutral-900 border border-purple-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-bold text-white">Provision New SaaS Tenant</h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3.5">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="e.g. Ceylon Gadgets Hub"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Owner / Admin Email *</label>
                <input
                  type="email"
                  required
                  value={newBizEmail}
                  onChange={(e) => setNewBizEmail(e.target.value)}
                  placeholder="owner@ceylongadgets.lk"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={newBizPhone}
                    onChange={(e) => setNewBizPhone(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Initial Plan</label>
                  <select
                    value={newBizPlan}
                    onChange={(e) => setNewBizPlan(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                  >
                    <option value="STARTER">STARTER (500 orders)</option>
                    <option value="BUSINESS">BUSINESS (2,500 orders)</option>
                    <option value="PRO">PRO (Unlimited)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Store / Hub Address</label>
                <input
                  type="text"
                  value={newBizAddress}
                  onChange={(e) => setNewBizAddress(e.target.value)}
                  placeholder="Colombo 03, Sri Lanka"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
                />
              </div>

              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-300">
                A unique <code className="text-white">tenantId</code> will be generated, compounding indexes applied, and a 14-day free trial will activate automatically.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Tenant...' : 'Provision Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
