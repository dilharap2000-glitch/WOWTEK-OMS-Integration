import React from 'react';
import { PlusCircle, Building2, Search } from 'lucide-react';
import { TabType, Outlet } from '../types';

interface NavbarProps {
  currentTab: TabType;
  outlets: Outlet[];
  currentOutletId: string;
  onSelectOutlet: (outletId: string) => void;
  onOpenSimulateOrder: () => void;
  onOpenAddProduct: () => void;
  onOpenAddExpense: () => void;
  onOpenAddSupplier: () => void;
  onOpenAddGRN: () => void;
  onOpenAddTransfer: () => void;
  onOpenAddInvoice: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  outlets,
  currentOutletId,
  onSelectOutlet,
  onOpenSimulateOrder,
  onOpenAddProduct,
  onOpenAddExpense,
  onOpenAddSupplier,
  onOpenAddGRN,
  onOpenAddTransfer,
  onOpenAddInvoice,
  searchTerm,
  setSearchTerm,
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Executive Dashboard & Telemetry';
      case 'orders': return 'Live Orders & Channel Sync';
      case 'invoices': return 'Invoices & Billing Dashboard';
      case 'products': return 'Products & Bulk Barcode GRN';
      case 'barcodes': return 'Trans Express Waybill Queue & Barcodes';
      case 'transfers': return 'Multi-Outlet Stock Transfers';
      case 'suppliers': return 'Warranty Tracker & Customer Claims';
      case 'expenses': return 'Expenses & Financial Profit Breakdown';
      case 'sms': return 'API & SMS Gateway Settings';
      case 'audit': return 'Security & Audit Logs';
    }
  };

  return (
    <header className="h-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">{getTabTitle()}</h2>
          <p className="text-xs text-zinc-400">WOWTEK Business & Order Management System</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Outlet Selector Dropdown */}
        <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
          <Building2 className="w-4 h-4 text-purple-400" />
          <select
            value={currentOutletId}
            onChange={e => onSelectOutlet(e.target.value)}
            className="bg-transparent text-xs font-semibold text-zinc-200 focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-zinc-900 text-zinc-200">🌐 All Outlets Overview</option>
            {outlets.map(o => (
              <option key={o.id} value={o.id} className="bg-zinc-900 text-zinc-200">{o.name}</option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 transition-all"
          />
        </div>

        {/* Context Action Buttons */}
        {currentTab === 'orders' && (
          <button
            onClick={onOpenSimulateOrder}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-purple-600/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Simulate Incoming Order</span>
          </button>
        )}

        {currentTab === 'invoices' && (
          <button
            onClick={onOpenAddInvoice}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-purple-600/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Manual Invoice</span>
          </button>
        )}

        {currentTab === 'products' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAddProduct}
              className="flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all"
            >
              <PlusCircle className="w-4 h-4 text-purple-400" />
              <span>Add Product</span>
            </button>
            <button
              onClick={onOpenAddGRN}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-purple-600/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create GRN (Stock)</span>
            </button>
          </div>
        )}

        {currentTab === 'transfers' && (
          <button
            onClick={onOpenAddTransfer}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-purple-600/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Transfer</span>
          </button>
        )}

        {currentTab === 'suppliers' && (
          <button
            onClick={onOpenAddSupplier}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-purple-600/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        )}

        {currentTab === 'expenses' && (
          <button
            onClick={onOpenAddExpense}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-purple-600/25 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Expense</span>
          </button>
        )}
      </div>
    </header>
  );
};
