export type TabType = 
  | 'dashboard'
  | 'orders' 
  | 'invoices'
  | 'barcodes' 
  | 'products' 
  | 'transfers'
  | 'suppliers' 
  | 'expenses' 
  | 'integrations'
  | 'sms'
  | 'audit';

export interface Outlet {
  id: string;
  name: string;
  code: string;
  address: string;
}

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  stockByOutlet: Record<string, number>;
  supplierId: string;
  warrantyPeriodMonths: number;
  warrantyPeriodDays?: number;
  isDeleted?: boolean;
  createdAt: string;
}

export interface BarcodeLabel {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  serialOrBarcode: string;
  isPrinted: boolean;
  grnBatch: string;
  outletId: string;
  createdAt: string;
}

export interface GRNEntry {
  id: string;
  supplierId: string;
  outletId: string;
  batchNumber: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    costPrice: number;
  }[];
  totalAmount: number;
  notes?: string;
}

export type OrderSource = 'Website' | 'PickMe' | 'Uber' | 'WooCommerce';
export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';
export type PaymentMethod = 'Cash/COD' | 'PayHere' | 'Koko' | 'Visa/Mastercard' | 'Mintpay';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  platformId?: string;
  source: OrderSource;
  outletId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  totalAmount: number;
  deliveryFee: number;
  commissionFee: number;
  paymentFee: number;
  serviceFee: number;
  discount: number;
  netProfit: number;
  status: OrderStatus;
  waybillNumber?: string;
  courierStatus?: string;
  stockDeducted: boolean;
  createdAt: string;
}

export interface InvoiceItem {
  productName: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  paymentMethod: PaymentMethod;
  paymentFee: number;
  totalAmount: number;
  outletId: string;
  status: 'Paid' | 'Unpaid' | 'Refunded';
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceOutletId: string;
  targetOutletId: string;
  productId: string;
  productName: string;
  quantity: number;
  serials: string[];
  status: 'Pending' | 'Approved' | 'Received' | 'Cancelled';
  requestedBy: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  category: string;
  createdAt: string;
}

export type WarrantyStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Claimed' | 'Sent for Warranty' | 'Fixed/Received' | 'Replaced' | 'Rejected';

export interface WarrantyRecord {
  id: string;
  warrantyNumber: string;
  orderId?: string;
  invoiceNumber?: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  sku: string;
  serialNumber: string;
  barcode: string;
  purchaseDate: string;
  startDate: string;
  expiryDate: string;
  status: WarrantyStatus;
  supplierId?: string;
  replacementSerial?: string;
  repairNotes?: string;
  claimDate?: string;
  returnDate?: string;
  reminderSent: boolean;
  createdAt: string;
}

export type WarrantyClaim = WarrantyRecord;

export interface Expense {
  id: string;
  title: string;
  category: 'Electricity' | 'Rent' | 'Marketing' | 'Salaries' | 'Transport' | 'Packaging' | 'Other';
  amount: number;
  outletId: string;
  date: string;
  description: string;
}

export interface SMSConfig {
  provider: 'SMSlenz' | 'Dialog' | 'Mobitel' | 'Custom';
  senderId: string;
  apiKey: string;
  userId: string;
  endpointUrl: string;
  httpMethod: 'POST' | 'GET';
  enabled: boolean;
}

export interface IntegrationConfig {
  woocommerce: {
    storeUrl: string;
    consumerKey: string;
    consumerSecret: string;
    webhookSecret: string;
    connected: boolean;
    webhookRegistered: boolean;
    lastSync?: string;
    lastError?: string;
  };
  pickme: {
    merchantId: string;
    apiKey: string;
    accessToken: string;
    endpoint: string;
    connected: boolean;
    lastSync?: string;
    lastError?: string;
  };
  uber: {
    storeId: string;
    clientId: string;
    clientSecret: string;
    authToken: string;
    endpoint: string;
    connected: boolean;
    lastSync?: string;
    lastError?: string;
  };
  transExpress: {
    apiUrl: string;
    accountNumber: string;
    apiKey: string;
    pickupLocation: string;
    autoBookWaybill: boolean;
    connected: boolean;
    lastSync?: string;
    lastError?: string;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Staff';
  outletId: string;
}
