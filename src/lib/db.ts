/**
 * WOWTEK Enterprise Multi-Tenant MongoDB Database Connection & Isolation Layer
 * Platform: WOWTEK OMS Multi-Tenant SaaS
 *
 * Implements:
 * 1. Global connection caching for Vercel serverless functions
 * 2. Enterprise multi-tenant compound indexes ({ tenantId: 1, ... })
 * 3. Tenant-scoped collection accessors with strict isolation guarantees
 * 4. Automatic seeding of default tenants, subscription tiers, and isolated demo stores
 */

import { MongoClient, Db, Collection, Filter, Document, OptionalId } from 'mongodb';
import {
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_PLATFORM_COMMISSIONS,
  DEFAULT_USERS,
  DEFAULT_TENANTS,
  DEFAULT_SUBSCRIPTION_PLANS,
  DEFAULT_SUBSCRIPTIONS,
  DEFAULT_TENANT_INTEGRATIONS,
  DEFAULT_PRODUCTS,
  INITIAL_ORDERS,
  DEFAULT_CUSTOMERS,
  DEFAULT_SUPPLIERS,
  DEFAULT_WARRANTIES,
  DEFAULT_WAYBILLS,
  INITIAL_AUDIT_LOGS,
} from './mockData';

const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'wowtek_oms';

// Global cache declaration for Vercel Serverless environment
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
  // eslint-disable-next-line no-var
  var _mongoDb: Db | undefined;
}

let clientPromise: Promise<MongoClient> | null = null;

if (MONGODB_URI) {
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL) {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(MONGODB_URI, {
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
      });
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    const client = new MongoClient(MONGODB_URI, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    clientPromise = client.connect();
  }
}

export async function connectToDatabase(): Promise<{
  client: MongoClient | null;
  db: Db | null;
  isConnected: boolean;
  error?: string;
}> {
  if (!MONGODB_URI || !clientPromise) {
    return {
      client: null,
      db: null,
      isConnected: false,
      error: 'MONGODB_URI environment variable is not configured. Running in high-performance tenant-isolated local store mode.',
    };
  }

  try {
    const client = await clientPromise;
    const db = client.db(MONGODB_DB_NAME);

    // Cache globally
    global._mongoClient = client;
    global._mongoDb = db;

    // Ensure database indexes and initial seeding asynchronously
    ensureDatabaseIndexes(db).catch((err) => {
      console.warn('[WOWTEK DB] Non-fatal index creation warning:', err.message);
    });

    seedDatabaseIfEmpty(db).catch((err) => {
      console.warn('[WOWTEK DB] Non-fatal seed check warning:', err.message);
    });

    return { client, db, isConnected: true };
  } catch (err: any) {
    console.error('[WOWTEK DB] MongoDB connection error:', err.message);
    return {
      client: null,
      db: null,
      isConnected: false,
      error: err.message,
    };
  }
}

/**
 * Raw Collections Accessor (Used internally and by Super Admin)
 */
export async function getCollections() {
  const { db, isConnected } = await connectToDatabase();
  if (!isConnected || !db) return null;

  return {
    db,
    tenants: db.collection('tenants'),
    subscriptionPlans: db.collection('subscriptionPlans'),
    subscriptions: db.collection('subscriptions'),
    tenantIntegrations: db.collection('tenantIntegrations'),
    users: db.collection('users'),
    customers: db.collection('customers'),
    products: db.collection('products'),
    suppliers: db.collection('suppliers'),
    orders: db.collection('orders'),
    orderItems: db.collection('orderItems'),
    payments: db.collection('payments'),
    inventoryTransactions: db.collection('inventoryTransactions'),
    invoices: db.collection('invoices'),
    warranties: db.collection('warranties'),
    shipments: db.collection('shipments'),
    expenses: db.collection('expenses'),
    platformFees: db.collection('platformFees'),
    smsLogs: db.collection('smsLogs'),
    integrationLogs: db.collection('integrationLogs'),
    auditLogs: db.collection('auditLogs'),
    settings: db.collection('settings'),
  };
}

/**
 * Tenant-Scoped Collection Proxy
 * Automatically injects `{ tenantId }` into all read and write queries.
 * Prevents any accidental cross-tenant data leaks at the DB driver level.
 */
export function scopeCollection<T extends Document>(
  col: Collection<T>,
  tenantId: string,
  isSuperAdmin = false
) {
  const shouldFilter = !isSuperAdmin || !!tenantId;

  return {
    raw: col,
    collectionName: col.collectionName,

    find(filter: Filter<T> = {}, options?: any) {
      const scopedFilter = shouldFilter
        ? ({ ...filter, tenantId } as Filter<T>)
        : filter;
      return col.find(scopedFilter, options);
    },

    findOne(filter: Filter<T> = {}, options?: any) {
      const scopedFilter = shouldFilter
        ? ({ ...filter, tenantId } as Filter<T>)
        : filter;
      return col.findOne(scopedFilter, options);
    },

    countDocuments(filter: Filter<T> = {}, options?: any) {
      const scopedFilter = shouldFilter
        ? ({ ...filter, tenantId } as Filter<T>)
        : filter;
      return col.countDocuments(scopedFilter, options);
    },

    insertOne(doc: OptionalId<T>, options?: any) {
      const scopedDoc = { ...doc, tenantId } as OptionalId<T>;
      return col.insertOne(scopedDoc as any, options);
    },

    insertMany(docs: OptionalId<T>[], options?: any) {
      const scopedDocs = docs.map((d) => ({ ...d, tenantId })) as OptionalId<T>[];
      return col.insertMany(scopedDocs as any, options);
    },

    updateOne(filter: Filter<T>, update: any, options?: any) {
      const scopedFilter = shouldFilter
        ? ({ ...filter, tenantId } as Filter<T>)
        : filter;
      return col.updateOne(scopedFilter, update, options);
    },

    updateMany(filter: Filter<T>, update: any, options?: any) {
      const scopedFilter = shouldFilter
        ? ({ ...filter, tenantId } as Filter<T>)
        : filter;
      return col.updateMany(scopedFilter, update, options);
    },

    deleteOne(filter: Filter<T>, options?: any) {
      const scopedFilter = shouldFilter
        ? ({ ...filter, tenantId } as Filter<T>)
        : filter;
      return col.deleteOne(scopedFilter, options);
    },

    deleteMany(filter: Filter<T>, options?: any) {
      const scopedFilter = shouldFilter
        ? ({ ...filter, tenantId } as Filter<T>)
        : filter;
      return col.deleteMany(scopedFilter, options);
    },

    aggregate(pipeline: Document[] = [], options?: any) {
      if (shouldFilter) {
        return col.aggregate([{ $match: { tenantId } }, ...pipeline], options);
      }
      return col.aggregate(pipeline, options);
    },
  };
}

/**
 * Tenant-Scoped Database Accessor
 * Enforces authenticated tenant boundary on all business collections.
 */
export async function getTenantCollections(tenantId: string, isSuperAdmin = false) {
  const cols = await getCollections();
  if (!cols) return null;

  return {
    db: cols.db,
    tenants: cols.tenants, // Super admin or tenant itself can query
    subscriptionPlans: cols.subscriptionPlans, // Global catalog
    subscriptions: scopeCollection(cols.subscriptions, tenantId, isSuperAdmin),
    tenantIntegrations: scopeCollection(cols.tenantIntegrations, tenantId, isSuperAdmin),
    users: scopeCollection(cols.users, tenantId, isSuperAdmin),
    customers: scopeCollection(cols.customers, tenantId, isSuperAdmin),
    products: scopeCollection(cols.products, tenantId, isSuperAdmin),
    suppliers: scopeCollection(cols.suppliers, tenantId, isSuperAdmin),
    orders: scopeCollection(cols.orders, tenantId, isSuperAdmin),
    orderItems: scopeCollection(cols.orderItems, tenantId, isSuperAdmin),
    payments: scopeCollection(cols.payments, tenantId, isSuperAdmin),
    inventoryTransactions: scopeCollection(cols.inventoryTransactions, tenantId, isSuperAdmin),
    invoices: scopeCollection(cols.invoices, tenantId, isSuperAdmin),
    warranties: scopeCollection(cols.warranties, tenantId, isSuperAdmin),
    shipments: scopeCollection(cols.shipments, tenantId, isSuperAdmin),
    expenses: scopeCollection(cols.expenses, tenantId, isSuperAdmin),
    platformFees: scopeCollection(cols.platformFees, tenantId, isSuperAdmin),
    smsLogs: scopeCollection(cols.smsLogs, tenantId, isSuperAdmin),
    integrationLogs: scopeCollection(cols.integrationLogs, tenantId, isSuperAdmin),
    auditLogs: scopeCollection(cols.auditLogs, tenantId, isSuperAdmin),
    settings: scopeCollection(cols.settings, tenantId, isSuperAdmin),
  };
}

/**
 * Ensures all required MongoDB indexes across all multi-tenant enterprise collections
 */
export async function ensureDatabaseIndexes(db: Db): Promise<void> {
  try {
    // 0. Tenants & SaaS subscriptions
    const tenantsCol = db.collection('tenants');
    await tenantsCol.createIndex({ tenantId: 1 }, { unique: true });
    await tenantsCol.createIndex({ businessSlug: 1 }, { unique: true });
    await tenantsCol.createIndex({ subscriptionStatus: 1 });

    const subscriptionsCol = db.collection('subscriptions');
    await subscriptionsCol.createIndex({ tenantId: 1 }, { unique: true });

    const integrationsCol = db.collection('tenantIntegrations');
    await integrationsCol.createIndex({ tenantId: 1, provider: 1 }, { unique: true });

    // 1. Orders: multi-tenant compound unique indexes
    const ordersCol = db.collection('orders');
    await ordersCol.createIndex({ tenantId: 1, orderNumber: 1 }, { unique: true });
    await ordersCol.createIndex({ tenantId: 1, externalOrderId: 1, source: 1 });
    await ordersCol.createIndex({ tenantId: 1, 'customer.phone': 1 });
    await ordersCol.createIndex({ tenantId: 1, trackingNumber: 1 });
    await ordersCol.createIndex({ tenantId: 1, waybillNumber: 1 });
    await ordersCol.createIndex({ tenantId: 1, invoiceNumber: 1 });
    await ordersCol.createIndex({ tenantId: 1, createdAt: -1 });
    await ordersCol.createIndex({ tenantId: 1, status: 1 });
    await ordersCol.createIndex({ tenantId: 1, 'items.sku': 1 });

    // 2. Order Items
    const orderItemsCol = db.collection('orderItems');
    await orderItemsCol.createIndex({ tenantId: 1, orderId: 1 });
    await orderItemsCol.createIndex({ tenantId: 1, sku: 1 });

    // 3. Products: multi-tenant unique SKU
    const productsCol = db.collection('products');
    await productsCol.createIndex({ tenantId: 1, sku: 1 }, { unique: true });
    await productsCol.createIndex({ tenantId: 1, barcode: 1 });
    await productsCol.createIndex({ tenantId: 1, category: 1 });
    await productsCol.createIndex({ tenantId: 1, wooCommerceId: 1 });

    // 4. Customers: multi-tenant phone index
    const customersCol = db.collection('customers');
    await customersCol.createIndex({ tenantId: 1, phone: 1 }, { unique: true });
    await customersCol.createIndex({ tenantId: 1, email: 1 });
    await customersCol.createIndex({ tenantId: 1, createdAt: -1 });

    // 5. Suppliers
    const suppliersCol = db.collection('suppliers');
    await suppliersCol.createIndex({ tenantId: 1, name: 1 });
    await suppliersCol.createIndex({ tenantId: 1, phone: 1 });

    // 6. Users: email unique across tenant
    const usersCol = db.collection('users');
    await usersCol.createIndex({ email: 1, tenantId: 1 }, { unique: true });
    await usersCol.createIndex({ tenantId: 1, role: 1 });

    // 7. Warranties: serialNumber, expiryDate, status, customerPhone
    const warrantiesCol = db.collection('warranties');
    await warrantiesCol.createIndex({ tenantId: 1, serialNumber: 1 });
    await warrantiesCol.createIndex({ tenantId: 1, expiryDate: 1 });
    await warrantiesCol.createIndex({ tenantId: 1, status: 1 });
    await warrantiesCol.createIndex({ tenantId: 1, customerPhone: 1 });
    await warrantiesCol.createIndex({ tenantId: 1, orderNumber: 1 });

    // 8. Shipments (Waybills): multi-tenant unique waybillNumber
    const shipmentsCol = db.collection('shipments');
    await shipmentsCol.createIndex({ tenantId: 1, waybillNumber: 1 }, { unique: true });
    await shipmentsCol.createIndex({ tenantId: 1, orderNumber: 1 });
    await shipmentsCol.createIndex({ tenantId: 1, trackingNumber: 1 });
    await shipmentsCol.createIndex({ tenantId: 1, status: 1 });

    // 9. Invoices: multi-tenant unique invoiceNumber
    const invoicesCol = db.collection('invoices');
    await invoicesCol.createIndex({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
    await invoicesCol.createIndex({ tenantId: 1, orderNumber: 1 });
    await invoicesCol.createIndex({ tenantId: 1, issueDate: -1 });

    // 10. Inventory Transactions
    const inventoryCol = db.collection('inventoryTransactions');
    await inventoryCol.createIndex({ tenantId: 1, productId: 1 });
    await inventoryCol.createIndex({ tenantId: 1, type: 1 });
    await inventoryCol.createIndex({ tenantId: 1, createdAt: -1 });

    // 11. Payments
    const paymentsCol = db.collection('payments');
    await paymentsCol.createIndex({ tenantId: 1, orderId: 1 });
    await paymentsCol.createIndex({ tenantId: 1, paymentMethod: 1 });
    await paymentsCol.createIndex({ tenantId: 1, status: 1 });

    // 12. Expenses
    const expensesCol = db.collection('expenses');
    await expensesCol.createIndex({ tenantId: 1, date: -1 });
    await expensesCol.createIndex({ tenantId: 1, category: 1 });

    // 13. Platform Fees
    const platformFeesCol = db.collection('platformFees');
    await platformFeesCol.createIndex({ tenantId: 1, channel: 1 });

    // 14. SMS Logs
    const smsLogsCol = db.collection('smsLogs');
    await smsLogsCol.createIndex({ tenantId: 1, createdAt: -1 });
    await smsLogsCol.createIndex({ tenantId: 1, phone: 1 });
    await smsLogsCol.createIndex({ tenantId: 1, type: 1 });

    // 15. Integration Logs
    const integrationLogsCol = db.collection('integrationLogs');
    await integrationLogsCol.createIndex({ tenantId: 1, createdAt: -1 });
    await integrationLogsCol.createIndex({ tenantId: 1, integration: 1 });

    // 16. Audit Logs
    const auditLogsCol = db.collection('auditLogs');
    await auditLogsCol.createIndex({ tenantId: 1, createdAt: -1 });
    await auditLogsCol.createIndex({ tenantId: 1, userId: 1 });
    await auditLogsCol.createIndex({ tenantId: 1, module: 1 });

    // 17. Settings: multi-tenant key
    const settingsCol = db.collection('settings');
    await settingsCol.createIndex({ tenantId: 1, key: 1 }, { unique: true });
  } catch (error: any) {
    console.warn('[WOWTEK DB] Index setup note:', error.message);
  }
}

/**
 * Seeds initial database with SaaS platform structure, default tenants,
 * subscriptions, plans, integrations, and demo store items.
 */
export async function seedDatabaseIfEmpty(db: Db): Promise<void> {
  try {
    // 1. Subscription Plans
    const plansCol = db.collection('subscriptionPlans');
    const plansCount = await plansCol.countDocuments();
    if (plansCount === 0) {
      await plansCol.insertMany(DEFAULT_SUBSCRIPTION_PLANS as any);
    }

    // 2. Tenants
    const tenantsCol = db.collection('tenants');
    const tenantCount = await tenantsCol.countDocuments();
    if (tenantCount === 0) {
      await tenantsCol.insertMany(DEFAULT_TENANTS as any);
    }

    // 3. Subscriptions
    const subCol = db.collection('subscriptions');
    const subCount = await subCol.countDocuments();
    if (subCount === 0) {
      await subCol.insertMany(DEFAULT_SUBSCRIPTIONS as any);
    }

    // 4. Tenant Integrations
    const intCol = db.collection('tenantIntegrations');
    const intCount = await intCol.countDocuments();
    if (intCount === 0) {
      await intCol.insertMany(DEFAULT_TENANT_INTEGRATIONS as any);
    }

    // 5. Users
    const usersCol = db.collection('users');
    const userCount = await usersCol.countDocuments();
    if (userCount === 0) {
      await usersCol.insertMany(DEFAULT_USERS as any);
    }

    // 6. Products
    const prodCol = db.collection('products');
    const prodCount = await prodCol.countDocuments();
    if (prodCount === 0) {
      await prodCol.insertMany(DEFAULT_PRODUCTS as any);
    }

    // 7. Orders
    const ordersCol = db.collection('orders');
    const ordersCount = await ordersCol.countDocuments();
    if (ordersCount === 0) {
      await ordersCol.insertMany(INITIAL_ORDERS as any);
    }

    // 8. Customers
    const custCol = db.collection('customers');
    if ((await custCol.countDocuments()) === 0) {
      await custCol.insertMany(DEFAULT_CUSTOMERS as any);
    }

    // 9. Suppliers
    const supCol = db.collection('suppliers');
    if ((await supCol.countDocuments()) === 0) {
      await supCol.insertMany(DEFAULT_SUPPLIERS as any);
    }

    // 10. Warranties
    const warCol = db.collection('warranties');
    if ((await warCol.countDocuments()) === 0) {
      await warCol.insertMany(DEFAULT_WARRANTIES as any);
    }

    // 11. Shipments
    const shipCol = db.collection('shipments');
    if ((await shipCol.countDocuments()) === 0) {
      await shipCol.insertMany(DEFAULT_WAYBILLS as any);
    }

    // 12. Settings
    const settingsCol = db.collection('settings');
    const existingSettings = await settingsCol.findOne({
      tenantId: 'tenant_wowtek_lk',
      key: 'business_settings',
    });
    if (!existingSettings) {
      await settingsCol.insertOne({
        tenantId: 'tenant_wowtek_lk',
        key: 'business_settings',
        value: DEFAULT_BUSINESS_SETTINGS,
        updatedAt: new Date().toISOString(),
      });
    }

    const platformFeesCol = db.collection('platformFees');
    if ((await platformFeesCol.countDocuments()) === 0) {
      await platformFeesCol.insertMany(DEFAULT_PLATFORM_COMMISSIONS as any);
    }

    const auditLogsCol = db.collection('auditLogs');
    if ((await auditLogsCol.countDocuments()) === 0) {
      await auditLogsCol.insertMany(INITIAL_AUDIT_LOGS as any);
    }
  } catch (err: any) {
    console.warn('[WOWTEK DB] Seed check skipped:', err.message);
  }
}
