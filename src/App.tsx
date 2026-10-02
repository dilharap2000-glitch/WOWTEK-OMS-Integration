import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardTab } from './components/DashboardTab';
import { LiveOrdersTab } from './components/LiveOrdersTab';
import { InvoicesTab } from './components/InvoicesTab';
import { ProductsTab } from './components/ProductsTab';
import { BarcodeManagerTab } from './components/BarcodeManagerTab';
import { TransfersTab } from './components/TransfersTab';
import { SuppliersWarrantyTab } from './components/SuppliersWarrantyTab';
import { ExpensesTab } from './components/ExpensesTab';
import { IntegrationsTab } from './components/IntegrationsTab';
import { SmsGatewayTab } from './components/SmsGatewayTab';
import { AuditTab } from './components/AuditTab';

import { SimulateOrderModal } from './components/SimulateOrderModal';
import { WaybillModal } from './components/WaybillModal';
import { InvoiceModal } from './components/InvoiceModal';
import { GRNModal } from './components/GRNModal';
import { ProductModal } from './components/ProductModal';
import { SupplierModal } from './components/SupplierModal';
import { WarrantyModal } from './components/WarrantyModal';
import { ExpenseModal } from './components/ExpenseModal';
import { TransferModal } from './components/TransferModal';

import { 
  TabType, 
  ProductItem, 
  BarcodeLabel, 
  Order, 
  Invoice,
  Supplier, 
  GRNEntry, 
  WarrantyClaim, 
  WarrantyRecord,
  Expense, 
  SMSConfig, 
  IntegrationConfig,
  Outlet,
  StockTransfer,
  AuditLog,
  OrderStatus, 
  WarrantyStatus 
} from './types';
import { loadStorage, saveStorage, initialSMSConfig } from './utils/storage';

const defaultOutlets: Outlet[] = [
  { id: 'outlet-1', name: 'WOWTEK Battaramulla', code: 'BAT', address: 'No 45, Main Street, Battaramulla' },
  { id: 'outlet-2', name: 'WOWTEK Pannipitiya', code: 'PAN', address: '128, High Level Road, Pannipitiya' },
  { id: 'outlet-3', name: 'iMobile Kaduwela', code: 'KAD', address: '89, Avissawella Road, Kaduwela' },
];

const defaultIntegrations: IntegrationConfig = {
  woocommerce: {
    storeUrl: 'https://wowtek.lk',
    consumerKey: 'ck_live_xxx',
    consumerSecret: 'cs_live_xxx',
    webhookSecret: 'whsec_wowtek_secure_99',
    connected: true,
    webhookRegistered: true,
  },
  pickme: {
    merchantId: 'PM-88210',
    apiKey: 'pm_api_xxx',
    accessToken: 'token_xxx',
    endpoint: 'https://api.pickme.lk/merchant/v1',
    connected: false,
  },
  uber: {
    storeId: 'UBER-COL-99',
    clientId: 'uber_client_xxx',
    clientSecret: 'uber_secret_xxx',
    authToken: 'token_uber_xxx',
    endpoint: 'https://api.uber.com/v1/eats',
    connected: false,
  },
  transExpress: {
    apiUrl: 'https://api.transexpress.lk/v1',
    accountNumber: 'TE-WOWTEK-01',
    apiKey: 'te_key_live_8832',
    pickupLocation: 'Battaramulla Hub',
    autoBookWaybill: true,
    connected: true,
  },
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [currentOutletId, setCurrentOutletId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Persistent States
  const [outlets] = useState<Outlet[]>(() => loadStorage('wowtek_outlets', defaultOutlets));
  const [products, setProducts] = useState<ProductItem[]>(() => loadStorage('wowtek_products', []));
  const [barcodes, setBarcodes] = useState<BarcodeLabel[]>(() => loadStorage('wowtek_barcodes', []));
  const [orders, setOrders] = useState<Order[]>(() => loadStorage('wowtek_orders', []));
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadStorage('wowtek_invoices', []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadStorage('wowtek_suppliers', []));
  const [grns, setGrns] = useState<GRNEntry[]>(() => loadStorage('wowtek_grns', []));
  const [transfers, setTransfers] = useState<StockTransfer[]>(() => loadStorage('wowtek_transfers', []));
  const [warranties, setWarranties] = useState<WarrantyRecord[]>(() => loadStorage('wowtek_warranties', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => loadStorage('wowtek_expenses', []));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadStorage('wowtek_audit', []));
  const [smsConfig, setSmsConfig] = useState<SMSConfig>(() => loadStorage('wowtek_sms_config', initialSMSConfig));
  const [integrations, setIntegrations] = useState<IntegrationConfig>(() => loadStorage('wowtek_integrations', defaultIntegrations));

  // Sync to localStorage
  useEffect(() => { saveStorage('wowtek_products', products); }, [products]);
  useEffect(() => { saveStorage('wowtek_barcodes', barcodes); }, [barcodes]);
  useEffect(() => { saveStorage('wowtek_orders', orders); }, [orders]);
  useEffect(() => { saveStorage('wowtek_invoices', invoices); }, [invoices]);
  useEffect(() => { saveStorage('wowtek_suppliers', suppliers); }, [suppliers]);
  useEffect(() => { saveStorage('wowtek_grns', grns); }, [grns]);
  useEffect(() => { saveStorage('wowtek_transfers', transfers); }, [transfers]);
  useEffect(() => { saveStorage('wowtek_warranties', warranties); }, [warranties]);
  useEffect(() => { saveStorage('wowtek_expenses', expenses); }, [expenses]);
  useEffect(() => { saveStorage('wowtek_audit', auditLogs); }, [auditLogs]);
  useEffect(() => { saveStorage('wowtek_sms_config', smsConfig); }, [smsConfig]);
  useEffect(() => { saveStorage('wowtek_integrations', integrations); }, [integrations]);

  const logAudit = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Math.random().toString(36).substring(2, 9)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      user: 'Dilhara Perera (Admin)',
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Modals state
  const [isSimulateOrderOpen, setIsSimulateOrderOpen] = useState(false);
  const [isWaybillOpen, setIsWaybillOpen] = useState(false);
  const [selectedOrderForWaybill, setSelectedOrderForWaybill] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isGRNOpen, setIsGRNOpen] = useState(false);
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [isWarrantyOpen, setIsWarrantyOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Handlers
  const handleSaveOrder = (newOrder: Order) => {
    const updatedProducts = products.map(prod => {
      const orderedItem = newOrder.items.find(i => i.productId === prod.id);
      if (orderedItem) {
        const currentStock = prod.stockByOutlet[newOrder.outletId] || 0;
        return {
          ...prod,
          stockByOutlet: {
            ...prod.stockByOutlet,
            [newOrder.outletId]: Math.max(0, currentStock - orderedItem.quantity)
          }
        };
      }
      return prod;
    });

    const newInvoice: Invoice = {
      id: `inv-${Math.random().toString(36).substring(2, 9)}`,
      invoiceNumber: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
      orderId: newOrder.id,
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      customerAddress: newOrder.customerAddress,
      items: newOrder.items.map(i => ({ productName: i.productName, sku: i.sku, quantity: i.quantity, price: i.price })),
      subtotal: newOrder.totalAmount - newOrder.deliveryFee - newOrder.paymentFee,
      discount: newOrder.discount,
      paymentMethod: newOrder.paymentMethod,
      paymentFee: newOrder.paymentFee,
      totalAmount: newOrder.totalAmount,
      outletId: newOrder.outletId,
      status: 'Paid',
      createdAt: new Date().toISOString(),
    };

    // Auto create warranty records
    const newWarranties: WarrantyRecord[] = newOrder.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const months = prod ? prod.warrantyPeriodMonths || 6 : 6;
      const start = new Date();
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + months);

      return {
        id: `wrn-${Math.random().toString(36).substring(2, 9)}`,
        warrantyNumber: `WRN-${Math.floor(100000 + Math.random() * 900000)}`,
        orderId: newOrder.id,
        invoiceNumber: newInvoice.invoiceNumber,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        productName: item.productName,
        sku: item.sku,
        serialNumber: `WT-SER-${Math.floor(100000 + Math.random() * 900000)}-1`,
        barcode: `899${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        purchaseDate: start.toISOString(),
        startDate: start.toISOString(),
        expiryDate: expiry.toISOString(),
        status: 'Active',
        reminderSent: false,
        createdAt: new Date().toISOString(),
      };
    });

    setProducts(updatedProducts);
    setOrders([newOrder, ...orders]);
    setInvoices([newInvoice, ...invoices]);
    setWarranties([...newWarranties, ...warranties]);
    logAudit('ORDER_PROCESSED', `Order ${newOrder.orderNumber} created with auto-invoice and warranty records`);
  };

  const handleSaveInvoice = (invoice: Invoice) => {
    setInvoices([invoice, ...invoices]);
    logAudit('INVOICE_CREATED', `Created manual invoice ${invoice.invoiceNumber}`);
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Delete this invoice?')) {
      setInvoices(invoices.filter(i => i.id !== id));
      logAudit('INVOICE_DELETED', `Deleted invoice ID ${id}`);
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const targetOrder = orders.find(o => o.id === orderId);
    if (targetOrder && (status === 'Cancelled' || status === 'Refunded') && targetOrder.status !== 'Cancelled' && targetOrder.status !== 'Refunded') {
      const restoredProducts = products.map(prod => {
        const orderItem = targetOrder.items.find(i => i.productId === prod.id);
        if (orderItem) {
          const currentStock = prod.stockByOutlet[targetOrder.outletId] || 0;
          return {
            ...prod,
            stockByOutlet: {
              ...prod.stockByOutlet,
              [targetOrder.outletId]: currentStock + orderItem.quantity
            }
          };
        }
        return prod;
      });
      setProducts(restoredProducts);
    }

    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
    logAudit('ORDER_STATUS_UPDATE', `Order ${targetOrder?.orderNumber} status updated to ${status}`);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      const target = orders.find(o => o.id === orderId);
      setOrders(orders.filter(o => o.id !== orderId));
      logAudit('ORDER_DELETED', `Deleted order ${target?.orderNumber}`);
    }
  };

  const handleBulkDeleteOrders = (orderIds: string[]) => {
    setOrders(orders.filter(o => !orderIds.includes(o.id)));
    logAudit('BULK_ORDERS_DELETED', `Deleted ${orderIds.length} orders`);
  };

  const handleSaveProduct = (product: ProductItem) => {
    setProducts([product, ...products]);
    logAudit('PRODUCT_CREATED', `Created product ${product.name} (${product.sku})`);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Permanently delete this product?')) {
      const prod = products.find(p => p.id === id);
      setProducts(products.filter(p => p.id !== id));
      logAudit('PRODUCT_DELETED', `Deleted product ${prod?.name}`);
    }
  };

  const handleSaveGRN = (grn: GRNEntry, newBarcodes: BarcodeLabel[], updatedProds: ProductItem[]) => {
    setGrns([grn, ...grns]);
    setBarcodes([...newBarcodes, ...barcodes]);
    
    const updatedMap = new Map(updatedProds.map(p => [p.id, p]));
    setProducts(products.map(p => updatedMap.get(p.id) || p));
    logAudit('GRN_CREATED', `Received GRN batch ${grn.batchNumber}`);
  };

  const handleSaveTransfer = (transfer: StockTransfer) => {
    setTransfers([transfer, ...transfers]);
    logAudit('TRANSFER_INITIATED', `Stock transfer ${transfer.transferNumber} initiated`);
  };

  const handleUpdateTransferStatus = (id: string, status: StockTransfer['status']) => {
    const trf = transfers.find(t => t.id === id);
    if (trf && status === 'Received' && trf.status !== 'Received') {
      const updatedProds = products.map(prod => {
        if (prod.id === trf.productId) {
          const srcStock = prod.stockByOutlet[trf.sourceOutletId] || 0;
          const tgtStock = prod.stockByOutlet[trf.targetOutletId] || 0;
          return {
            ...prod,
            stockByOutlet: {
              ...prod.stockByOutlet,
              [trf.sourceOutletId]: Math.max(0, srcStock - trf.quantity),
              [trf.targetOutletId]: tgtStock + trf.quantity,
            }
          };
        }
        return prod;
      });
      setProducts(updatedProds);
    }

    setTransfers(transfers.map(t => t.id === id ? { ...t, status } : t));
    logAudit('TRANSFER_STATUS_UPDATE', `Transfer ${trf?.transferNumber} status updated to ${status}`);
  };

  const handleToggleBarcodePrinted = (id: string) => {
    setBarcodes(barcodes.map(b => b.id === id ? { ...b, isPrinted: !b.isPrinted } : b));
  };

  const handleBulkMarkBarcodesPrinted = (ids: string[]) => {
    setBarcodes(barcodes.map(b => ids.includes(b.id) ? { ...b, isPrinted: true } : b));
    logAudit('BARCODES_PRINTED', `Marked ${ids.length} barcode labels as printed`);
  };

  const handleSaveSupplier = (supplier: Supplier) => {
    setSuppliers([supplier, ...suppliers]);
    logAudit('SUPPLIER_CREATED', `Registered supplier ${supplier.name}`);
  };

  const handleDeleteSupplier = (id: string) => {
    if (confirm('Delete this supplier?')) {
      setSuppliers(suppliers.filter(s => s.id !== id));
      logAudit('SUPPLIER_DELETED', `Deleted supplier ID ${id}`);
    }
  };

  const handleSaveWarrantyRecord = (record: WarrantyRecord) => {
    setWarranties([record, ...warranties]);
    logAudit('WARRANTY_LOGGED', `Logged manual warranty record ${record.warrantyNumber}`);
  };

  const handleUpdateWarrantyStatus = (id: string, status: WarrantyStatus) => {
    setWarranties(warranties.map(w => w.id === id ? { ...w, status } : w));
    logAudit('WARRANTY_STATUS_UPDATE', `Warranty record ID ${id} status updated to ${status}`);
  };

  const handleSaveExpense = (expense: Expense) => {
    setExpenses([expense, ...expenses]);
    logAudit('EXPENSE_LOGGED', `Logged expense ${expense.title} for ${expense.amount} LKR`);
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Delete this expense?')) {
      setExpenses(expenses.filter(e => e.id !== id));
      logAudit('EXPENSE_DELETED', `Deleted expense ID ${id}`);
    }
  };

  const unprintedBarcodeCount = barcodes.filter(b => !b.isPrinted).length;
  const pendingWarrantyCount = warranties.filter(w => w.status === 'Sent for Warranty' || w.status === 'Expiring Soon').length;
  const pendingTransferCount = transfers.filter(t => t.status === 'Pending').length;

  return (
    <div className="flex h-screen bg-black text-zinc-100 font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        orderCount={orders.length}
        invoiceCount={invoices.length}
        unprintedBarcodeCount={unprintedBarcodeCount}
        pendingWarrantyCount={pendingWarrantyCount}
        pendingTransferCount={pendingTransferCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Navbar
          currentTab={currentTab}
          outlets={outlets}
          currentOutletId={currentOutletId}
          onSelectOutlet={setCurrentOutletId}
          onOpenSimulateOrder={() => setIsSimulateOrderOpen(true)}
          onOpenAddProduct={() => setIsProductOpen(true)}
          onOpenAddExpense={() => setIsExpenseOpen(true)}
          onOpenAddSupplier={() => setIsSupplierOpen(true)}
          onOpenAddGRN={() => setIsGRNOpen(true)}
          onOpenAddTransfer={() => setIsTransferOpen(true)}
          onOpenAddInvoice={() => setIsInvoiceOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <main className="flex-1 pb-16">
          {currentTab === 'dashboard' && (
            <DashboardTab
              orders={orders}
              products={products}
              expenses={expenses}
              outlets={outlets}
              currentOutletId={currentOutletId}
            />
          )}

          {currentTab === 'orders' && (
            <LiveOrdersTab
              orders={orders}
              outlets={outlets}
              currentOutletId={currentOutletId}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onDeleteOrder={handleDeleteOrder}
              onBulkDeleteOrders={handleBulkDeleteOrders}
              onViewWaybill={(order) => {
                setSelectedOrderForWaybill(order);
                setIsWaybillOpen(true);
              }}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === 'invoices' && (
            <InvoicesTab
              invoices={invoices}
              outlets={outlets}
              currentOutletId={currentOutletId}
              onDeleteInvoice={handleDeleteInvoice}
              onOpenAddInvoice={() => setIsInvoiceOpen(true)}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === 'products' && (
            <ProductsTab
              products={products}
              suppliers={suppliers}
              outlets={outlets}
              grns={grns}
              currentOutletId={currentOutletId}
              onDeleteProduct={handleDeleteProduct}
              onOpenAddProduct={() => setIsProductOpen(true)}
              onOpenAddGRN={() => setIsGRNOpen(true)}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === 'barcodes' && (
            <BarcodeManagerTab
              barcodes={barcodes}
              onTogglePrinted={handleToggleBarcodePrinted}
              onBulkMarkPrinted={handleBulkMarkBarcodesPrinted}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === 'transfers' && (
            <TransfersTab
              transfers={transfers}
              outlets={outlets}
              onUpdateTransferStatus={handleUpdateTransferStatus}
              onOpenAddTransfer={() => setIsTransferOpen(true)}
            />
          )}

          {currentTab === 'suppliers' && (
            <SuppliersWarrantyTab
              suppliers={suppliers}
              warranties={warranties}
              onDeleteSupplier={handleDeleteSupplier}
              onUpdateWarrantyStatus={handleUpdateWarrantyStatus}
              onOpenAddSupplier={() => setIsSupplierOpen(true)}
              onOpenAddWarranty={() => setIsWarrantyOpen(true)}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesTab
              expenses={expenses}
              orders={orders}
              outlets={outlets}
              currentOutletId={currentOutletId}
              onDeleteExpense={handleDeleteExpense}
              onOpenAddExpense={() => setIsExpenseOpen(true)}
              searchTerm={searchTerm}
            />
          )}

          {currentTab === 'integrations' && (
            <IntegrationsTab
              integrations={integrations}
              smsConfig={smsConfig}
              onSaveIntegrations={setIntegrations}
              onSaveSmsConfig={setSmsConfig}
              onRunTestSuite={() => alert('Running full integration test suite...')}
            />
          )}

          {currentTab === 'sms' && (
            <SmsGatewayTab
              smsConfig={smsConfig}
              onSaveSmsConfig={setSmsConfig}
            />
          )}

          {currentTab === 'audit' && (
            <AuditTab auditLogs={auditLogs} />
          )}
        </main>
      </div>

      {/* Modals */}
      <SimulateOrderModal
        isOpen={isSimulateOrderOpen}
        onClose={() => setIsSimulateOrderOpen(false)}
        products={products}
        outlets={outlets}
        currentOutletId={currentOutletId}
        onSaveOrder={handleSaveOrder}
      />

      <WaybillModal
        isOpen={isWaybillOpen}
        onClose={() => setIsWaybillOpen(false)}
        order={selectedOrderForWaybill}
      />

      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        outlets={outlets}
        products={products}
        currentOutletId={currentOutletId}
        onSaveInvoice={handleSaveInvoice}
      />

      <GRNModal
        isOpen={isGRNOpen}
        onClose={() => setIsGRNOpen(false)}
        suppliers={suppliers}
        outlets={outlets}
        products={products}
        onSaveGRN={handleSaveGRN}
      />

      <ProductModal
        isOpen={isProductOpen}
        onClose={() => setIsProductOpen(false)}
        suppliers={suppliers}
        outlets={outlets}
        onSaveProduct={handleSaveProduct}
      />

      <SupplierModal
        isOpen={isSupplierOpen}
        onClose={() => setIsSupplierOpen(false)}
        onSaveSupplier={handleSaveSupplier}
      />

      <WarrantyModal
        isOpen={isWarrantyOpen}
        onClose={() => setIsWarrantyOpen(false)}
        suppliers={suppliers}
        onSaveRecord={handleSaveWarrantyRecord}
      />

      <ExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        outlets={outlets}
        currentOutletId={currentOutletId}
        onSaveExpense={handleSaveExpense}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        outlets={outlets}
        products={products}
        onSaveTransfer={handleSaveTransfer}
      />
    </div>
  );
}
