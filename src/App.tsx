/**
 * WOWTEK ORDER MANAGEMENT SYSTEM (WOWTEK OMS)
 * Business: WOWTEK — Sri Lanka (wowtek.lk)
 * Tech Stack: React, TypeScript, Tailwind CSS, Vite / Next-compatible Express API
 */

import React, { useState } from 'react';
import { OMSProvider, useOMS } from './context/OMSContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { OrdersView } from './components/OrdersView';
import { ProductsView } from './components/ProductsView';
import { WaybillsView } from './components/WaybillsView';
import { InvoicesView } from './components/InvoicesView';
import { FinanceView } from './components/FinanceView';
import { CustomersView } from './components/CustomersView';
import { SuppliersView } from './components/SuppliersView';
import { IntegrationsView } from './components/IntegrationsView';
import { SettingsView } from './components/SettingsView';
import { NewOrderModal } from './components/NewOrderModal';
import { PrintModals } from './components/PrintModals';
import { AuthScreen } from './components/AuthScreen';
import { WarrantyView } from './components/WarrantyView';
import { SuperAdminView } from './components/SuperAdminView';

const MainLayout: React.FC = () => {
  const { currentView, currentUser } = useOMS();
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  if (!isAuthenticated) {
    return <AuthScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Sidebar navigation */}
      <Sidebar onLogout={() => setIsAuthenticated(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header onLogout={() => setIsAuthenticated(false)} />

        {/* Dynamic View Scrollable Container */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {currentView === 'DASHBOARD' && <DashboardView />}
            {currentView === 'ORDERS' && <OrdersView />}
            {currentView === 'PRODUCTS' && <ProductsView />}
            {currentView === 'WAYBILLS' && <WaybillsView />}
            {currentView === 'INVOICES' && <InvoicesView />}
            {currentView === 'FINANCE' && <FinanceView />}
            {currentView === 'CUSTOMERS' && <CustomersView />}
            {currentView === 'SUPPLIERS' && <SuppliersView />}
            {currentView === 'INTEGRATIONS' && <IntegrationsView />}
            {currentView === 'SETTINGS' && <SettingsView />}
            {currentView === 'WARRANTY' && <WarrantyView />}
            {currentView === 'SUPER_ADMIN' && <SuperAdminView />}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <NewOrderModal />
      <PrintModals />
    </div>
  );
};

export default function App() {
  return (
    <OMSProvider>
      <MainLayout />
    </OMSProvider>
  );
}
