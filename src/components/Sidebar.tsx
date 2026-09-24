/**
 * WOWTEK OMS — Sidebar Navigation
 * Business: WOWTEK (wowtek.lk)
 */

import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Truck,
  FileText,
  ShieldCheck,
  TrendingUp,
  Plug,
  Settings,
  Building2,
  LogOut,
  Shield,
} from 'lucide-react';
import { useOMS, ViewType } from '../context/OMSContext';

interface SidebarProps {
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const {
    currentView,
    setCurrentView,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    currentUser,
    setCurrentUser,
    users,
    dashboardMetrics,
  } = useOMS();

  const pendingCount = dashboardMetrics.pendingOrders;
  const lowStockCount = dashboardMetrics.lowStockProducts;
  const warrantyAlerts = dashboardMetrics.warrantyExpiries30d;

  const navItems: {
    id: ViewType;
    label: string;
    icon: any;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'DASHBOARD',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'ORDERS',
      label: 'Orders',
      icon: ShoppingCart,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'PRODUCTS',
      label: 'Products & Stock',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'WAYBILLS',
      label: 'Waybills & Courier',
      icon: Truck,
      badge: dashboardMetrics.readyToShipOrders > 0 ? `${dashboardMetrics.readyToShipOrders} ready` : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'INVOICES',
      label: 'Invoices',
      icon: FileText,
    },
    {
      id: 'WARRANTY',
      label: 'Warranty Hub',
      icon: ShieldCheck,
      badge: warrantyAlerts > 0 ? warrantyAlerts : undefined,
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    {
      id: 'FINANCE',
      label: 'Profit & Loss',
      icon: TrendingUp,
    },
    {
      id: 'CUSTOMERS',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'SUPPLIERS',
      label: 'Suppliers',
      icon: Building2,
    },
    {
      id: 'INTEGRATIONS',
      label: 'Integrations',
      icon: Plug,
    },
    {
      id: 'SETTINGS',
      label: 'Settings & Audit',
      icon: Settings,
    },
    ...(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN'
      ? [
          {
            id: 'SUPER_ADMIN' as ViewType,
            label: 'SaaS Platform Admin',
            icon: Shield,
            badge: 'ROOT',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          },
        ]
      : []),
  ];

  const handleSelect = (view: ViewType) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        id="wowtek-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-xl tracking-tight shadow-lg shadow-cyan-500/20">
              W
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-wider">
                  WOWTEK
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  OMS
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">wowtek.lk</p>
            </div>
          </div>
        </div>

        {/* Store Context Badge */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-neutral-800/60 border border-neutral-700/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-neutral-200">Colombo Hub</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">LK (LKR)</span>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id.toLowerCase()}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-cyan-400' : 'text-neutral-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-neutral-800 text-neutral-300 border-neutral-700'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active User Switcher / RBAC Demo */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900/90 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
              Active User (RBAC)
            </span>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Switch Profile / Sign Out"
                className="text-neutral-400 hover:text-rose-400 transition-colors p-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            {users.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  id={`user-select-${u.id}`}
                  onClick={() => setCurrentUser(u)}
                  className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800 text-white border border-neutral-700'
                      : 'text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-left truncate">
                    <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center font-bold text-[10px] text-cyan-400">
                      {u.name[0]}
                    </div>
                    <div className="truncate">
                      <div className="font-medium text-neutral-200 truncate text-[11px]">{u.name}</div>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                      u.role === 'SUPER_ADMIN'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : u.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {u.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};
