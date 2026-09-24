/**
 * WOWTEK OMS — Dashboard Module
 * Business: WOWTEK (wowtek.lk)
 */

import React from 'react';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Clock,
  Truck,
  CheckCircle2,
  PackageX,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
  Zap,
  Globe,
  Bike,
  Store,
  FileText,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { useOMS } from '../context/OMSContext';
import { ChannelSource, Order } from '../types';
import { formatCurrency, formatNumber, formatDate } from '../lib/formatters';

interface DashboardViewProps {
  onSelectOrder?: (order: Order) => void;
  onNavigateTab?: (tab: any) => void;
}

const CHANNEL_COLORS: Record<ChannelSource, string> = {
  WEBSITE: '#06b6d4', // Cyan
  PICKME: '#eab308',  // Yellow
  UBER_EATS: '#10b981', // Emerald
  MANUAL: '#8b5cf6', // Violet
};

const CHANNEL_NAMES: Record<ChannelSource, string> = {
  WEBSITE: 'Website (wowtek.lk)',
  PICKME: 'PickMe Food & Courier',
  UBER_EATS: 'Uber Eats',
  MANUAL: 'Manual / Store POS',
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onSelectOrder, onNavigateTab }) => {
  const { dashboardMetrics, orders, businessSettings, dateFilter, setDateFilter, setCurrentView } = useOMS();

  const handleNavigate = onNavigateTab || ((tab: any) => {
    const tabMap: Record<string, any> = {
      orders: 'ORDERS',
      products: 'PRODUCTS',
      warranty: 'WARRANTY',
      waybills: 'WAYBILLS',
      finance: 'FINANCE',
      integrations: 'INTEGRATIONS',
      settings: 'SETTINGS',
      customers: 'CUSTOMERS',
      suppliers: 'SUPPLIERS',
      invoices: 'INVOICES',
    };
    setCurrentView(tabMap[tab] || 'DASHBOARD');
  });

  const formatLKR = (amount: number | null | undefined) => {
    return formatCurrency(amount, businessSettings.currencySymbol);
  };

  const channelChartData = dashboardMetrics.salesByChannel.map((item) => ({
    name: CHANNEL_NAMES[item.channel].split(' ')[0],
    channel: item.channel,
    Sales: item.sales,
    Profit: item.profit,
    Orders: item.orders,
  }));

  const pieData = dashboardMetrics.salesByChannel
    .filter((i) => i.sales > 0)
    .map((item) => ({
      name: (CHANNEL_NAMES[item.channel] || item.channel || '').split(' ')[0] || item.channel,
      value: item.sales,
      color: CHANNEL_COLORS[item.channel] || '#06b6d4',
    }));

  const recentOrders = [...orders]
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    })
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-8">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Executive Overview
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
              LIVE METRICS
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Operations summary for WOWTEK Colombo Central Hub • Filtering: <span className="text-cyan-400 font-semibold capitalize">{(dateFilter || 'today').replace(/_/g, ' ')}</span>
          </p>
        </div>

        {/* Quick Module Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => handleNavigate('waybills')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors shrink-0 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Waybills ({dashboardMetrics.readyToShipOrders})</span>
          </button>
          <button
            onClick={() => handleNavigate('warranty')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors shrink-0 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
            <span>Warranties ({dashboardMetrics.warrantyExpiries30d})</span>
          </button>
          <button
            onClick={() => handleNavigate('finance')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors shrink-0 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Profit & Loss</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Today's Sales */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/90 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Today's Sales</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white font-mono tracking-tight">
            {formatLKR(dashboardMetrics.todaySales)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span className="text-cyan-400 font-bold">{dashboardMetrics.todayOrders}</span> orders today
          </div>
        </div>

        {/* Today's Net Profit */}
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/90 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Today's Net Profit</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
            {formatLKR(dashboardMetrics.todayNetProfit)}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            After COGS, courier & commissions
          </div>
        </div>

        {/* Pending & Processing Orders */}
        <div
          onClick={() => handleNavigate('orders')}
          className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/90 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
            {dashboardMetrics.pendingOrders}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>Requires action</span>
            <span className="text-amber-400 text-[10px] flex items-center gap-0.5">
              View <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Ready to Ship & Shipped */}
        <div
          onClick={() => handleNavigate('waybills')}
          className="p-4 rounded-xl bg-neutral-900 border border-neutral-800/90 shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Ready / Shipped</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white font-mono tracking-tight">
            {dashboardMetrics.readyToShipOrders} / {dashboardMetrics.shippedOrders}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center justify-between">
            <span>Trans Express queue</span>
            <span className="text-cyan-400 text-[10px] flex items-center gap-0.5">
              Waybills <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Quick Health Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-neutral-400 font-medium">Delivered Orders</div>
            <div className="text-base font-bold text-neutral-200 mt-0.5 font-mono">
              {dashboardMetrics.deliveredOrders}
            </div>
          </div>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>

        <div
          onClick={() => handleNavigate('products')}
          className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-rose-500/30 transition-colors"
        >
          <div>
            <div className="text-[11px] text-neutral-400 font-medium">Low-Stock SKUs</div>
            <div className={`text-base font-bold mt-0.5 font-mono ${dashboardMetrics.lowStockProducts > 0 ? 'text-rose-400' : 'text-neutral-200'}`}>
              {dashboardMetrics.lowStockProducts} SKUs
            </div>
          </div>
          <PackageX className="w-4 h-4 text-rose-400" />
        </div>

        <div
          onClick={() => handleNavigate('warranty')}
          className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-orange-500/30 transition-colors"
        >
          <div>
            <div className="text-[11px] text-neutral-400 font-medium">Warranty Expiries (&lt;30d)</div>
            <div className={`text-base font-bold mt-0.5 font-mono ${dashboardMetrics.warrantyExpiries30d > 0 ? 'text-orange-400' : 'text-neutral-200'}`}>
              {dashboardMetrics.warrantyExpiries30d} Units
            </div>
          </div>
          <ShieldAlert className="w-4 h-4 text-orange-400" />
        </div>

        <div
          onClick={() => handleNavigate('integrations')}
          className="p-3 rounded-lg bg-neutral-900/60 border border-neutral-800 flex items-center justify-between cursor-pointer hover:border-cyan-500/30 transition-colors"
        >
          <div>
            <div className="text-[11px] text-neutral-400 font-medium">WooCommerce Webhook</div>
            <div className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Active (/api/webhooks)
            </div>
          </div>
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
      </div>

      {/* Sales & Profit Breakdown by Channel (Charts & Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Sales & Net Profit by Channel */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Sales & Profit by Channel
              </h2>
              <p className="text-xs text-neutral-400">
                Comparison of gross sales vs net profit across website, PickMe, Uber Eats, and manual
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
              LKR
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#737373" fontSize={11} tickLine={false} />
                <YAxis stroke="#737373" fontSize={10} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#262626',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [`Rs. ${formatNumber(value)}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Sales" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Gross Sales" />
                <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Breakdown Cards */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide mb-1">
              Channel Margin Breakdown
            </h2>
            <p className="text-xs text-neutral-400 mb-4">
              Net margin % after platform commissions
            </p>

            <div className="space-y-3">
              {dashboardMetrics.profitByChannel.map((item) => {
                const color = CHANNEL_COLORS[item.channel];
                return (
                  <div
                    key={item.channel}
                    className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-800/80 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-neutral-200 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span>{CHANNEL_NAMES[item.channel]}</span>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">
                        {item.margin}% margin
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/60">
                      <span>Net: {formatLKR(item.netProfit)}</span>
                      <span>Gross: {formatLKR(item.grossProfit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800/80 text-center">
            <button
              onClick={() => handleNavigate('finance')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              View Detailed Finance & Expense Report <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Recent Orders
            </h2>
            <p className="text-xs text-neutral-400">
              Latest incoming orders from all integrated sales channels
            </p>
          </div>
          <button
            onClick={() => handleNavigate('orders')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            All Orders ({orders.length}) <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/60 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-2.5 px-3">Order #</th>
                <th className="py-2.5 px-3">Channel</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Items</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-sans">
              {recentOrders.map((order) => {
                const channelColor = CHANNEL_COLORS[order.source];
                return (
                  <tr
                    key={order.id}
                    onClick={() => {
                      if (onSelectOrder) {
                        onSelectOrder(order);
                      } else {
                        setCurrentView('ORDERS');
                      }
                    }}
                    className="hover:bg-neutral-800/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                      {order.orderNumber}
                      {order.externalOrderId && (
                        <div className="text-[10px] text-neutral-400 font-normal">
                          {order.externalOrderId}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                        style={{
                          backgroundColor: `${channelColor}15`,
                          borderColor: `${channelColor}40`,
                          color: channelColor,
                        }}
                      >
                        {order.source === 'WEBSITE' && <Globe className="w-2.5 h-2.5" />}
                        {order.source === 'PICKME' && <Bike className="w-2.5 h-2.5" />}
                        {order.source === 'UBER_EATS' && <Store className="w-2.5 h-2.5" />}
                        {order.source === 'MANUAL' && <FileText className="w-2.5 h-2.5" />}
                        {order.source}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-neutral-100">{order.customer.name}</div>
                      <div className="text-[10px] text-neutral-400 font-mono">{order.customer.phone}</div>
                    </td>
                    <td className="py-3 px-3 max-w-[200px] truncate">
                      <span className="text-neutral-300">
                        {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-white">
                      {formatLKR(order.totalAmount)}
                      <div className="text-[10px] text-emerald-400 font-normal">
                        Profit: {formatLKR(order.profit?.netProfit || 0)}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 text-[11px] font-medium border border-neutral-700/60">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          order.orderStatus === 'NEW'
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            : order.orderStatus === 'CONFIRMED'
                            ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            : order.orderStatus === 'READY_TO_SHIP'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : order.orderStatus === 'SHIPPED'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : order.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                        }`}
                      >
                        {(order.orderStatus || 'PENDING').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectOrder) {
                            onSelectOrder(order);
                          } else {
                            setCurrentView('ORDERS');
                          }
                        }}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
