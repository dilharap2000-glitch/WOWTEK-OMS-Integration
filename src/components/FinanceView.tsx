/**
 * WOWTEK OMS — Finance & Profit / Loss Statement Module
 * Business: WOWTEK (wowtek.lk)
 */

import React from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  CreditCard,
  Building,
  Percent,
  Download,
  CheckCircle,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { useOMS } from '../context/OMSContext';

export const FinanceView: React.FC = () => {
  const { orders, businessSettings, dateFilter, setDateFilter } = useOMS();

  const formatLKR = (amount: number) => {
    return `${businessSettings.currencySymbol} ${amount.toLocaleString('en-LK')}`;
  };

  // Aggregate financials across current orders
  const grossSales = orders.reduce((sum, o) => sum + (o.profit?.revenue || o.subtotal), 0);
  const totalDiscounts = orders.reduce((sum, o) => sum + (o.profit?.discount || o.discount), 0);
  const netRevenue = orders.reduce((sum, o) => sum + (o.profit?.netRevenue || o.totalAmount), 0);
  const totalCOGS = orders.reduce((sum, o) => sum + (o.profit?.productCost || 0), 0);
  const grossProfit = orders.reduce((sum, o) => sum + (o.profit?.grossProfit || 0), 0);

  const totalCommissions = orders.reduce((sum, o) => sum + (o.profit?.platformCommission || 0), 0);
  const totalPaymentFees = orders.reduce((sum, o) => sum + (o.profit?.paymentFee || 0), 0);
  const totalCourierCosts = orders.reduce((sum, o) => sum + (o.profit?.courierFee || 0), 0);
  const totalOtherCosts = orders.reduce((sum, o) => sum + (o.profit?.otherCosts || 0), 0);

  const netProfit = orders.reduce((sum, o) => sum + (o.profit?.netProfit || 0), 0);
  const netMarginPercent = netRevenue > 0 ? Math.round((netProfit / netRevenue) * 1000) / 10 : 0;

  // Breakdown by channel for visual chart
  const channelFinancials = ['WEBSITE', 'PICKME', 'UBER_EATS', 'MANUAL'].map((channel) => {
    const chOrders = orders.filter((o) => o.source === channel);
    const revenue = chOrders.reduce((sum, o) => sum + (o.profit?.netRevenue || o.totalAmount), 0);
    const cogs = chOrders.reduce((sum, o) => sum + (o.profit?.productCost || 0), 0);
    const profit = chOrders.reduce((sum, o) => sum + (o.profit?.netProfit || 0), 0);
    const commission = chOrders.reduce((sum, o) => sum + (o.profit?.platformCommission || 0), 0);

    return {
      channel: channel === 'WEBSITE' ? 'wowtek.lk' : channel === 'MANUAL' ? 'Store POS' : channel,
      Revenue: revenue,
      COGS: cogs,
      Commission: commission,
      NetProfit: profit,
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Profit & Loss Financial Statement
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              REAL-TIME AUDITED
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Detailed income statement after platform fees (PickMe, Uber), payment gateways (Mintpay, Koko), and courier
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export P&L Report</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-xs text-neutral-400 uppercase font-medium">Net Sales Revenue</span>
          <div className="text-xl sm:text-2xl font-black text-white font-mono mt-1">
            {formatLKR(netRevenue)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Gross sales less discounts</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-xs text-neutral-400 uppercase font-medium">Cost of Goods (COGS)</span>
          <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono mt-1">
            {formatLKR(totalCOGS)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Inventory purchase expense</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
          <span className="text-xs text-neutral-400 uppercase font-medium">Operating Deductions</span>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1">
            {formatLKR(totalCommissions + totalPaymentFees + totalCourierCosts + totalOtherCosts)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">Commissions, gateway & courier</div>
        </div>

        <div className="p-4 rounded-xl bg-neutral-900 border border-emerald-500/40 bg-emerald-950/10">
          <span className="text-xs text-emerald-400 uppercase font-bold">Net Profit</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
            {formatLKR(netProfit)}
          </div>
          <div className="text-[11px] text-emerald-300/80 mt-1 font-semibold">
            {netMarginPercent}% Net Margin
          </div>
        </div>
      </div>

      {/* Financial Comparison Chart */}
      <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Revenue vs Cost vs Profit by Channel
            </h2>
            <p className="text-xs text-neutral-400">
              Visual ledger across wowtek.lk, PickMe, Uber Eats, and Colombo Store
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channelFinancials} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="channel" stroke="#737373" fontSize={11} />
              <YAxis stroke="#737373" fontSize={10} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  borderColor: '#262626',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#fff',
                }}
                formatter={(v: any) => [`Rs. ${Number(v).toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="Revenue" fill="#06b6d4" name="Net Sales" radius={[4, 4, 0, 0]} />
              <Bar dataKey="COGS" fill="#f43f5e" name="Product Cost" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Commission" fill="#f59e0b" name="Commissions" radius={[4, 4, 0, 0]} />
              <Bar dataKey="NetProfit" fill="#10b981" name="Net Profit" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Structured Income Statement Table */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h2 className="text-base font-bold text-white">Consolidated Income Statement</h2>
          <span className="font-mono text-xs text-cyan-400">{businessSettings.legalName}</span>
        </div>

        <div className="space-y-2 text-xs divide-y divide-neutral-800/80">
          {/* Revenue */}
          <div className="flex justify-between py-2 font-medium">
            <span className="text-neutral-300">Gross Merchandise Value (GMV)</span>
            <span className="font-mono text-neutral-100">{formatLKR(grossSales)}</span>
          </div>

          <div className="flex justify-between py-2 text-neutral-400">
            <span className="pl-4">Less: Promotional Discounts</span>
            <span className="font-mono text-rose-400">- {formatLKR(totalDiscounts)}</span>
          </div>

          <div className="flex justify-between py-2 font-bold bg-neutral-950/60 px-3 rounded-lg">
            <span className="text-white">Net Sales Revenue</span>
            <span className="font-mono text-cyan-400">{formatLKR(netRevenue)}</span>
          </div>

          {/* Cost of Goods Sold */}
          <div className="flex justify-between py-2 text-neutral-400">
            <span className="pl-4">Less: Cost of Goods Sold (Supplier Inventory COGS)</span>
            <span className="font-mono text-rose-400">- {formatLKR(totalCOGS)}</span>
          </div>

          <div className="flex justify-between py-2 font-bold bg-neutral-950/60 px-3 rounded-lg">
            <span className="text-white">Gross Trading Profit</span>
            <span className="font-mono text-emerald-400">{formatLKR(grossProfit)}</span>
          </div>

          {/* Operating & Channel Fees */}
          <div className="py-2">
            <div className="text-neutral-300 font-semibold mb-1">Channel & Operating Expenses:</div>
            <div className="space-y-1.5 pl-4 text-neutral-400">
              <div className="flex justify-between">
                <span>Platform Commissions (PickMe 20% / Uber Eats 22%)</span>
                <span className="font-mono text-amber-400">- {formatLKR(totalCommissions)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Processing Fees (Mintpay 12%, Koko 10%, Card 2.8%)</span>
                <span className="font-mono text-amber-400">- {formatLKR(totalPaymentFees)}</span>
              </div>
              <div className="flex justify-between">
                <span>Trans Express Courier Shipping Fees</span>
                <span className="font-mono text-amber-400">- {formatLKR(totalCourierCosts)}</span>
              </div>
              <div className="flex justify-between">
                <span>Protective Packaging & Transit Materials</span>
                <span className="font-mono text-amber-400">- {formatLKR(totalOtherCosts)}</span>
              </div>
            </div>
          </div>

          {/* Final Net Profit */}
          <div className="flex justify-between py-3 font-black text-sm bg-neutral-950 px-4 rounded-xl border border-emerald-500/30">
            <span className="text-emerald-300">NET OPERATING PROFIT</span>
            <div className="text-right font-mono">
              <div className="text-emerald-400">{formatLKR(netProfit)}</div>
              <div className="text-[10px] text-neutral-400 font-normal">
                {netMarginPercent}% of Net Sales
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
