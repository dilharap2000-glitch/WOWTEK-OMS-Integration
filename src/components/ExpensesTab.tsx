import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Trash2, PieChart } from 'lucide-react';
import { Expense, Order, Outlet } from '../types';
import { formatCurrency } from '../utils/storage';

interface ExpensesTabProps {
  expenses: Expense[];
  orders: Order[];
  outlets: Outlet[];
  currentOutletId: string;
  onDeleteExpense: (id: string) => void;
  onOpenAddExpense: () => void;
  searchTerm: string;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  orders,
  outlets,
  currentOutletId,
  onDeleteExpense,
  onOpenAddExpense,
  searchTerm,
}) => {
  const filteredOrders = currentOutletId === 'all'
    ? orders
    : orders.filter(o => o.outletId === currentOutletId);

  const filteredExpenses = expenses.filter(e => {
    const matchesOutlet = currentOutletId === 'all' || e.outletId === currentOutletId;
    const matchesSearch = 
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesOutlet && matchesSearch;
  });

  const totalGrossSalesProfit = filteredOrders.reduce((acc, o) => acc + o.netProfit, 0);
  const totalCommissions = filteredOrders.reduce((acc, o) => acc + o.commissionFee, 0);
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const calculatedNetProfit = totalGrossSalesProfit - totalExpenses;

  const getOutletName = (id: string) => outlets.find(o => o.id === id)?.name || 'Outlet';

  return (
    <div className="p-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Gross Sales Profit</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatCurrency(totalGrossSalesProfit)}</div>
          <p className="text-xs text-zinc-500 mt-2">From {filteredOrders.length} filtered orders</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Commissions & Fees</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatCurrency(totalCommissions)}</div>
          <p className="text-xs text-zinc-500 mt-2">PickMe/Uber & Gateway deductions</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Expenses</span>
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-zinc-500 mt-2">From {filteredExpenses.length} expense records</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">Net Profit</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PieChart className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black ${calculatedNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(calculatedNetProfit)}
          </div>
          <p className="text-xs text-zinc-400 mt-2">Gross Profit - Expenses</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Daily Expenses Log</h3>
        <button
          onClick={onOpenAddExpense}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Expense</span>
        </button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Title / Date</th>
              <th className="px-6 py-4">Outlet</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Amount (LKR)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map(exp => (
                <tr key={exp.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{exp.title}</div>
                    <div className="text-xs text-zinc-500">{exp.date}</div>
                  </td>
                  <td className="px-6 py-4 text-purple-400 font-medium text-xs">
                    {getOutletName(exp.outletId)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-purple-400 font-medium">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 text-xs">{exp.description || '-'}</td>
                  <td className="px-6 py-4 font-mono font-bold text-white">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="text-zinc-500 hover:text-red-400 p-2 rounded-lg hover:bg-zinc-900 transition-colors"
                      title="Delete Expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-16 text-zinc-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm font-medium">No expenses logged for this view</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
