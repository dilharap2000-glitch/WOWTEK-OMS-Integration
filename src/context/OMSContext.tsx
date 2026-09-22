/**
 * WOWTEK Order Management System — Central State Context
 * Business: WOWTEK Sri Lanka (wowtek.lk)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuditLog,
  BusinessSettings,
  Customer,
  DashboardMetrics,
  InventoryMovementType,
  InventoryTransaction,
  Invoice,
  NotificationEvent,
  Order,
  OrderStatus,
  PaymentMethodConfig,
  PlatformCommissionConfig,
  Product,
  SMSLog,
  Supplier,
  SystemIntegrations,
  User,
  WarrantyClaim,
  WarrantyRecord,
  Waybill,
} from '../types';
import {
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_CUSTOMERS,
  DEFAULT_INTEGRATIONS,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_PLATFORM_COMMISSIONS,
  DEFAULT_PRODUCTS,
  DEFAULT_SUPPLIERS,
  DEFAULT_USERS,
  DEFAULT_WARRANTIES,
  DEFAULT_WAYBILLS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_SMS_LOGS,
} from '../lib/mockData';
import { calculateExpiryDate, evaluateWarrantyStatus, identifyDueReminders } from '../services/warrantyService';
import { calculateItemProfit, calculateOrderProfit } from '../services/profitService';
import { smsService } from '../services/smsService';
import { processWooCommerceOrder, WooCommerceWebhookOrder } from '../services/woocommerceService';
import { TransExpressServiceAdapter } from '../services/transExpressService';
import { apiClient } from '../services/apiClient';

export type DateFilterType = 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'all';

export type ViewType =
  | 'DASHBOARD'
  | 'ORDERS'
  | 'PRODUCTS'
  | 'SUPPLIERS'
  | 'CUSTOMERS'
  | 'WAYBILLS'
  | 'INVOICES'
  | 'WARRANTY'
  | 'FINANCE'
  | 'INTEGRATIONS'
  | 'SETTINGS';

interface OMSContextType {
  // Navigation & Shell
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  isNewOrderModalOpen: boolean;
  setIsNewOrderModalOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Auth & Roles
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;

  // Business & Config
  businessSettings: BusinessSettings;
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => void;
  paymentMethods: PaymentMethodConfig[];
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => void;
  platformCommissions: PlatformCommissionConfig[];
  updatePlatformCommission: (id: string, updates: Partial<PlatformCommissionConfig>) => void;

  // Orders
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus, trackingNumber?: string, courier?: string) => void;
  createManualOrder: (orderData: Partial<Order>) => Order;
  cancelOrder: (orderId: string, reason?: string) => void;

  // Products & Inventory
  products: Product[];
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (productId: string, quantityChange: number, type: InventoryMovementType, notes?: string, unitCost?: number) => void;
  inventoryTransactions: InventoryTransaction[];

  // Customers & Suppliers
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'orderCount' | 'totalSpent' | 'createdAt'>) => Customer;
  suppliers: Supplier[];
  addSupplier: (supp: Omit<Supplier, 'id' | 'totalPurchases' | 'createdAt'>) => void;

  // Warranties
  warranties: WarrantyRecord[];
  createWarranty: (data: Omit<WarrantyRecord, 'id' | 'createdAt' | 'claims' | 'reminderHistory' | 'status' | 'expiryDate'>) => WarrantyRecord;
  addWarrantyClaim: (warrantyId: string, claimData: Omit<WarrantyClaim, 'id' | 'warrantyId' | 'handledBy'>) => void;
  runWarrantyReminderCheck: () => { sentCount: number; reminders: string[] };

  // Waybills & Invoices
  waybills: Waybill[];
  createWaybill: (orderId: string, courierName?: string, labelFormat?: 'A4' | 'THERMAL_4X6') => Waybill;
  updateWaybillStatus: (waybillId: string, status: Waybill['status']) => void;
  invoices: Invoice[];
  generateInvoice: (orderId: string) => Invoice;

  // Integrations & SMS
  integrations: SystemIntegrations;
  updateIntegration: (key: keyof SystemIntegrations, updates: any) => void;
  smsLogs: SMSLog[];
  sendSMS: (phone: string, recipientName: string, message: string, type?: SMSLog['type'], orderNumber?: string) => Promise<boolean>;
  simulateWooCommerceWebhookOrder: (customOrder?: Partial<WooCommerceWebhookOrder>) => { success: boolean; message: string };

  // Audit Logs & Notifications
  auditLogs: AuditLog[];
  notifications: NotificationEvent[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;

  // Filtering & Dashboard
  dateFilter: DateFilterType;
  setDateFilter: (filter: DateFilterType) => void;
  dashboardMetrics: DashboardMetrics;

  // Database & Sync Status
  isDbConnected: boolean;
  dbInfo: string;
  dataSource: 'MONGODB' | 'LOCAL_DEMO';
  refreshData: () => Promise<void>;

  // Print Modals Helper
  printableWaybills: Waybill[] | null;
  printableWaybillFormat: 'A4' | 'THERMAL_4X6';
  setPrintableWaybills: (waybills: Waybill[] | null, format?: 'A4' | 'THERMAL_4X6') => void;
  printableInvoice: Invoice | null;
  setPrintableInvoice: (invoice: Invoice | null) => void;
}

const OMSContext = createContext<OMSContextType | undefined>(undefined);

export const OMSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Shell State
  const [currentView, setCurrentView] = useState<ViewType>('DASHBOARD');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load from local storage or defaults
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('wowtek_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0];
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('wowtek_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('wowtek_business_settings');
    return saved ? JSON.parse(saved) : DEFAULT_BUSINESS_SETTINGS;
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(() => {
    const saved = localStorage.getItem('wowtek_payment_methods');
    return saved ? JSON.parse(saved) : DEFAULT_PAYMENT_METHODS;
  });

  const [platformCommissions, setPlatformCommissions] = useState<PlatformCommissionConfig[]>(() => {
    const saved = localStorage.getItem('wowtek_commissions');
    return saved ? JSON.parse(saved) : DEFAULT_PLATFORM_COMMISSIONS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('wowtek_products');
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  });

  const [inventoryTransactions, setInventoryTransactions] = useState<InventoryTransaction[]>(() => {
    const saved = localStorage.getItem('wowtek_inventory_tx');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'tx_init_1',
        productId: 'prod_4',
        productName: 'Baseus 65W GaN5 Pro Fast Charger (2C+1U)',
        sku: 'BAS-CHG-GAN65-BLK',
        type: 'ADJUSTMENT',
        quantityChange: -1,
        previousStock: 4,
        newStock: 3,
        unitCost: 8200,
        notes: 'Store showroom sample display',
        createdBy: 'Kavindu Senanayake (STAFF)',
        createdAt: '2026-09-21T01:00:00.000Z',
      },
    ];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('wowtek_customers');
    return saved ? JSON.parse(saved) : DEFAULT_CUSTOMERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('wowtek_suppliers');
    return saved ? JSON.parse(saved) : DEFAULT_SUPPLIERS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('wowtek_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [warranties, setWarranties] = useState<WarrantyRecord[]>(() => {
    const saved = localStorage.getItem('wowtek_warranties');
    return saved ? JSON.parse(saved) : DEFAULT_WARRANTIES;
  });

  const [waybills, setWaybills] = useState<Waybill[]>(() => {
    const saved = localStorage.getItem('wowtek_waybills');
    return saved ? JSON.parse(saved) : DEFAULT_WAYBILLS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('wowtek_invoices');
    if (saved) return JSON.parse(saved);
    // Generate initial invoice from ord_1
    return [
      {
        id: 'inv_1',
        invoiceNumber: 'INV-2026-0891',
        orderId: 'ord_1',
        orderNumber: 'WTK-2026-0891',
        issueDate: '2026-09-21T01:30:00.000Z',
        customer: {
          name: 'Roshan Samarasekera',
          phone: '+94 77 234 5678',
          email: 'roshan.sam@gmail.com',
          address: '45/2, Temple Road',
          city: 'Mount Lavinia',
        },
        items: [
          {
            productId: 'prod_1',
            name: 'Anker 737 Power Bank (PowerCore 24K 140W)',
            sku: 'ANK-PB-737-BLK',
            quantity: 1,
            unitPrice: 38500,
            discount: 0,
            total: 38500,
            warrantyDuration: 18,
            warrantyUnit: 'MONTHS',
            serialNumber: 'ANK737-2026-09418',
          },
        ],
        subtotal: 38500,
        discount: 0,
        shippingFee: 650,
        total: 39150,
        paymentMethod: 'Mintpay',
        paymentStatus: 'PAID',
        courier: 'Trans Express',
        trackingNumber: 'TEX-9481029',
        terms: DEFAULT_BUSINESS_SETTINGS.invoiceTerms,
      },
    ];
  });

  const [integrations, setIntegrations] = useState<SystemIntegrations>(() => {
    const saved = localStorage.getItem('wowtek_integrations');
    return saved ? JSON.parse(saved) : DEFAULT_INTEGRATIONS;
  });

  const [smsLogs, setSmsLogs] = useState<SMSLog[]>(() => {
    const saved = localStorage.getItem('wowtek_sms_logs');
    return saved ? JSON.parse(saved) : INITIAL_SMS_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationEvent[]>(() => {
    const saved = localStorage.getItem('wowtek_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('wowtek_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');

  // Database & API Connectivity Status
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [dbInfo, setDbInfo] = useState<string>('Initializing server connection...');
  const [dataSource, setDataSource] = useState<'MONGODB' | 'LOCAL_DEMO'>('LOCAL_DEMO');

  // Print preview modals
  const [printableWaybills, setPrintableWaybillsState] = useState<Waybill[] | null>(null);
  const [printableWaybillFormat, setPrintableWaybillFormat] = useState<'A4' | 'THERMAL_4X6'>('THERMAL_4X6');
  const [printableInvoice, setPrintableInvoice] = useState<Invoice | null>(null);

  const setPrintableWaybills = (wbs: Waybill[] | null, format: 'A4' | 'THERMAL_4X6' = 'THERMAL_4X6') => {
    setPrintableWaybillFormat(format);
    setPrintableWaybillsState(wbs);
  };

  // Database Sync & Initial Fetch from /api/*
  const refreshData = useCallback(async () => {
    try {
      const health = await apiClient.getHealth();
      if (health && health.database) {
        setIsDbConnected(health.database.connected);
        setDbInfo(health.database.info || (health.database.connected ? 'MongoDB Atlas Cluster Connected' : 'Local Resilient Storage'));
        setDataSource(health.database.connected ? 'MONGODB' : 'LOCAL_DEMO');
      }

      // Concurrently query all collections from server API
      const [ordersRes, prodsRes, custsRes, suppsRes, warsRes, shipsRes, invsRes, setsRes, auditRes] =
        await Promise.allSettled([
          apiClient.getOrders(),
          apiClient.getProducts(),
          apiClient.getCustomers(),
          apiClient.getSuppliers(),
          apiClient.getWarranties(),
          apiClient.getShipments(),
          apiClient.getInvoices(),
          apiClient.getSettings(),
          apiClient.getAuditLogs(),
        ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value?.orders) {
        setOrders(ordersRes.value.orders);
        if (ordersRes.value.source === 'MONGODB') {
          setDataSource('MONGODB');
        }
      }
      if (prodsRes.status === 'fulfilled' && prodsRes.value) {
        setProducts(prodsRes.value);
      }
      if (custsRes.status === 'fulfilled' && custsRes.value) {
        setCustomers(custsRes.value);
      }
      if (suppsRes.status === 'fulfilled' && suppsRes.value) {
        setSuppliers(suppsRes.value);
      }
      if (warsRes.status === 'fulfilled' && warsRes.value) {
        setWarranties(warsRes.value);
      }
      if (shipsRes.status === 'fulfilled' && shipsRes.value) {
        setWaybills(shipsRes.value);
      }
      if (invsRes.status === 'fulfilled' && invsRes.value) {
        setInvoices(invsRes.value);
      }
      if (setsRes.status === 'fulfilled' && setsRes.value) {
        setBusinessSettings(setsRes.value.businessSettings);
        setPaymentMethods(setsRes.value.paymentMethods);
        setPlatformCommissions(setsRes.value.platformCommissions);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value) {
        setAuditLogs(auditRes.value);
      }
    } catch (err: any) {
      console.warn('[OMS DATA SYNC]', err.message);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('wowtek_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('wowtek_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('wowtek_business_settings', JSON.stringify(businessSettings));
  }, [businessSettings]);

  useEffect(() => {
    localStorage.setItem('wowtek_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem('wowtek_commissions', JSON.stringify(platformCommissions));
  }, [platformCommissions]);

  useEffect(() => {
    localStorage.setItem('wowtek_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('wowtek_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('wowtek_inventory_tx', JSON.stringify(inventoryTransactions));
  }, [inventoryTransactions]);

  useEffect(() => {
    localStorage.setItem('wowtek_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('wowtek_warranties', JSON.stringify(warranties));
  }, [warranties]);

  useEffect(() => {
    localStorage.setItem('wowtek_waybills', JSON.stringify(waybills));
  }, [waybills]);

  useEffect(() => {
    localStorage.setItem('wowtek_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('wowtek_sms_logs', JSON.stringify(smsLogs));
  }, [smsLogs]);

  useEffect(() => {
    localStorage.setItem('wowtek_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Helper to add audit logs
  const logAudit = (action: string, module: string, details: string, recordId?: string, prev?: string, next?: string) => {
    const entry: AuditLog = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: currentUser.id,
      userName: `${currentUser.name} (${currentUser.role})`,
      action,
      module,
      recordId,
      details,
      previousValue: prev,
      newValue: next,
      ipAddress: '127.0.0.1 (Colombo)',
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prevLogs) => [entry, ...prevLogs]);
  };

  // Helper to add notifications
  const addNotification = (eventType: NotificationEvent['eventType'], entityId: string, entityType: NotificationEvent['entityType'], title: string, message: string) => {
    const notif: NotificationEvent = {
      id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      eventType,
      entityId,
      entityType,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [notif, ...prev]);
  };

  // Business settings update
  const updateBusinessSettings = (updates: Partial<BusinessSettings>) => {
    setBusinessSettings((prev) => ({ ...prev, ...updates }));
    logAudit('SETTINGS_UPDATE', 'BUSINESS', 'Updated business profile and invoice/warranty terms');
  };

  // Payment method update
  const updatePaymentMethod = (id: string, updates: Partial<PaymentMethodConfig>) => {
    setPaymentMethods((prev) =>
      prev.map((pm) => (pm.id === id ? { ...pm, ...updates } : pm))
    );
    logAudit('PAYMENT_METHOD_UPDATE', 'PAYMENTS', `Updated fee configuration for payment method ${id}`);
  };

  // Platform commission update
  const updatePlatformCommission = (id: string, updates: Partial<PlatformCommissionConfig>) => {
    setPlatformCommissions((prev) =>
      prev.map((pc) => (pc.id === id ? { ...pc, ...updates } : pc))
    );
    logAudit('COMMISSION_UPDATE', 'COMMISSIONS', `Updated commission rates for channel ${id}`);
  };

  // Add new user
  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    logAudit('USER_CREATED', 'USERS', `Created user ${newUser.name} with role ${newUser.role}`);
  };

  // Stock adjustments
  const adjustStock = (
    productId: string,
    quantityChange: number,
    type: InventoryMovementType,
    notes?: string,
    unitCostOverride?: number
  ) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const previousStock = product.stockQuantity;
    const newStock = Math.max(0, previousStock + quantityChange);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() } : p
      )
    );

    const tx: InventoryTransaction = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      productId,
      productName: product.name,
      sku: product.sku,
      type,
      quantityChange,
      previousStock,
      newStock,
      unitCost: unitCostOverride ?? product.costPrice,
      notes: notes || `Stock ${quantityChange >= 0 ? '+' : ''}${quantityChange} by ${currentUser.name}`,
      createdBy: `${currentUser.name} (${currentUser.role})`,
      createdAt: new Date().toISOString(),
    };

    setInventoryTransactions((prev) => [tx, ...prev]);
    logAudit(
      'STOCK_ADJUSTED',
      'INVENTORY',
      `Adjusted stock for ${product.name} (${product.sku}): ${previousStock} -> ${newStock} (${type})`,
      productId,
      String(previousStock),
      String(newStock)
    );
  };

  // Product CRUD
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProd: Product = {
      ...productData,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProd, ...prev]);

    // Record initial stock transaction if stock > 0
    if (newProd.stockQuantity > 0) {
      const tx: InventoryTransaction = {
        id: `tx_init_${Date.now()}`,
        productId: newProd.id,
        productName: newProd.name,
        sku: newProd.sku,
        type: 'PURCHASE',
        quantityChange: newProd.stockQuantity,
        previousStock: 0,
        newStock: newProd.stockQuantity,
        unitCost: newProd.costPrice,
        notes: 'Initial inventory stock receipt',
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };
      setInventoryTransactions((prev) => [tx, ...prev]);
    }

    logAudit('PRODUCT_CREATED', 'PRODUCTS', `Created product ${newProd.name} (SKU: ${newProd.sku})`, newProd.id);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    logAudit('PRODUCT_UPDATED', 'PRODUCTS', `Updated product details for ${id}`, id);
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    logAudit('PRODUCT_DELETED', 'PRODUCTS', `Archived/Deleted product ${prod?.name || id}`, id);
  };

  // Customer & Supplier CRUD
  const addCustomer = (custData: Omit<Customer, 'id' | 'orderCount' | 'totalSpent' | 'createdAt'>) => {
    const newCust: Customer = {
      ...custData,
      id: `cust_${Date.now()}`,
      orderCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);
    logAudit('CUSTOMER_CREATED', 'CUSTOMERS', `Added customer ${newCust.name} (${newCust.phone})`, newCust.id);
    return newCust;
  };

  const addSupplier = (suppData: Omit<Supplier, 'id' | 'totalPurchases' | 'createdAt'>) => {
    const newSupp: Supplier = {
      ...suppData,
      id: `sup_${Date.now()}`,
      totalPurchases: 0,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSupp, ...prev]);
    logAudit('SUPPLIER_CREATED', 'SUPPLIERS', `Added supplier ${newSupp.name} (${newSupp.company})`, newSupp.id);
  };

  // Invoices
  const generateInvoice = (orderId: string): Invoice => {
    const existing = invoices.find((inv) => inv.orderId === orderId);
    if (existing) return existing;

    const order = orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    const invoiceNumber = `INV-${order.orderNumber.replace('WTK-', '')}`;

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      issueDate: new Date().toISOString(),
      customer: {
        name: order.customer.name,
        phone: order.customer.phone,
        email: order.customer.email,
        address: order.shippingAddress.addressLine1,
        city: order.shippingAddress.city,
      },
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        total: item.totalPrice,
        warrantyDuration: item.warrantyDuration,
        warrantyUnit: item.warrantyUnit,
        serialNumber: item.serialNumber,
      })),
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      total: order.totalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      courier: order.courier,
      trackingNumber: order.trackingNumber,
      terms: businessSettings.invoiceTerms,
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Update order with invoice number
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, invoiceNumber } : o))
    );

    logAudit('INVOICE_GENERATED', 'INVOICES', `Generated invoice ${invoiceNumber} for order ${order.orderNumber}`, newInvoice.id);
    addNotification('INVOICE_CREATED', newInvoice.id, 'INVOICE', `Invoice Created: ${invoiceNumber}`, `Official invoice generated for ${order.customer.name}`);

    return newInvoice;
  };

  // Waybills
  const createWaybill = (
    orderId: string,
    courierName: string = 'Trans Express',
    labelFormat: 'A4' | 'THERMAL_4X6' = 'THERMAL_4X6'
  ): Waybill => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    const waybillNumber = `WB-TEX-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const trackingNumber = `TEX-${String(Math.floor(1000000 + Math.random() * 9000000))}`;

    const newWaybill: Waybill = {
      id: `wb_${Date.now()}`,
      waybillNumber,
      orderId: order.id,
      orderNumber: order.orderNumber,
      externalOrderId: order.externalOrderId,
      customerName: order.customer.name,
      customerPhone: order.customer.phone,
      address: `${order.shippingAddress.addressLine1}, ${order.shippingAddress.city}`,
      city: order.shippingAddress.city,
      codAmount: order.paymentStatus === 'PAID' ? 0 : order.totalAmount,
      courierName,
      courierTrackingUrl: `https://transexpress.lk/track/${trackingNumber}`,
      status: 'CREATED',
      labelFormat,
      printCount: 0,
      createdAt: new Date().toISOString(),
    };

    setWaybills((prev) => [newWaybill, ...prev]);

    // Update order with waybill and tracking number
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              waybillNumber,
              trackingNumber,
              courier: courierName,
              orderStatus: o.orderStatus === 'NEW' ? 'CONFIRMED' : o.orderStatus,
            }
          : o
      )
    );

    logAudit(
      'WAYBILL_CREATED',
      'WAYBILLS',
      `Created waybill ${waybillNumber} (${trackingNumber}) for order ${order.orderNumber}`,
      newWaybill.id
    );

    return newWaybill;
  };

  const updateWaybillStatus = (waybillId: string, status: Waybill['status']) => {
    setWaybills((prev) =>
      prev.map((wb) => (wb.id === waybillId ? { ...wb, status } : wb))
    );
    logAudit('WAYBILL_STATUS_UPDATE', 'WAYBILLS', `Updated waybill ${waybillId} status to ${status}`, waybillId);
  };

  // Warranty CRUD
  const createWarranty = (
    data: Omit<WarrantyRecord, 'id' | 'createdAt' | 'claims' | 'reminderHistory' | 'status' | 'expiryDate'>
  ): WarrantyRecord => {
    const expiryDate = calculateExpiryDate(data.startDate, data.warrantyDuration, data.warrantyUnit);
    const { status } = evaluateWarrantyStatus(expiryDate);

    const newWarranty: WarrantyRecord = {
      ...data,
      id: `war_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      expiryDate,
      status,
      claims: [],
      reminderHistory: [],
      createdAt: new Date().toISOString(),
    };

    setWarranties((prev) => [newWarranty, ...prev]);
    logAudit(
      'WARRANTY_CREATED',
      'WARRANTY',
      `Registered warranty for ${newWarranty.productName} (SN: ${newWarranty.serialNumber}) - Expires ${expiryDate.substring(0, 10)}`,
      newWarranty.id
    );

    return newWarranty;
  };

  const addWarrantyClaim = (
    warrantyId: string,
    claimData: Omit<WarrantyClaim, 'id' | 'warrantyId' | 'handledBy'>
  ) => {
    const claim: WarrantyClaim = {
      ...claimData,
      id: `claim_${Date.now()}`,
      warrantyId,
      handledBy: currentUser.name,
    };

    setWarranties((prev) =>
      prev.map((w) =>
        w.id === warrantyId
          ? {
              ...w,
              status: 'CLAIMED',
              claims: [claim, ...w.claims],
            }
          : w
      )
    );

    logAudit(
      'WARRANTY_CLAIM_ADDED',
      'WARRANTY',
      `Recorded warranty claim: ${claim.issueDescription} (${claim.status})`,
      warrantyId
    );
  };

  const runWarrantyReminderCheck = () => {
    const enabledReminders = {
      '30_DAYS': true,
      '14_DAYS': true,
      '7_DAYS': true,
      '1_DAY': true,
      EXPIRED: true,
    };

    const dueList = identifyDueReminders(warranties, enabledReminders);
    const sentSummary: string[] = [];

    for (const due of dueList) {
      const templateType = due.interval === 'EXPIRED' ? 'WARRANTY_EXPIRED' : 'WARRANTY_EXPIRING';
      const msg = smsService.renderTemplate(templateType, {
        productName: due.warranty.productName,
        serialNumber: due.warranty.serialNumber,
        daysRemaining: due.daysRemaining,
        expiryDate: due.warranty.expiryDate.substring(0, 10),
      });

      // Dispatch SMS
      const logEntry: SMSLog = {
        id: `sms_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        recipientName: due.warranty.customerName,
        phone: due.warranty.customerPhone,
        message: msg,
        type: templateType,
        status: 'SENT',
        providerResponse: 'AUTOMATED_WARRANTY_REMINDER_SENT',
        sentAt: new Date().toISOString(),
      };

      setSmsLogs((prev) => [logEntry, ...prev]);

      // Update warranty reminder history to prevent duplicate
      setWarranties((prev) =>
        prev.map((w) =>
          w.id === due.warranty.id
            ? { ...w, reminderHistory: [...w.reminderHistory, due.interval] }
            : w
        )
      );

      sentSummary.push(`${due.warranty.customerName} (${due.interval})`);
    }

    if (dueList.length > 0) {
      logAudit(
        'WARRANTY_REMINDERS_RUN',
        'AUTOMATION',
        `Dispatched ${dueList.length} automated warranty reminder SMS messages`
      );
    }

    return { sentCount: dueList.length, reminders: sentSummary };
  };

  // Orders Status Transition & Actions
  const updateOrderStatus = (
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string,
    courier?: string
  ) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const prevStatus = order.orderStatus;
    const now = new Date().toISOString();

    const updates: Partial<Order> = {
      orderStatus: status,
      updatedAt: now,
    };

    if (trackingNumber) updates.trackingNumber = trackingNumber;
    if (courier) updates.courier = courier;

    if (status === 'CONFIRMED' && !order.confirmedAt) updates.confirmedAt = now;
    if (status === 'SHIPPED' && !order.shippedAt) updates.shippedAt = now;
    if (status === 'DELIVERED' && !order.deliveredAt) {
      updates.deliveredAt = now;
      updates.paymentStatus = 'PAID'; // Delivered orders mark payment completed
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates } : o))
    );

    logAudit(
      'ORDER_STATUS_UPDATE',
      'ORDERS',
      `Order ${order.orderNumber} status changed: ${prevStatus} -> ${status}`,
      orderId,
      prevStatus,
      status
    );

    // Automation: When CONFIRMED -> generate invoice automatically
    if (status === 'CONFIRMED' && !order.invoiceNumber) {
      generateInvoice(orderId);
      // Auto-send SMS
      smsService
        .sendSMS({
          recipientName: order.customer.name,
          phone: order.customer.phone,
          type: 'ORDER_CONFIRMED',
          data: {
            customerName: order.customer.name,
            orderNumber: order.orderNumber,
          },
          orderNumber: order.orderNumber,
        })
        .then((res) => {
          setSmsLogs((prev) => [res.log, ...prev]);
        });
    }

    // Automation: When READY_TO_SHIP -> auto-create waybill if none exists
    if (status === 'READY_TO_SHIP' && !order.waybillNumber) {
      createWaybill(orderId, order.courier || 'Trans Express');
    }

    // Automation: When SHIPPED -> send tracking SMS
    if (status === 'SHIPPED') {
      smsService
        .sendSMS({
          recipientName: order.customer.name,
          phone: order.customer.phone,
          type: 'ORDER_SHIPPED',
          data: {
            orderNumber: order.orderNumber,
            trackingNumber: trackingNumber || order.trackingNumber,
            courierName: courier || order.courier || 'Trans Express',
          },
          orderNumber: order.orderNumber,
        })
        .then((res) => {
          setSmsLogs((prev) => [res.log, ...prev]);
        });
    }

    // Automation: When DELIVERED -> register warranty for items with duration & send completion SMS
    if (status === 'DELIVERED') {
      order.items.forEach((item) => {
        if (item.warrantyDuration && item.warrantyDuration > 0) {
          const exists = warranties.some(
            (w) => w.orderId === order.id && w.productId === item.productId
          );
          if (!exists) {
            createWarranty({
              customerId: order.customer.id || `cust_${Date.now()}`,
              customerName: order.customer.name,
              customerPhone: order.customer.phone,
              orderId: order.id,
              orderNumber: order.orderNumber,
              productId: item.productId,
              productName: item.name,
              sku: item.sku,
              serialNumber: item.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
              imei: item.imei,
              warrantyDuration: item.warrantyDuration,
              warrantyUnit: item.warrantyUnit || 'MONTHS',
              startDate: now,
            });
          }
        }
      });

      // Send delivery completed SMS
      smsService
        .sendSMS({
          recipientName: order.customer.name,
          phone: order.customer.phone,
          type: 'DELIVERY_COMPLETED',
          data: {
            orderNumber: order.orderNumber,
          },
          orderNumber: order.orderNumber,
        })
        .then((res) => {
          setSmsLogs((prev) => [res.log, ...prev]);
        });
    }
  };

  // Create Manual Order
  const createManualOrder = (orderData: Partial<Order>): Order => {
    const orderNumber = `WTK-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const items = orderData.items || [];
    const source = orderData.source || 'MANUAL';
    const paymentMethod = orderData.paymentMethod || 'Cash';
    const shippingFee = orderData.shippingFee || 0;
    const discount = orderData.discount || 0;

    const profit = calculateOrderProfit({
      items,
      overallDiscount: discount,
      shippingFee,
      source,
      paymentMethod,
      courierFee: shippingFee,
      otherCosts: 150,
      paymentConfigs: paymentMethods,
      commissionConfigs: platformCommissions,
    });

    const newOrder: Order = {
      id: `ord_manual_${Date.now()}`,
      orderNumber,
      source,
      customer: orderData.customer || {
        name: 'Counter Customer',
        phone: '+94 77 000 0000',
        email: '',
      },
      items,
      subtotal: profit.revenue,
      discount: profit.discount,
      shippingFee,
      totalAmount: profit.revenue - profit.discount + shippingFee,
      profit,
      paymentMethod,
      paymentStatus: orderData.paymentStatus || 'PAID',
      orderStatus: orderData.orderStatus || 'NEW',
      shippingAddress: orderData.shippingAddress || {
        name: orderData.customer?.name || 'Customer',
        phone: orderData.customer?.phone || '',
        addressLine1: 'WOWTEK Bambalapitiya Store Pickup',
        city: 'Colombo',
        country: 'Sri Lanka',
      },
      billingAddress: orderData.billingAddress || {
        name: orderData.customer?.name || 'Customer',
        phone: orderData.customer?.phone || '',
        addressLine1: 'Colombo Store',
        city: 'Colombo',
        country: 'Sri Lanka',
      },
      courier: orderData.courier || 'Store Pickup',
      notes: orderData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Deduct stock for each item
    items.forEach((item) => {
      adjustStock(item.productId, -item.quantity, 'SALE', `Sold in Order ${orderNumber}`);
    });

    setOrders((prev) => [newOrder, ...prev]);

    // Update customer total spend & order count
    setCustomers((prev) => {
      const idx = prev.findIndex((c) => c.phone === newOrder.customer.phone);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          orderCount: updated[idx].orderCount + 1,
          totalSpent: updated[idx].totalSpent + newOrder.totalAmount,
          lastOrderDate: newOrder.createdAt,
        };
        return updated;
      } else {
        return [
          {
            id: `cust_${Date.now()}`,
            name: newOrder.customer.name,
            phone: newOrder.customer.phone,
            email: newOrder.customer.email,
            address: newOrder.shippingAddress.addressLine1,
            city: newOrder.shippingAddress.city,
            orderCount: 1,
            totalSpent: newOrder.totalAmount,
            lastOrderDate: newOrder.createdAt,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ];
      }
    });

    logAudit('ORDER_CREATED', 'ORDERS', `Created manual order ${newOrder.orderNumber} (Rs. ${newOrder.totalAmount})`, newOrder.id);
    addNotification('ORDER_CREATED', newOrder.id, 'ORDER', `New Order: ${newOrder.orderNumber}`, `${newOrder.customer.name} placed order for Rs. ${newOrder.totalAmount}`);

    return newOrder;
  };

  const cancelOrder = (orderId: string, reason?: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    // Restore stock
    order.items.forEach((item) => {
      adjustStock(item.productId, item.quantity, 'RETURN', `Restocked on Cancel of Order ${order.orderNumber}`);
    });

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: 'CANCELLED', notes: `Cancelled: ${reason || 'Customer request'}` } : o))
    );

    logAudit('ORDER_CANCELLED', 'ORDERS', `Cancelled order ${order.orderNumber}. Reason: ${reason || 'N/A'}`, orderId);
  };

  // Integration Updates
  const updateIntegration = (key: keyof SystemIntegrations, updates: any) => {
    setIntegrations((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...updates },
    }));
    logAudit('INTEGRATION_CONFIG_UPDATE', 'INTEGRATIONS', `Updated configuration for ${String(key)}`);
  };

  // SMS Gateway
  const sendSMS = async (phone: string, recipientName: string, message: string, type: SMSLog['type'] = 'CUSTOM', orderNumber?: string): Promise<boolean> => {
    const res = await smsService.sendSMS({
      recipientName,
      phone,
      type,
      data: { customText: message },
      orderNumber,
    });
    setSmsLogs((prev) => [res.log, ...prev]);
    logAudit('SMS_DISPATCHED', 'SMS', `Dispatched ${type} SMS to ${phone}`);
    return res.success;
  };

  // WooCommerce Webhook Simulator
  const simulateWooCommerceWebhookOrder = (customPayload?: Partial<WooCommerceWebhookOrder>) => {
    const randomWcId = Math.floor(94000 + Math.random() * 900);
    const sampleProduct = products[Math.floor(Math.random() * products.length)] || products[0];

    const sampleOrder: WooCommerceWebhookOrder = {
      id: randomWcId,
      number: String(randomWcId),
      status: 'processing',
      currency: 'LKR',
      total: String(sampleProduct.sellingPrice + 650),
      discount_total: '0',
      shipping_total: '650',
      payment_method: 'mintpay',
      payment_method_title: 'Mintpay - 3 Installments',
      billing: {
        first_name: 'Sampath',
        last_name: 'Wickramasinghe',
        address_1: '28, Station Road',
        city: 'Moratuwa',
        state: 'Western Province',
        postcode: '10400',
        country: 'Sri Lanka',
        email: 'sampath.w@gmail.com',
        phone: '+94 77 345 6789',
      },
      shipping: {
        first_name: 'Sampath',
        last_name: 'Wickramasinghe',
        address_1: '28, Station Road',
        city: 'Moratuwa',
        state: 'Western Province',
        postcode: '10400',
        country: 'Sri Lanka',
        phone: '+94 77 345 6789',
      },
      line_items: [
        {
          id: 101,
          name: sampleProduct.name,
          product_id: 9120,
          quantity: 1,
          sku: sampleProduct.sku,
          price: sampleProduct.sellingPrice,
          subtotal: String(sampleProduct.sellingPrice),
          total: String(sampleProduct.sellingPrice),
        },
      ],
      date_created: new Date().toISOString(),
      ...customPayload,
    };

    const result = processWooCommerceOrder({
      wcOrder: sampleOrder,
      existingOrders: orders,
      availableProducts: products,
      paymentConfigs: paymentMethods,
      commissionConfigs: platformCommissions,
    });

    if (!result.success || !result.order) {
      return { success: false, message: result.error || 'Failed to process webhook order.' };
    }

    // Add order to state
    setOrders((prev) => [result.order!, ...prev]);

    // Deduct stock
    adjustStock(sampleProduct.id, -1, 'SALE', `WooCommerce Webhook #${randomWcId}`);

    // Add notification
    addNotification(
      'ORDER_CREATED',
      result.order.id,
      'ORDER',
      `WooCommerce Order Received (#${sampleOrder.id})`,
      `New order ${result.order.orderNumber} placed by ${result.order.customer.name} for Rs. ${result.order.totalAmount}`
    );

    logAudit(
      'WOOCOMMERCE_WEBHOOK_INGESTED',
      'INTEGRATIONS',
      `Ingested WooCommerce order #${sampleOrder.id} as ${result.order.orderNumber} with profit Rs. ${result.order.profit.netProfit}`,
      result.order.id
    );

    return {
      success: true,
      message: `WooCommerce Order #${sampleOrder.id} successfully processed! Order ${result.order.orderNumber} created.`,
    };
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Calculate Dashboard Metrics based on Date Filter
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const filteredOrders = orders.filter((o) => {
    if (dateFilter === 'all') return true;
    const orderTime = new Date(o.createdAt).getTime();

    if (dateFilter === 'today') {
      return orderTime >= startOfToday;
    }
    if (dateFilter === 'yesterday') {
      const yesterdayStart = startOfToday - 86400000;
      return orderTime >= yesterdayStart && orderTime < startOfToday;
    }
    if (dateFilter === 'week') {
      const sevenDaysAgo = now.getTime() - 7 * 86400000;
      return orderTime >= sevenDaysAgo;
    }
    if (dateFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return orderTime >= startOfMonth;
    }
    if (dateFilter === 'last_month') {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).getTime();
      return orderTime >= startOfLastMonth && orderTime <= endOfLastMonth;
    }
    return true;
  });

  const todayOrdersList = orders.filter((o) => new Date(o.createdAt).getTime() >= startOfToday);
  const todaySales = todayOrdersList.reduce((sum, o) => sum + o.totalAmount, 0);
  const todayNetProfit = todayOrdersList.reduce((sum, o) => sum + (o.profit?.netProfit || 0), 0);

  const pendingOrders = orders.filter((o) => o.orderStatus === 'NEW' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PROCESSING').length;
  const readyToShipOrders = orders.filter((o) => o.orderStatus === 'READY_TO_SHIP').length;
  const shippedOrders = orders.filter((o) => o.orderStatus === 'SHIPPED').length;
  const deliveredOrders = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const lowStockProducts = products.filter((p) => p.stockQuantity <= p.minStock).length;

  const warrantyExpiries30d = warranties.filter((w) => {
    const { status } = evaluateWarrantyStatus(w.expiryDate, w.status);
    return status === 'EXPIRING_SOON' || status === 'EXPIRED';
  }).length;

  // Sales and Profit by Channel
  const channels: Order['source'][] = ['WEBSITE', 'PICKME', 'UBER_EATS', 'MANUAL'];
  const salesByChannel = channels.map((channel) => {
    const channelOrders = filteredOrders.filter((o) => o.source === channel);
    const sales = channelOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const profit = channelOrders.reduce((sum, o) => sum + (o.profit?.netProfit || 0), 0);
    return {
      channel,
      sales,
      orders: channelOrders.length,
      profit,
    };
  });

  const profitByChannel = channels.map((channel) => {
    const channelOrders = filteredOrders.filter((o) => o.source === channel);
    const grossProfit = channelOrders.reduce((sum, o) => sum + (o.profit?.grossProfit || 0), 0);
    const netProfit = channelOrders.reduce((sum, o) => sum + (o.profit?.netProfit || 0), 0);
    const netRevenue = channelOrders.reduce((sum, o) => sum + (o.profit?.netRevenue || 0), 0);
    const margin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
    return {
      channel,
      grossProfit,
      netProfit,
      margin: Math.round(margin * 10) / 10,
    };
  });

  const dashboardMetrics: DashboardMetrics = {
    todaySales,
    todayOrders: todayOrdersList.length,
    todayNetProfit,
    pendingOrders,
    readyToShipOrders,
    shippedOrders,
    deliveredOrders,
    lowStockProducts,
    warrantyExpiries30d,
    salesByChannel,
    profitByChannel,
  };

  return (
    <OMSContext.Provider
      value={{
        currentView,
        setCurrentView,
        isNewOrderModalOpen,
        setIsNewOrderModalOpen,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        currentUser,
        setCurrentUser,
        users,
        addUser,
        businessSettings,
        updateBusinessSettings,
        paymentMethods,
        updatePaymentMethod,
        platformCommissions,
        updatePlatformCommission,
        orders,
        updateOrderStatus,
        createManualOrder,
        cancelOrder,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        inventoryTransactions,
        customers,
        addCustomer,
        suppliers,
        addSupplier,
        warranties,
        createWarranty,
        addWarrantyClaim,
        runWarrantyReminderCheck,
        waybills,
        createWaybill,
        updateWaybillStatus,
        invoices,
        generateInvoice,
        integrations,
        updateIntegration,
        smsLogs,
        sendSMS,
        simulateWooCommerceWebhookOrder,
        auditLogs,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        dateFilter,
        setDateFilter,
        dashboardMetrics,
        isDbConnected,
        dbInfo,
        dataSource,
        refreshData,
        printableWaybills,
        printableWaybillFormat,
        setPrintableWaybills,
        printableInvoice,
        setPrintableInvoice,
      }}
    >
      {children}
    </OMSContext.Provider>
  );
};

export const useOMS = () => {
  const context = useContext(OMSContext);
  if (!context) {
    throw new Error('useOMS must be used within an OMSProvider');
  }
  return context;
};
