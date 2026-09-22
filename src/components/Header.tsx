/**
 * WOWTEK OMS — Top Header Bar
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  Zap,
  CheckCircle,
  Calendar,
  X,
  LogOut,
} from 'lucide-react';
import { useOMS, DateFilterType } from '../context/OMSContext';

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
  onOpenNewOrderModal?: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onOpenNewOrderModal,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  onLogout,
}) => {
  const {
    dateFilter,
    setDateFilter,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    simulateWooCommerceWebhookOrder,
    setIsNewOrderModalOpen,
    setIsMobileMenuOpen,
    currentUser,
    isDbConnected,
    dbInfo,
    dataSource,
  } = useOMS();

  const [internalSearch, setInternalSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSimulatingWc, setIsSimulatingWc] = useState(false);
  const [wcToast, setWcToast] = useState<string | null>(null);

  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : internalSearch;
  const setSearchQuery = propSetSearchQuery || setInternalSearch;

  const handleOpenMobile = onOpenMobileSidebar || (() => setIsMobileMenuOpen(true));
  const handleOpenNewOrder = onOpenNewOrderModal || (() => setIsNewOrderModalOpen(true));

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  const handleSimulateWooCommerce = () => {
    setIsSimulatingWc(true);
    setTimeout(() => {
      const res = simulateWooCommerceWebhookOrder();
      setIsSimulatingWc(false);
      setWcToast(res.message);
      setTimeout(() => setWcToast(null), 5000);
    }, 600);
  };

  const dateFilterOptions: { value: DateFilterType; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-neutral-900 border-b border-neutral-800 backdrop-blur-md px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left Section: Mobile toggle & Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <button
            id="mobile-sidebar-toggle"
            onClick={handleOpenMobile}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 lg:hidden cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="global-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Phone (+94...), Tracking #, or SKU..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-4 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-hidden focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Center/Right Section: Date Filter & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Database & Data Source Status Badge */}
          <div
            id="database-status-indicator"
            title={dbInfo}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono border ${
              isDbConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-[11px] tracking-wide">
              {isDbConnected ? 'ATLAS LIVE' : 'DEMO MODE'}
            </span>
          </div>

          {/* Date Range Selector */}
          <div className="hidden sm:flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 ml-1.5 mr-1" />
            <div className="flex gap-1">
              {dateFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  id={`date-filter-${opt.value}`}
                  onClick={() => setDateFilter(opt.value)}
                  className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                    dateFilter === opt.value
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test WooCommerce Webhook simulator button */}
          <button
            id="simulate-wc-order-btn"
            onClick={handleSimulateWooCommerce}
            disabled={isSimulatingWc}
            title="Simulate a live WooCommerce webhook order event"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-cyan-500/30 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Zap className={`w-3.5 h-3.5 text-cyan-400 ${isSimulatingWc ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Simulate WC Order</span>
            <span className="md:hidden">Simulate</span>
          </button>

          {/* New Manual Order */}
          <button
            id="create-manual-order-header-btn"
            onClick={handleOpenNewOrder}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Manual Order</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              id="notifications-toggle-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-neutral-200">System Notifications</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                      {notifications.length}
                    </span>
                  </div>
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="mt-3 space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-neutral-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationAsRead(n.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          n.isRead
                            ? 'bg-neutral-950/40 border-neutral-800 text-neutral-400'
                            : 'bg-neutral-800 border-cyan-500/30 text-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span className={n.isRead ? 'text-neutral-300' : 'text-cyan-300'}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Toast for WooCommerce simulation feedback */}
      {wcToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold">WooCommerce Webhook Ingested</div>
            <div className="text-emerald-300/80">{wcToast}</div>
          </div>
          <button onClick={() => setWcToast(null)} className="ml-2 text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </header>
  );
};
