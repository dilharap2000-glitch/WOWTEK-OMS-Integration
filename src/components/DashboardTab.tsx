import React, { useState } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  DollarSign, 
  Truck, 
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Order, ProductItem, Expense, Outlet } from '../types';
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
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'year' | 'total'>('month');

  // Filter orders by outlet, brand, and period
  const filteredOrders = orders.filter(o => {
    const matchesOutlet = currentOutletId === 'all' || o.outletId === currentOutletId;
    
    const matchesBrand = selectedBrand === 'all' || o.items.some(i => {
      const prod = products.find(p => p.id === i.productId);
      return (prod?.category.toLowerCase().includes(selectedBrand.toLowerCase()) || 
              i.productName.toLowerCase().includes(selectedBrand.toLowerCase()));
    });

    const orderDate = new Date(o.createdAt);
    const now = new Date();
    let matchesPeriod = true;
    if (selectedPeriod === 'month') {
      matchesPeriod = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    } else if (selectedPeriod === 'year') {
      matchesPeriod = orderDate.getFullYear() === now.getFullYear();
    }

    return matchesOutlet && matchesBrand && matchesPeriod;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesOutlet = currentOutletId === 'all' || e.outletId === currentOutletId;
    return matchesOutlet;
  });

  // Financial Metrics (The 6 Cards)
  const totalSales = filteredOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  
  // Collected: Orders with status 'Delivered' or non-COD paid orders
  const collected = filteredOrders
    .filter(o => o.status === 'Delivered' || (o.paymentMethod !== 'Cash/COD' && o.status !== 'Cancelled'))
    .reduce((acc, o) => acc + o.totalAmount, 0);

  // Outstanding: Pending COD orders or in-transit shipments
  const outstanding = Math.max(0, totalSales - collected);

  // Gross Profit: Total selling price minus product costs
  const grossProfit = filteredOrders.reduce((acc, o) => {
    return acc + (o.netProfit + o.commissionFee + (o.source === 'Website' ? o.deliveryFee : 0));
  }, 0);

  // Total Expenses
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Net Profit: Gross Profit minus Payment Commission (12%) minus Shipping minus Expenses
  const netProfit = Math.max(0, filteredOrders.reduce((acc, o) => acc + o.netProfit, 0) - totalExpenses);

  // Order Status Breakdown Calculations
  const totalOrdersCount = filteredOrders.length || 1;
  const paidCount = filteredOrders.filter(o => o.status === 'Delivered' || o.paymentMethod !== 'Cash/COD').length;
  const partialCount = filteredOrders.filter(o => o.status === 'Processing' || o.status === 'Shipped').length;
  const unpaidCount = filteredOrders.filter(o => o.status === 'Pending').length;
  const returnedCount = filteredOrders.filter(o => o.status === 'Cancelled' || o.status === 'Refunded').length;

  const paidPct = Math.round((paidCount / totalOrdersCount) * 100);
  const partialPct = Math.round((partialCount / totalOrdersCount) * 100);
  const unpaidPct = Math.round((unpaidCount / totalOrdersCount) * 100);
  const returnedPct = Math.round((returnedCount / totalOrdersCount) * 100);

  // Trend data for Sales & Profit SVG Chart (Simulated 7 intervals or days/months)
  const trendLabels = ['Day 1', 'Day 5', 'Day 10', 'Day 15', 'Day 20', 'Day 25', 'Today'];
  const salesTrend = [
    totalSales * 0.15,
    totalSales * 0.28,
    totalSales * 0.42,
    totalSales * 0.55,
    totalSales * 0.70,
    totalSales * 0.88,
    totalSales || 150000,
  ];
  const profitTrend = [
    netProfit * 0.12,
    netProfit * 0.25,
    netProfit * 0.38,
    netProfit * 0.50,
    netProfit * 0.65,
    netProfit * 0.82,
    netProfit || 45000,
  ];

  const maxVal = Math.max(...salesTrend, 1000);
  const svgWidth = 600;
  const svgHeight = 200;

  const getPoints = (data: number[]) => {
    return data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * (svgWidth - 60) + 30;
      const y = svgHeight - 30 - (val / maxVal) * (svgHeight - 60);
      return `${x},${y}`;
    }).join(' ');
  };

  const salesPath = getPoints(salesTrend);
  const profitPath = getPoints(profitTrend);

  return (
    <div className="p-8 space-y-8">
      {/* Top Banner & Control Filters */}
      <div className="bg-gradient-to-r from-purple-950/40 via-zinc-900 to-zinc-950 border border-purple-500/20 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Sales Analytics & Business Intelligence</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                WOWTEK PRO
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Real-time revenue, gross margins, payment fees (12%), and net profit performance.</p>
          </div>

          {/* Filter Dropdowns (Brand Filter & Period Filter) */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              <select
                value={selectedBrand}
                onChange={e => setSelectedBrand(e.target.value)}
                className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-zinc-900">All Brands</option>
                <option value="WOWTEK" className="bg-zinc-900">WOWTEK Originals</option>
                <option value="Apple" className="bg-zinc-900">Apple Accessories</option>
                <option value="Samsung" className="bg-zinc-900">Samsung</option>
                <option value="Anker" className="bg-zinc-900">Anker</option>
                <option value="Baseus" className="bg-zinc-900">Baseus</option>
                <option value="Xiaomi" className="bg-zinc-900">Xiaomi</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <select
                value={selectedPeriod}
                onChange={e => setSelectedPeriod(e.target.value as any)}
                className="bg-transparent border-none text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="month" className="bg-zinc-900">This Month</option>
                <option value="year" className="bg-zinc-900">This Year</option>
                <option value="total" className="bg-zinc-900">Total Lifetime</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* The 6 Financial Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Sales */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Sales</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white">{formatCurrency(totalSales)}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">{filteredOrders.length} Orders logged</span>
        </div>

        {/* 2. Collected */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-400">{formatCurrency(collected)}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Delivered / Settled payments</span>
        </div>

        {/* 3. Outstanding */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Outstanding</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-amber-400">{formatCurrency(outstanding)}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">In-transit COD receivables</span>
        </div>

        {/* 4. Gross Profit */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Gross Profit</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-indigo-300">{formatCurrency(grossProfit)}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Revenue minus product cost</span>
        </div>

        {/* 5. Expenses */}
        <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-red-400">{formatCurrency(totalExpenses)}</div>
          <span className="text-[10px] text-zinc-500 mt-1 block">Rent, utility, operational overhead</span>
        </div>

        {/* 6. Net Profit */}
        <div className="bg-zinc-950 border border-purple-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden group bg-gradient-to-b from-purple-950/20 to-zinc-950">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Net Profit</span>
            <div className="w-8 h-8 rounded-lg bg-purple-600 border border-purple-400 flex items-center justify-center text-white shadow-md shadow-purple-600/50">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-purple-300">{formatCurrency(netProfit)}</div>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">Realized bottom line profit</span>
        </div>
      </div>

      {/* Main Analytics Grid: Line Chart + Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive SVG Chart: Sales & Profit Trend */}
        <div className="lg:col-span-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Sales & Profit Trend
              </h3>
              <p className="text-xs text-zinc-400">Performance trajectory comparison across the selected timeframe</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                <span className="text-zinc-300 font-medium">Sales Revenue</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                <span className="text-zinc-300 font-medium">Net Profit</span>
              </div>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full overflow-hidden pt-4">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 overflow-visible">
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[40, 80, 120, 160].map(y => (
                <line
                  key={y}
                  x1="30"
                  y1={y}
                  x2={svgWidth - 30}
                  y2={y}
                  stroke="#27272a"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
              ))}

              {/* Sales Polyline */}
              <polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={salesPath}
              />

              {/* Profit Polyline */}
              <polyline
                fill="none"
                stroke="#34d399"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={profitPath}
              />

              {/* Point Markers */}
              {salesTrend.map((val, idx) => {
                const x = (idx / (salesTrend.length - 1)) * (svgWidth - 60) + 30;
                const y = svgHeight - 30 - (val / maxVal) * (svgHeight - 60);
                return (
                  <circle
                    key={`sales-pt-${idx}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#a855f7"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                );
              })}

              {profitTrend.map((val, idx) => {
                const x = (idx / (profitTrend.length - 1)) * (svgWidth - 60) + 30;
                const y = svgHeight - 30 - (val / maxVal) * (svgHeight - 60);
                return (
                  <circle
                    key={`profit-pt-${idx}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#34d399"
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                );
              })}
            </svg>

            {/* X-axis labels */}
            <div className="flex justify-between px-6 pt-2 text-[10px] text-zinc-500 font-mono">
              {trendLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-400" />
                Order Status Breakdown
              </h3>
              <span className="text-xs text-zinc-500">{filteredOrders.length} Total</span>
            </div>
            <p className="text-xs text-zinc-400">Fulfillment ratio and settlement status distribution</p>
          </div>

          <div className="space-y-4">
            {/* Paid */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Paid & Completed
                </span>
                <span className="text-emerald-400 font-mono">{paidPct}% ({paidCount})</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${paidPct}%` }}
                ></div>
              </div>
            </div>

            {/* Partial / Processing */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Processing & Shipped
                </span>
                <span className="text-indigo-400 font-mono">{partialPct}% ({partialCount})</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${partialPct}%` }}
                ></div>
              </div>
            </div>

            {/* Unpaid / Pending */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Unpaid (Pending COD)
                </span>
                <span className="text-amber-400 font-mono">{unpaidPct}% ({unpaidCount})</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${unpaidPct}%` }}
                ></div>
              </div>
            </div>

            {/* Returned / Cancelled */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Returned / Cancelled
                </span>
                <span className="text-red-400 font-mono">{returnedPct}% ({returnedCount})</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all duration-500"
                  style={{ width: `${returnedPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Overall Collection Efficiency:</span>
            <span className="font-bold text-white font-mono">{totalSales > 0 ? Math.round((collected / totalSales) * 100) : 100}%</span>
          </div>
        </div>

      </div>
    </div>
  );
};
