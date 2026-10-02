import React from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Truck, 
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Order, ProductItem, Expense, Outlet, GRNEntry } from '../types';
import { formatCurrency } from '../utils/storage';

interface DashboardTabProps {
  orders: Order[];
  products: ProductItem[];
  expenses: Expense[];
  outlets: Outlet[];
  currentOutletId: string;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders,
  products,
  expenses,
  outlets,
  currentOutletId,
}) => {
  // Filter by current outlet if not 'all'
  const filteredOrders = currentOutletId === 'all' 
    ? orders 
    : orders.filter(o => o.outletId === currentOutletId);

  const filteredExpenses = currentOutletId === 'all'
    ? expenses
    : expenses.filter(e => e.outletId === currentOutletId);

  // Metrics
  const totalOrders = filteredOrders.length;
  const totalSales = filteredOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const grossSalesProfit = filteredOrders.reduce((acc, o) => acc + o.netProfit, 0);
  const totalDeductions = filteredOrders.reduce((acc, o) => acc + o.commissionFee + o.serviceFee + o.discount, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossSalesProfit - totalDeductions - totalExpenses;

  const pendingWaybills = filteredOrders.filter(o => o.source === 'Website' && o.status !== 'Delivered').length;
  
  // Low stock alerts (stock <= 5 in any applicable outlet)
  const lowStockProducts = products.filter(p => {
    if (currentOutletId === 'all') {
      return Object.values(p.stockByOutlet).some(qty => qty <= 3);
    }
    return (p.stockByOutlet[currentOutletId] || 0) <= 3;
  });

  return (
    <div className="p-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900/30 via-zinc-900 to-zinc-950 border border-purple-500/20 rounded-2xl p-6 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span>WOWTEK Executive Command Center</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {currentOutletId === 'all' ? 'All Outlets Overview' : outlets.find(o => o.id === currentOutletId)?.name}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">Real-time financial synthesis, inventory valuation, and multi-outlet logistics telemetry.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>MongoDB & Secure Webhooks Connected</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Revenue / Sales</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatCurrency(totalSales)}</div>
          <p className="text-xs text-zinc-500 mt-2">{totalOrders} Orders processed successfully</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Gross Sales Profit</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatCurrency(grossSalesProfit)}</div>
          <p className="text-xs text-zinc-500 mt-2">Before deductions & expenses</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Expenses & Deductions</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatCurrency(totalExpenses + totalDeductions)}</div>
          <p className="text-xs text-zinc-500 mt-2">Commissions, delivery & operational expenses</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Net Profit</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(netProfit)}
          </div>
          <p className="text-xs text-zinc-400 mt-2">Gross Profit - Deductions - Expenses</p>
        </div>
      </div>

      {/* Operational Alerts & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Low Stock Alerts ({lowStockProducts.length})</span>
            </h3>
            <span className="text-xs text-zinc-500">Threshold: ≤ 3 Units</span>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-xs">
                  <div>
                    <span className="font-bold text-white block mb-0.5">{p.name}</span>
                    <span className="font-mono text-zinc-500">{p.sku}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-300 font-bold border border-red-500/30">
                    {currentOutletId === 'all' 
                      ? Object.values(p.stockByOutlet).reduce((a, b) => a + b, 0)
                      : (p.stockByOutlet[currentOutletId] || 0)} Units
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-500 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              All inventory levels are optimal across outlets.
            </div>
          )}
        </div>

        {/* Pending Waybills & Logistics */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-400" />
              <span>Pending Courier Waybills ({pendingWaybills})</span>
            </h3>
            <span className="text-xs text-zinc-500">Trans Express Integration</span>
          </div>
          {pendingWaybills > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {filteredOrders.filter(o => o.source === 'Website' && o.status !== 'Delivered').map(ord => (
                <div key={ord.id} className="flex items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-xs">
                  <div>
                    <span className="font-mono font-bold text-purple-400 block mb-0.5">{ord.orderNumber}</span>
                    <span className="text-zinc-300">{ord.customerName} ({ord.customerPhone})</span>
                  </div>
                  <span className="font-mono bg-purple-500/10 text-purple-300 px-2.5 py-1 rounded border border-purple-500/20">
                    {ord.waybillNumber}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-500 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              No pending waybills require attention.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
