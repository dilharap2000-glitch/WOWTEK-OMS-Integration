/**
 * WOWTEK ORDER MANAGEMENT SYSTEM (WOWTEK OMS)
 * Multi-Tenant SaaS Platform Data Models & Type Definitions
 * Designed for Multi-Business Isolation & Scalability
 */

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF';

export interface User {
  id: string;
  tenantId?: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  active?: boolean;
  isActive?: boolean;
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export type SubscriptionPlanId = 'FREE' | 'STARTER' | 'BUSINESS' | 'PRO';
export type SubscriptionStatus = 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';

export interface SubscriptionPlanLimits {
  monthlyOrders: number;      // -1 for unlimited
  users: number;              // Max team members
  integrations: number;       // Allowed active integrations
  branches: number;           // Store locations / warehouses
  smsPerMonth: number;        // SMS notification credit
  storageMb: number;          // File storage cap in MB
  features: string[];         // Feature slugs
  maxMonthlyOrders?: number;  // Compatibility alias
  maxStaffUsers?: number;     // Compatibility alias
  maxIntegrations?: number;   // Compatibility alias
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  tier: SubscriptionPlanId;
  description: string;
  priceMonthlyLkr: number;
  priceAnnualLkr: number;
  limits: SubscriptionPlanLimits;
  isActive: boolean;
  isPopular?: boolean;
}

export interface Subscription {
  id?: string;
  _id?: string;
  tenantId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  startDate?: string;
  currentPeriodStart?: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd?: boolean;
  billingCycle?: 'MONTHLY' | 'ANNUAL' | string;
  maxMonthlyOrders?: number;
  maxStaffUsers?: number;
  maxIntegrations?: number;
  currentOrdersThisMonth?: number;
  usage?: {
    ordersThisMonth: number;
    usersCount: number;
    smsSentThisMonth: number;
    storageUsedMb: number;
    activeIntegrationsCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  _id?: string;
  id?: string;
  tenantId: string;
  businessName: string;
  businessSlug: string;
  ownerUserId: string;
  logo?: string;
  website?: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  currency: string;           // E.g. 'LKR', 'USD'
  timezone: string;           // E.g. 'Asia/Colombo'
  subscriptionPlan: SubscriptionPlanId;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: string;
  createdAt: string;
  updatedAt: string;
}

export type IntegrationProvider = 'WOOCOMMERCE' | 'PICKME' | 'UBER_EATS' | 'TRANSEX' | 'SMS';
export type IntegrationConnectionStatus = 'CONNECTED' | 'NOT_CONNECTED' | 'ERROR' | 'PENDING';

export interface TenantIntegration {
  id: string;
  tenantId: string;
  provider: IntegrationProvider;
  enabled: boolean;
  status: IntegrationConnectionStatus;
  encryptedCredentials?: string;     // Encrypted server-side using AES-256-GCM. Never sent to browser!
  maskedCredentialsHint?: Record<string, string>; // Safe hints e.g. { storeUrl: "wowtek.lk", keyMasked: "ck_••••4b91" }
  webhookSecret?: string;            // Dedicated tenant webhook verification secret
  lastSyncAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export type ChannelSource = 'WEBSITE' | 'PICKME' | 'UBER_EATS' | 'MANUAL' | (string & {});

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'REFUNDED'
  | (string & {});

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED' | (string & {});

export interface Address {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode?: string;
  district?: string;
  country: string;
}

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
  | 'SETTINGS'
  | 'SUPER_ADMIN';

export interface OrderItem {
  id: string;
  tenantId?: string;
  productId: string;
  name: string;
  sku: string;
  barcode?: string;
  quantity: number;
  unitPrice: number;       // Selling price per unit
  unitCost: number;        // Product cost per unit
  discount?: number;       // Discount allocated
  totalPrice?: number;     // (unitPrice * qty) - discount
  total?: number;
  totalCost?: number;      // unitCost * qty
  grossProfit?: number;    // totalPrice - totalCost
  warrantyDuration?: number;
  warrantyUnit?: 'DAYS' | 'MONTHS' | 'YEARS' | string;
  serialNumber?: string;
  imei?: string;
}

export interface ProfitBreakdown {
  revenue: number;              // Gross sales / selling price total
  discount: number;             // Total discount applied
  netRevenue: number;           // revenue - discount
  productCost: number;          // Total COGS
  grossProfit: number;          // netRevenue - productCost
  platformCommission: number;   // E.g. PickMe 20%, Uber 22%
  paymentFee: number;           // E.g. Mintpay 12%, Koko 10%, Card 2.8%
  courierFee: number;           // Trans Express or other delivery fee
  otherCosts: number;           // Packaging, handling
  totalFees: number;            // commission + paymentFee + courierFee + otherCosts
  netProfit: number;            // grossProfit - totalFees
  profitMargin: number;         // (netProfit / netRevenue) * 100
}

export interface TransExpressShipmentData {
  waybillId: string | number;
  trackingNumber?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  trackingStatus?: string;
  errorMessage?: string;
  cityId?: number | string;
  districtId?: number | string;
  provinceId?: number | string;
}

export interface TransExpressProvince {
  id: number;
  name: string;
}

export interface TransExpressDistrict {
  id: number;
  name: string;
  province_id: number;
}

export interface TransExpressCity {
  id: number;
  name: string;
  district_id: number;
  postcode?: string;
}

export interface Order {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  orderNumber: string;          // E.g. WTK-2026-0842
  externalOrderId?: string;     // E.g. WC-92144, PKM-83912, UBR-5491
  source: ChannelSource | string;
  customer: {
    id?: string;
    name: string;
    phone: string;
    email: string;
  };
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalAmount?: number;          // Customer payable amount (subtotal - discount + shippingFee)
  total?: number;
  status?: OrderStatus | string;
  paymentMethodCode?: string;
  profit?: ProfitBreakdown;
  paymentMethod: string;        // 'Mintpay' | 'Koko' | 'PayZy' | 'Card' | 'Bank Transfer' | 'Cash'
  paymentStatus: PaymentStatus | string;
  orderStatus?: OrderStatus | string;
  shippingAddress: Address;
  billingAddress?: Address;
  courier?: string;             // 'Trans Express' | 'Direct Delivery' | 'PickMe Courier'
  trackingNumber?: string;
  waybillNumber?: string;
  invoiceNumber?: string;
  notes?: string;
  transExpress?: TransExpressShipmentData;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface Product {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  minStock: number;
  supplierId?: string;
  supplierName?: string;
  warrantyDuration: number;
  warrantyUnit: 'DAYS' | 'MONTHS' | 'YEARS' | string;
  isActive: boolean;
  wooCommerceId?: string;
  pickMeId?: string;
  uberId?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'DAMAGED';

export interface InventoryTransaction {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  productId: string;
  productName: string;
  sku: string;
  type: InventoryMovementType;
  quantityChange: number;       // + or -
  previousStock: number;
  newStock: number;
  unitCost: number;
  referenceId?: string;         // Order ID, PO number, or note
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  name: string;
  company: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  totalPurchases: number;
  createdAt: string;
}

export interface Customer {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
}

export interface PaymentMethodConfig {
  id: string;
  tenantId: string;             // Mandatory tenant isolation
  name: string;
  code: string;
  isEnabled: boolean;
  feePercentage: number;        // E.g. 12 for Mintpay
  fixedFee: number;             // E.g. Rs 50
  feeType: 'PERCENTAGE' | 'FIXED' | 'PERCENTAGE_AND_FIXED';
  notes?: string;
}

export interface PlatformCommissionConfig {
  id: string;
  tenantId: string;             // Mandatory tenant isolation
  channel: ChannelSource;
  name?: string;
  percentage: number;           // E.g. 20 for PickMe, 22 for Uber
  commissionPercentage?: number;
  fixedFee: number;
  isActive: boolean;
}

export type WarrantyStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CLAIMED';

export interface WarrantyClaim {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  warrantyId: string;
  date: string;
  claimDate?: string;
  issueDescription: string;
  status: 'PENDING' | 'APPROVED' | 'REPAIRED' | 'REPLACED' | 'REJECTED';
  resolutionNotes?: string;
  notes?: string;
  handledBy: string;
}

export interface WarrantyRecord {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  customerId: string;
  customerName: string;
  customerPhone: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  sku: string;
  serialNumber: string;
  imei?: string;
  warrantyDuration: number;
  warrantyUnit: 'DAYS' | 'MONTHS' | 'YEARS' | string;
  startDate: string;
  expiryDate: string;
  status: WarrantyStatus | string;
  claims: WarrantyClaim[];
  reminderHistory: string[];    // Array of reminder keys sent, e.g. ['30_DAYS', '7_DAYS']
  createdAt: string;
}

export type WaybillStatus =
  | 'CREATED'
  | 'DISPATCHED'
  | 'IN_TRANSIT'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED'
  | string;

export interface Waybill {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  waybillNumber: string;
  trackingNumber?: string;
  barcodeValue?: string;
  orderId: string;
  orderNumber: string;
  externalOrderId?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  codAmount: number;            // Cash on delivery amount
  paymentMethod?: string;
  courierName: string;          // 'Trans Express'
  courierTrackingUrl?: string;
  status: WaybillStatus;
  labelFormat: 'A4' | 'THERMAL_4X6' | (string & {});
  printCount: number;
  items?: { name: string; quantity: number; sku?: string }[];
  isFragile?: boolean;
  notes?: string;
  note?: string;
  cityId?: number | string;
  transExpress?: TransExpressShipmentData;
  createdAt: string;
}

export interface Invoice {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  invoiceNumber: string;        // E.g. INV-2026-0842
  orderId: string;
  orderNumber: string;
  issueDate: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
  };
  items: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    warrantyDuration?: number;
    warrantyUnit?: string;
    serialNumber?: string;
  }[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  courier?: string;
  trackingNumber?: string;
  warrantyNotes?: string;
  terms: string;
}

export type SMSType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'DELIVERY_COMPLETED'
  | 'INVOICE_AVAILABLE'
  | 'WARRANTY_EXPIRING'
  | 'WARRANTY_EXPIRED'
  | 'CUSTOM'
  | string;

export interface SMSLog {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  recipientName: string;
  phone: string;
  message: string;
  type: SMSType;
  status: 'SENT' | 'FAILED' | 'QUEUED' | string;
  providerResponse?: string;
  orderNumber?: string;
  sentAt: string;
}

export type AutomationEventType =
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'INVOICE_CREATED'
  | 'WARRANTY_EXPIRING'
  | 'WARRANTY_EXPIRED'
  | 'PAYMENT_RECEIVED'
  | string;

export interface NotificationEvent {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  eventType: AutomationEventType;
  entityId: string;
  entityType: 'ORDER' | 'INVOICE' | 'WARRANTY' | 'SHIPMENT' | (string & {});
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface BusinessSettings {
  tenantId?: string;
  name: string;
  legalName: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  taxNumber?: string;
  vatNumber?: string;
  currency: string;
  currencySymbol: string;
  logoUrl?: string;
  invoiceTerms: string;
  warrantyTerms: string;
}

export interface IntegrationStatus {
  isEnabled: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  lastSync?: string;
  lastError?: string;
  itemCount?: number;
}

export interface SystemIntegrations {
  woocommerce: IntegrationStatus & {
    url: string;
    consumerKeyMasked?: string;
    webhookSecretConfigured: boolean;
  };
  pickme: IntegrationStatus & {
    apiUrl: string;
    apiKeyMasked?: string;
    merchantId?: string;
  };
  uberEats: IntegrationStatus & {
    apiUrl: string;
    clientIdMasked?: string;
  };
  transExpress: IntegrationStatus & {
    apiUrl: string;
    apiKeyMasked?: string;
    accountId?: string;
  };
  sms: IntegrationStatus & {
    apiUrl: string;
    senderId: string;
    apiKeyMasked?: string;
    lastSent?: string;
  };
}

export interface AuditLog {
  id: string;
  tenantId?: string;             // Mandatory tenant isolation
  userId: string;
  userName: string;
  action: string;
  module: string;
  recordId?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  createdAt: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface SuperAdminMetrics {
  totalBusinesses: number;
  activeBusinesses: number;
  trialBusinesses: number;
  expiredBusinesses: number;
  totalOrdersAllTenants?: number;
  totalOrdersAcrossPlatform?: number;
  totalRevenueAllTenants?: number;
  totalRevenueAcrossPlatform?: number;
  plansDistribution?: Record<SubscriptionPlanId | string, number>;
  subscriptionsByPlan?: Record<SubscriptionPlanId | string, number>;
  recentTenants?: Tenant[];
  systemAuditLogs?: AuditLog[];
}

export interface DashboardMetrics {
  todaySales: number;
  todayOrders: number;
  todayNetProfit: number;
  pendingOrders: number;
  readyToShipOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  lowStockProducts: number;
  warrantyExpiries30d: number;
  salesByChannel: {
    channel: ChannelSource;
    sales: number;
    orders: number;
    profit: number;
  }[];
  profitByChannel: {
    channel: ChannelSource;
    grossProfit: number;
    netProfit: number;
    margin: number;
  }[];
}

