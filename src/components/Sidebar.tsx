import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Barcode, 
  Truck, 
  DollarSign, 
  MessageSquare, 
  ShieldCheck,
  Boxes,
  ArrowLeftRight,
  LayoutDashboard,
  FileText,
  Sliders,
  Database
} from 'lucide-react';
import { TabType } from '../types';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  orderCount: number;
  invoiceCount: number;
  pendingWaybillCount?: number;
  unprintedBarcodeCount: number;
  pendingWarrantyCount: number;
  pendingTransferCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  orderCount,
  invoiceCount,
  pendingWaybillCount = 0,
  unprintedBarcodeCount,
  pendingWarrantyCount,
  pendingTransferCount,
}) => {
  const [dbStatus, setDbStatus] = useState<{ status: string; provider: string; isAtlas: boolean }>({
    status: 'healthy',
    provider: 'MongoDB Database',
    isAtlas: false,
  });

  useEffect(() => {
    fetch('/api/health/database')
      .then(res => res.json())
      .then(data => {
        if (data && data.status) {
          setDbStatus({
            status: data.status,
            provider: data.provider || 'wowtek_oms',
            isAtlas: !!data.isAtlas,
          });
        }
      })
      .catch(() => {
        // Safe fallback
      });
  }, []);

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { 
      id: 'dashboard', 
      label: 'Sales Analytics & Dashboard', 
      icon: <LayoutDashboard className="w-5 h-5" /> 
    },
    { 
      id: 'products', 
      label: 'Products & Barcode Printing', 
      icon: <Package className="w-5 h-5" /> 
    },
    { 
      id: 'orders', 
      label: 'Live Orders & Courier Waybills', 
      icon: <ShoppingBag className="w-5 h-5" />,
      badge: orderCount > 0 ? orderCount : undefined
    },
    { 
      id: 'invoices', 
      label: 'Invoices & Billing', 
      icon: <FileText className="w-5 h-5" />,
      badge: invoiceCount > 0 ? invoiceCount : undefined
    },
    { 
      id: 'integrations', 
      label: 'API & Courier Integrations', 
      icon: <Sliders className="w-5 h-5" /> 
    },
    { 
      id: 'suppliers', 
      label: 'Suppliers & Warranty Tracker', 
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: pendingWarrantyCount > 0 ? pendingWarrantyCount : undefined
    },
    { 
      id: 'expenses', 
      label: 'Expenses & Financial Breakdown', 
      icon: <DollarSign className="w-5 h-5" /> 
    },
    { 
      id: 'waybills', 
      label: 'Trans Express Waybills', 
      icon: <Truck className="w-5 h-5" />,
      badge: pendingWaybillCount > 0 ? pendingWaybillCount : undefined
    },
    { 
      id: 'sms', 
      label: 'SMS Gateway Settings', 
      icon: <MessageSquare className="w-5 h-5" /> 
    },
    { 
      id: 'barcodes', 
      label: 'Barcode Label Manager', 
      icon: <Barcode className="w-5 h-5" />,
      badge: unprintedBarcodeCount > 0 ? unprintedBarcodeCount : undefined
    },
    { 
      id: 'transfers', 
      label: 'Stock Transfers', 
      icon: <ArrowLeftRight className="w-5 h-5" />,
      badge: pendingTransferCount > 0 ? pendingTransferCount : undefined
    },
    { 
      id: 'audit', 
      label: 'Security Audit Logs', 
      icon: <ShieldCheck className="w-5 h-5" /> 
    },
  ];

  return (
    <aside className="w-72 bg-zinc-950 border-r border-zinc-800/80 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wider flex items-center gap-1.5">
              WOWTEK
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">PRO</span>
            </h1>
            <p className="text-xs text-zinc-400">Business & Order System</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Core OMS Navigation
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-900/20'
                  : 'text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`transition-colors ${isActive ? 'text-purple-400' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  isActive 
                    ? 'bg-purple-500 text-white shadow-sm' 
                    : 'bg-zinc-800 text-purple-400 border border-purple-500/20'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 m-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-zinc-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Database className="w-3.5 h-3.5 text-zinc-400" />
            <span className="truncate max-w-[130px]">
              {dbStatus.isAtlas ? 'MongoDB Atlas' : 'Local Persistent DB'}
            </span>
          </span>
          <span className="text-emerald-400 font-medium text-[11px]">Active</span>
        </div>
        <div className="text-[11px] text-zinc-500 flex justify-between">
          <span>Database: wowtek_oms</span>
          <span>v3.5 PRO</span>
        </div>
      </div>
    </aside>
  );
};
