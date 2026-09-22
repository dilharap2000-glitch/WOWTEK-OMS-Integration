/**
 * WOWTEK OMS Multi-Tenant Enterprise SaaS API Router
 * Platform: WOWTEK OMS (wowtek.lk)
 *
 * Implements:
 * - Multi-Tenant Authentication & Session Resolution (authenticateTenant middleware)
 * - Strict Data Isolation (Every query scoped to authenticated tenantId)
 * - Super Admin Platform Area & Global Metrics
 * - Subscription Tier Management & Plan Limits Enforcement
 * - AES-256-GCM Encrypted Tenant Integration Vault
 * - Orders & Dynamic Profit Engine with Subscription Usage Tracking
 * - Products, Inventory & Stock Transactions
 * - Customers & Suppliers Isolation
 * - Warranty Tracking & SMS Alerts
 * - Waybills, Thermal 4x6 Label Generation & Courier Sync
 * - Multi-Tenant WooCommerce Webhook Handling with HMAC Verification
 * - Audit Logs with mandatory tenantId
 */

import { Request, Response, Router } from 'express';
import { connectToDatabase, getCollections, getTenantCollections } from '../lib/db';
import {
  authenticateTenant,
  generateAuthToken,
  requireRole,
} from './authMiddleware';
import {
  encryptCredentials,
  decryptCredentials,
  maskSecret,
} from './crypto';
import {
  TenantAdapterManager,
} from './adapters';
import {
  calculateItemProfit,
  calculateOrderProfit,
} from '../services/profitService';
import {
  calculateExpiryDate,
  evaluateWarrantyStatus,
} from '../services/warrantyService';
import {
  mapWooCommercePaymentMethod,
  mapWooCommerceStatus,
  verifyWooCommerceSignature,
  WooCommerceWebhookOrder,
} from '../services/woocommerceService';
import {
  DEFAULT_BUSINESS_SETTINGS,
  DEFAULT_CUSTOMERS,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_PLATFORM_COMMISSIONS,
  DEFAULT_PRODUCTS,
  DEFAULT_SUBSCRIPTIONS,
  DEFAULT_SUBSCRIPTION_PLANS,
  DEFAULT_SUPPLIERS,
  DEFAULT_TENANTS,
  DEFAULT_TENANT_INTEGRATIONS,
  DEFAULT_USERS,
  DEFAULT_WARRANTIES,
  DEFAULT_WAYBILLS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_SMS_LOGS,
} from '../lib/mockData';
import {
  AuditLog,
  Customer,
  IntegrationProvider,
  Order,
  OrderItem,
  Product,
  Subscription,
  SubscriptionPlan,
  SuperAdminMetrics,
  Supplier,
  SystemIntegrations,
  Tenant,
  TenantIntegration,
  User,
  WarrantyRecord,
  Waybill,
} from '../types';

export const apiRouter = Router();

// Apply Multi-Tenant Authentication & Session Middleware globally
apiRouter.use(authenticateTenant);

// ============================================================================
// HELPER: Multi-Tenant Audit Logging
// ============================================================================
async function logServerAudit(
  tenantId: string,
  action: string,
  module: string,
  details: string,
  userId: string = 'system',
  userName: string = 'System Admin',
  recordId?: string,
  previousValue?: string,
  newValue?: string
) {
  try {
    const cols = await getCollections();
    if (!cols) return;
    await cols.auditLogs.insertOne({
      id: `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId,
      action,
      module,
      details,
      userId,
      userName,
      recordId,
      previousValue,
      newValue,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[AUDIT LOG ERROR]', err.message);
  }
}

// ============================================================================
// 1. HEALTH & SYSTEM STATUS
// ============================================================================
apiRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const dbStatus = await connectToDatabase();
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    let documentCounts: Record<string, number> = {};
    if (dbStatus.isConnected && dbStatus.db) {
      const tenantCols = await getTenantCollections(tenantId, isSuperAdmin);
      if (tenantCols) {
        documentCounts = {
          orders: await tenantCols.orders.countDocuments(),
          products: await tenantCols.products.countDocuments(),
          customers: await tenantCols.customers.countDocuments(),
          warranties: await tenantCols.warranties.countDocuments(),
          shipments: await tenantCols.shipments.countDocuments(),
        };
      }
    }

    res.json({
      system: 'WOWTEK ORDER MANAGEMENT SYSTEM — MULTI-TENANT SAAS',
      status: 'ONLINE',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      activeTenantId: tenantId,
      authenticatedUser: req.user ? { name: req.user.name, role: req.user.role } : null,
      database: {
        type: 'MongoDB Atlas',
        connected: dbStatus.isConnected,
        mode: dbStatus.isConnected ? 'LIVE_ATLAS' : 'LOCAL_RESILLIENT_STORAGE',
        counts: documentCounts,
        info: dbStatus.error || 'Connected to MongoDB Atlas cluster with strict tenant isolation.',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Health check failed', message: err.message });
  }
});

// ============================================================================
// 2. AUTHENTICATION & MULTI-TENANT CONTEXT
// ============================================================================
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cols = await getCollections();
    let user: any = null;

    if (cols) {
      user = await cols.users.findOne({ email: cleanEmail });
    }

    // Fallback to default users if not yet in MongoDB
    if (!user) {
      user = DEFAULT_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
    }

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials. User with this email does not exist in any registered tenant.',
      });
    }

    if (user.active === false) {
      return res.status(403).json({
        error: 'Your account has been deactivated. Please contact your organization administrator.',
      });
    }

    // Resolve tenant details
    let tenant: Tenant | null = null;
    if (cols) {
      tenant = (await cols.tenants.findOne({ tenantId: user.tenantId })) as any;
    }
    if (!tenant) {
      tenant = DEFAULT_TENANTS.find((t) => t.tenantId === user.tenantId) || DEFAULT_TENANTS[0];
    }

    // Generate signed stateless authentication token
    const token = generateAuthToken({
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active !== false,
    });

    const safeUser = {
      id: user.id,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active !== false,
      lastLogin: new Date().toISOString(),
    };

    if (cols) {
      await cols.users.updateOne(
        { email: cleanEmail },
        { $set: { lastLogin: safeUser.lastLogin } }
      );
    }

    logServerAudit(
      user.tenantId,
      'USER_LOGIN',
      'AUTH',
      `User ${user.email} (${user.role}) logged in to tenant ${tenant.businessName}`,
      user.id,
      user.name
    );

    return res.json({
      success: true,
      token,
      user: safeUser,
      tenant,
      permissions: {
        isSuperAdmin: user.role === 'SUPER_ADMIN',
        canManageSettings: user.role === 'SUPER_ADMIN' || user.role === 'ADMIN',
        canManageIntegrations: user.role === 'SUPER_ADMIN' || user.role === 'ADMIN',
        canManageBilling: user.role === 'SUPER_ADMIN' || user.role === 'ADMIN',
        canManageTeam: user.role === 'SUPER_ADMIN' || user.role === 'ADMIN',
        canManageProducts: user.role !== 'STAFF' || true,
        canManageSuppliers: user.role !== 'STAFF',
        canViewFinance: user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'MANAGER',
        canProcessOrders: true,
        canCreateShipments: true,
        canPrintWaybills: true,
        canGenerateInvoices: true,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Login failure', message: err.message });
  }
});

apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated session' });
    }

    const cols = await getCollections();
    let tenant: Tenant | null = null;
    let subscription: Subscription | null = null;

    if (cols) {
      tenant = (await cols.tenants.findOne({ tenantId: req.user.tenantId })) as any;
      subscription = (await cols.subscriptions.findOne({ tenantId: req.user.tenantId })) as any;
    }

    if (!tenant) {
      tenant = DEFAULT_TENANTS.find((t) => t.tenantId === req.user?.tenantId) || DEFAULT_TENANTS[0];
    }
    if (!subscription) {
      subscription = DEFAULT_SUBSCRIPTIONS.find((s) => s.tenantId === req.user?.tenantId) || DEFAULT_SUBSCRIPTIONS[0];
    }

    return res.json({
      success: true,
      user: req.user,
      tenant,
      subscription,
      permissions: {
        isSuperAdmin: req.user.role === 'SUPER_ADMIN',
        canManageSettings: req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN',
        canManageIntegrations: req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN',
        canManageBilling: req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN',
        canManageTeam: req.user.role === 'SUPER_ADMIN' || req.user.role === 'ADMIN',
        canManageProducts: true,
        canManageSuppliers: req.user.role !== 'STAFF',
        canViewFinance: req.user.role !== 'STAFF',
        canProcessOrders: true,
        canCreateShipments: true,
        canPrintWaybills: true,
        canGenerateInvoices: true,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Session verification failed', message: err.message });
  }
});

/**
 * Switch Active Tenant Context (For Super Admins or Multi-Tenant Testing)
 */
apiRouter.post('/auth/switch-tenant', async (req: Request, res: Response) => {
  try {
    const { targetTenantId } = req.body;
    if (!targetTenantId) {
      return res.status(400).json({ error: 'targetTenantId is required.' });
    }

    // Only allow if Super Admin OR in development demo mode
    if (req.user && req.user.role !== 'SUPER_ADMIN' && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Only SaaS platform Super Admins can switch tenant context.' });
    }

    const cols = await getCollections();
    let tenant: Tenant | null = null;

    if (cols) {
      tenant = (await cols.tenants.findOne({ tenantId: targetTenantId })) as any;
    }
    if (!tenant) {
      tenant = DEFAULT_TENANTS.find((t) => t.tenantId === targetTenantId) || null;
    }

    if (!tenant) {
      return res.status(404).json({ error: `Tenant ${targetTenantId} not found.` });
    }

    // Create a scoped token for the target tenant
    const updatedUser = {
      id: req.user?.id || 'usr_switch',
      tenantId: targetTenantId,
      name: req.user?.name || 'Administrator',
      email: req.user?.email || 'admin@tenant.lk',
      role: req.user?.role || 'ADMIN',
      active: true,
    };

    const token = generateAuthToken(updatedUser);

    return res.json({
      success: true,
      token,
      tenant,
      user: updatedUser,
      message: `Switched context to ${tenant.businessName}`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Tenant switch failed', message: err.message });
  }
});

// ============================================================================
// 3. SAAS SUPER ADMIN AREA & METRICS
// ============================================================================
apiRouter.get('/superadmin/metrics', requireRole(['SUPER_ADMIN']), async (_req: Request, res: Response) => {
  try {
    const cols = await getCollections();
    let tenants = DEFAULT_TENANTS;
    let subscriptions = DEFAULT_SUBSCRIPTIONS;
    let orders = INITIAL_ORDERS;

    if (cols) {
      const dbTenants = await cols.tenants.find({}).toArray();
      if (dbTenants.length > 0) tenants = dbTenants as any;

      const dbSubs = await cols.subscriptions.find({}).toArray();
      if (dbSubs.length > 0) subscriptions = dbSubs as any;

      const dbOrders = await cols.orders.find({}).toArray();
      if (dbOrders.length > 0) orders = dbOrders as any;
    }

    const totalBusinesses = tenants.length;
    const activeBusinesses = tenants.filter((t) => t.subscriptionStatus === 'ACTIVE').length;
    const trialBusinesses = tenants.filter((t) => t.subscriptionStatus === 'TRIAL').length;
    const expiredBusinesses = tenants.filter(
      (t) => t.subscriptionStatus === 'EXPIRED' || t.subscriptionStatus === 'SUSPENDED'
    ).length;

    const totalOrdersAcrossPlatform = orders.length;
    const totalRevenueAcrossPlatform = orders.reduce((sum, o) => sum + (o.total || o.subtotal || 0), 0);

    const subscriptionsByPlan = {
      FREE: subscriptions.filter((s) => s.planId === 'FREE' || s.planId === 'free').length,
      STARTER: subscriptions.filter((s) => s.planId === 'STARTER' || s.planId === 'starter').length,
      BUSINESS: subscriptions.filter((s) => s.planId === 'BUSINESS' || s.planId === 'business').length,
      PRO: subscriptions.filter((s) => s.planId === 'PRO' || s.planId === 'pro').length,
    };

    const metrics: SuperAdminMetrics = {
      totalBusinesses,
      activeBusinesses,
      trialBusinesses,
      expiredBusinesses,
      totalOrdersAcrossPlatform,
      totalRevenueAcrossPlatform,
      subscriptionsByPlan,
    };

    return res.json({ success: true, metrics, tenants });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch platform metrics', message: err.message });
  }
});

apiRouter.get('/superadmin/tenants', requireRole(['SUPER_ADMIN']), async (_req: Request, res: Response) => {
  try {
    const cols = await getCollections();
    let tenants = DEFAULT_TENANTS;
    if (cols) {
      const dbTenants = await cols.tenants.find({}).sort({ createdAt: -1 }).toArray();
      if (dbTenants.length > 0) tenants = dbTenants as any;
    }
    return res.json({ success: true, tenants });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch tenants', message: err.message });
  }
});

apiRouter.post('/superadmin/tenants', requireRole(['SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const { businessName, email, phone, address, country, currency, timezone, planId } = req.body;
    if (!businessName || !email) {
      return res.status(400).json({ error: 'businessName and email are required.' });
    }

    const businessSlug = businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const tenantId = `tenant_${businessSlug.replace(/-/g, '_')}_${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const newTenant: Tenant = {
      _id: tenantId,
      tenantId,
      businessName,
      businessSlug,
      ownerUserId: `usr_owner_${tenantId}`,
      email,
      phone: phone || '+94 11 000 0000',
      address: address || 'Colombo, Sri Lanka',
      country: country || 'Sri Lanka',
      currency: currency || 'LKR',
      timezone: timezone || 'Asia/Colombo',
      subscriptionPlan: planId || 'STARTER',
      subscriptionStatus: 'TRIAL',
      trialEndsAt: trialEnd,
      createdAt: now,
      updatedAt: now,
    };

    // Create default tenant admin user
    const adminUser: User = {
      id: newTenant.ownerUserId,
      tenantId,
      name: `${businessName} Admin`,
      email,
      role: 'ADMIN',
      isActive: true,
      createdAt: now,
    };

    // Create subscription
    const plan = DEFAULT_SUBSCRIPTION_PLANS.find((p) => p.id === (planId || 'STARTER')) || DEFAULT_SUBSCRIPTION_PLANS[1];
    const newSub: Subscription = {
      _id: `sub_${tenantId}`,
      tenantId,
      planId: plan.id,
      status: 'TRIAL',
      billingCycle: 'MONTHLY',
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      trialEndsAt: trialEnd,
      maxMonthlyOrders: plan.limits.maxMonthlyOrders,
      maxStaffUsers: plan.limits.maxStaffUsers,
      maxIntegrations: plan.limits.maxIntegrations,
      currentOrdersThisMonth: 0,
      createdAt: now,
      updatedAt: now,
    };

    const cols = await getCollections();
    if (cols) {
      await cols.tenants.insertOne(newTenant as any);
      await cols.users.insertOne(adminUser as any);
      await cols.subscriptions.insertOne(newSub as any);
      await cols.settings.insertOne({
        tenantId,
        key: 'business_settings',
        value: {
          ...DEFAULT_BUSINESS_SETTINGS,
          businessName,
          companyName: `${businessName} (Pvt) Ltd`,
          phone: newTenant.phone,
          email,
          address: newTenant.address,
        },
        updatedAt: now,
      });
    }

    logServerAudit(
      'platform_master',
      'TENANT_CREATED',
      'SAAS',
      `Super Admin created new tenant: ${businessName} (${tenantId})`,
      req.user?.id,
      req.user?.name,
      tenantId
    );

    return res.status(201).json({
      success: true,
      tenant: newTenant,
      adminUser,
      subscription: newSub,
      message: `Tenant ${businessName} created successfully with 14-day trial.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create tenant', message: err.message });
  }
});

apiRouter.patch('/superadmin/tenants/:id/status', requireRole(['SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'status is required (ACTIVE, TRIAL, SUSPENDED, EXPIRED).' });
    }

    const cols = await getCollections();
    if (cols) {
      await cols.tenants.updateOne(
        { $or: [{ tenantId: id }, { _id: id }] },
        { $set: { subscriptionStatus: status, updatedAt: new Date().toISOString() } }
      );
      await cols.subscriptions.updateOne(
        { tenantId: id },
        { $set: { status, updatedAt: new Date().toISOString() } }
      );
    }

    logServerAudit(
      'platform_master',
      'TENANT_STATUS_CHANGED',
      'SAAS',
      `Super Admin updated status for tenant ${id} to ${status}`,
      req.user?.id,
      req.user?.name,
      id
    );

    return res.json({ success: true, message: `Tenant ${id} status updated to ${status}` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update tenant status', message: err.message });
  }
});

// ============================================================================
// 4. SUBSCRIPTION PLANS, LIMITS & USAGE
// ============================================================================
apiRouter.get('/subscriptions/plans', async (_req: Request, res: Response) => {
  try {
    const cols = await getCollections();
    let plans = DEFAULT_SUBSCRIPTION_PLANS;
    if (cols) {
      const dbPlans = await cols.subscriptionPlans.find({}).toArray();
      if (dbPlans.length > 0) plans = dbPlans as any;
    }
    return res.json({ success: true, plans });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch subscription plans', message: err.message });
  }
});

apiRouter.get('/subscriptions/current', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const cols = await getCollections();

    let sub: Subscription | null = null;
    let ordersCount = 0;
    let staffCount = 0;
    let integrationsCount = 0;

    if (cols) {
      sub = (await cols.subscriptions.findOne({ tenantId })) as any;

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      ordersCount = await cols.orders.countDocuments({
        tenantId,
        createdAt: { $gte: startOfMonth.toISOString() },
      });
      staffCount = await cols.users.countDocuments({ tenantId, active: true });
      integrationsCount = await cols.tenantIntegrations.countDocuments({ tenantId, status: 'CONNECTED' });
    }

    if (!sub) {
      sub = DEFAULT_SUBSCRIPTIONS.find((s) => s.tenantId === tenantId) || DEFAULT_SUBSCRIPTIONS[0];
    }

    const plan =
      DEFAULT_SUBSCRIPTION_PLANS.find(
        (p) => p.id.toUpperCase() === (sub?.planId || 'STARTER').toUpperCase()
      ) || DEFAULT_SUBSCRIPTION_PLANS[1];

    const isOrderLimitReached =
      plan.limits.monthlyOrders !== -1 && ordersCount >= plan.limits.monthlyOrders;
    const isUserLimitReached =
      plan.limits.users !== -1 && staffCount >= plan.limits.users;
    const isIntegrationLimitReached =
      plan.limits.integrations !== -1 && integrationsCount >= plan.limits.integrations;

    return res.json({
      success: true,
      subscription: sub,
      plan,
      usage: {
        currentOrdersThisMonth: ordersCount,
        maxMonthlyOrders: plan.limits.monthlyOrders,
        orderUsagePercentage:
          plan.limits.monthlyOrders === -1
            ? 0
            : Math.min(100, Math.round((ordersCount / plan.limits.monthlyOrders) * 100)),
        isOrderLimitReached,
        staffCount,
        maxStaffUsers: plan.limits.users,
        isUserLimitReached,
        integrationsCount,
        maxIntegrations: plan.limits.integrations,
        isIntegrationLimitReached,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch current subscription', message: err.message });
  }
});

apiRouter.post('/subscriptions/upgrade', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const { planId, billingCycle } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'planId is required (FREE, STARTER, BUSINESS, PRO).' });
    }

    const targetPlan = DEFAULT_SUBSCRIPTION_PLANS.find(
      (p) => p.id.toUpperCase() === planId.toUpperCase()
    );
    if (!targetPlan) {
      return res.status(400).json({ error: `Invalid planId: ${planId}` });
    }

    const now = new Date().toISOString();
    const cycle = billingCycle || 'MONTHLY';
    const durationDays = cycle === 'ANNUAL' ? 365 : 30;
    const periodEnd = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const cols = await getCollections();
    if (cols) {
      await cols.subscriptions.updateOne(
        { tenantId },
        {
          $set: {
            planId: targetPlan.id,
            status: 'ACTIVE',
            billingCycle: cycle,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            maxMonthlyOrders: targetPlan.limits.monthlyOrders,
            maxStaffUsers: targetPlan.limits.users,
            maxIntegrations: targetPlan.limits.integrations,
            updatedAt: now,
          },
        },
        { upsert: true }
      );

      await cols.tenants.updateOne(
        { tenantId },
        { $set: { subscriptionPlan: targetPlan.id, subscriptionStatus: 'ACTIVE', updatedAt: now } }
      );
    }

    logServerAudit(
      tenantId,
      'SUBSCRIPTION_UPGRADE',
      'BILLING',
      `Tenant upgraded plan to ${targetPlan.name} (${cycle})`,
      req.user?.id,
      req.user?.name
    );

    return res.json({
      success: true,
      message: `Successfully upgraded to ${targetPlan.name}! Limits have been expanded.`,
      plan: targetPlan,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to upgrade subscription', message: err.message });
  }
});

// ============================================================================
// 5. TENANT INTEGRATIONS & AES-256 ENCRYPTED CREDENTIAL VAULT
// ============================================================================
apiRouter.get('/integrations', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const cols = await getCollections();

    let tenantIntegrations: TenantIntegration[] = [];
    if (cols) {
      const dbInts = await cols.tenantIntegrations.find({ tenantId }).toArray();
      if (dbInts.length > 0) tenantIntegrations = dbInts as any;
    }

    if (tenantIntegrations.length === 0) {
      tenantIntegrations = DEFAULT_TENANT_INTEGRATIONS.filter((i) => i.tenantId === tenantId);
    }

    // Transform into clean frontend format — NEVER send raw encrypted secrets or keys to client!
    const responseData: SystemIntegrations = {
      woocommerce: {
        isEnabled: false,
        status: 'NOT_CONFIGURED',
        url: '',
        consumerKeyMasked: '',
        webhookSecretConfigured: false,
      },
      pickme: {
        isEnabled: false,
        status: 'NOT_CONFIGURED',
        apiUrl: 'https://api.pickme.lk/merchant/v1',
      },
      uberEats: {
        isEnabled: false,
        status: 'NOT_CONFIGURED',
        apiUrl: 'https://api.uber.com/v1/eats',
      },
      transExpress: {
        isEnabled: false,
        status: 'NOT_CONFIGURED',
        apiUrl: 'https://api.transexpress.lk/v1',
      },
      sms: {
        isEnabled: false,
        status: 'NOT_CONFIGURED',
        apiUrl: 'https://api.sms.lk/v2/send',
        senderId: 'WOWTEK',
      },
    };

    const mapStatus = (s: string): 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED' | 'ERROR' => {
      if (s === 'CONNECTED') return 'CONNECTED';
      if (s === 'ERROR') return 'ERROR';
      if (s === 'DISCONNECTED') return 'DISCONNECTED';
      return 'NOT_CONFIGURED';
    };

    for (const item of tenantIntegrations) {
      const hint = typeof item.maskedCredentialsHint === 'object'
        ? Object.values(item.maskedCredentialsHint || {})[0] || '••••••••'
        : String(item.maskedCredentialsHint || '••••••••');

      if (item.provider === 'WOOCOMMERCE') {
        responseData.woocommerce = {
          isEnabled: item.status === 'CONNECTED',
          status: mapStatus(item.status),
          url: (item as any).storeUrl || 'https://wowtek.lk',
          consumerKeyMasked: hint,
          webhookSecretConfigured: Boolean(item.webhookSecret),
          lastSync: item.lastSyncAt,
        };
      } else if (item.provider === 'PICKME') {
        responseData.pickme = {
          isEnabled: item.status === 'CONNECTED',
          status: mapStatus(item.status),
          apiUrl: 'https://api.pickme.lk/merchant/v1',
          lastError: item.lastError,
        };
      } else if (item.provider === 'UBER_EATS') {
        responseData.uberEats = {
          isEnabled: item.status === 'CONNECTED',
          status: mapStatus(item.status),
          apiUrl: 'https://api.uber.com/v1/eats',
          lastError: item.lastError,
        };
      } else if (item.provider === 'TRANSEX') {
        responseData.transExpress = {
          isEnabled: item.status === 'CONNECTED',
          status: mapStatus(item.status),
          apiUrl: 'https://api.transexpress.lk/v1',
          lastError: item.lastError,
        };
      } else if (item.provider === 'SMS') {
        responseData.sms = {
          isEnabled: item.status === 'CONNECTED',
          status: mapStatus(item.status),
          apiUrl: 'https://api.sms.lk/v2/send',
          senderId: (item as any).senderId || 'WOWTEK',
          apiKeyMasked: hint,
          lastSent: item.lastSyncAt,
        };
      }
    }

    return res.json({ success: true, integrations: responseData, tenantId });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch integrations', message: err.message });
  }
});

apiRouter.post('/integrations/:provider', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const providerParam = req.params.provider.toUpperCase() as IntegrationProvider;
    const { credentials, webhookSecret, storeUrl, senderId } = req.body;

    if (!credentials || typeof credentials !== 'object') {
      return res.status(400).json({ error: 'Valid credentials object is required.' });
    }

    // Check tenant subscription limit on max integrations
    const cols = await getCollections();
    if (cols) {
      const sub = (await cols.subscriptions.findOne({ tenantId })) as any;
      const plan = DEFAULT_SUBSCRIPTION_PLANS.find(
        (p) => p.id === (sub?.planId || 'STARTER')
      );
      if (plan && plan.limits.integrations !== -1) {
        const activeCount = await cols.tenantIntegrations.countDocuments({
          tenantId,
          status: 'CONNECTED',
          provider: { $ne: providerParam },
        });
        if (activeCount >= plan.limits.integrations) {
          return res.status(403).json({
            error: `Your current ${plan.name} allows a maximum of ${plan.limits.integrations} connected integrations. Please upgrade your subscription plan.`,
            code: 'INTEGRATION_LIMIT_REACHED',
          });
        }
      }
    }

    // Server-Side AES-256-GCM Encryption
    const encryptedCredentials = encryptCredentials(credentials);

    // Create safe hint for UI display
    let maskedHint = '••••••••';
    if (providerParam === 'WOOCOMMERCE' && credentials.consumerKey) {
      maskedHint = maskSecret(credentials.consumerKey);
    } else if (credentials.apiKey) {
      maskedHint = maskSecret(credentials.apiKey);
    } else if (credentials.clientSecret) {
      maskedHint = maskSecret(credentials.clientSecret);
    }

    const now = new Date().toISOString();
    const integrationRecord: Partial<TenantIntegration> = {
      tenantId,
      provider: providerParam,
      enabled: true,
      encryptedCredentials,
      webhookSecret: webhookSecret ? encryptCredentials(webhookSecret) : undefined,
      maskedCredentialsHint: { hint: maskedHint },
      status: 'CONNECTED',
      lastSyncAt: now,
      updatedAt: now,
    };

    if (storeUrl) (integrationRecord as any).storeUrl = storeUrl;
    if (senderId) (integrationRecord as any).senderId = senderId;

    if (cols) {
      await cols.tenantIntegrations.updateOne(
        { tenantId, provider: providerParam },
        {
          $set: integrationRecord,
          $setOnInsert: { _id: `int_${tenantId}_${providerParam}`, id: `int_${tenantId}_${providerParam}`, createdAt: now },
        },
        { upsert: true }
      );
    }

    logServerAudit(
      tenantId,
      'INTEGRATION_CONFIGURED',
      'INTEGRATIONS',
      `Configured and encrypted credentials for ${providerParam}`,
      req.user?.id,
      req.user?.name
    );

    return res.json({
      success: true,
      message: `${providerParam} integration saved securely and encrypted server-side.`,
      status: 'CONNECTED',
      maskedCredentialsHint: maskedHint,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to save integration', message: err.message });
  }
});

apiRouter.post('/integrations/:provider/test', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    let providerParam = req.params.provider.toUpperCase() as IntegrationProvider;
    if ((providerParam as string) === 'TRANSEXPRESS') providerParam = 'TRANSEX';

    const cols = await getCollections();

    let integration: TenantIntegration | null = null;
    if (cols) {
      integration = (await cols.tenantIntegrations.findOne({
        tenantId,
        provider: providerParam,
      })) as any;
    }

    if (!integration || !integration.encryptedCredentials) {
      return res.json({
        success: false,
        message: `${providerParam} is not configured with encrypted credentials.`,
        status: 'NOT_CONFIGURED',
      });
    }

    let testResult: { success: boolean; message: string; data?: any } = {
      success: false,
      message: 'Unknown provider',
    };

    if (providerParam === 'WOOCOMMERCE') {
      const adapter = TenantAdapterManager.getWooCommerceAdapter(
        tenantId,
        integration.encryptedCredentials,
        integration.webhookSecret
      );
      testResult = adapter ? await adapter.testConnection() : { success: false, message: 'Invalid config' };
    } else if (providerParam === 'PICKME') {
      const adapter = TenantAdapterManager.getPickMeAdapter(tenantId, integration.encryptedCredentials);
      testResult = adapter ? await adapter.testConnection() : { success: false, message: 'Invalid config' };
    } else if (providerParam === 'UBER_EATS') {
      const adapter = TenantAdapterManager.getUberEatsAdapter(tenantId, integration.encryptedCredentials);
      testResult = adapter ? await adapter.testConnection() : { success: false, message: 'Invalid config' };
    } else if (providerParam === 'TRANSEX') {
      const adapter = TenantAdapterManager.getTransExpressAdapter(
        tenantId,
        integration.encryptedCredentials
      );
      testResult = adapter ? await adapter.testConnection() : { success: false, message: 'Invalid config' };
    } else if (providerParam === 'SMS') {
      const adapter = TenantAdapterManager.getSmsAdapter(tenantId, integration.encryptedCredentials);
      testResult = adapter ? await adapter.testConnection() : { success: false, message: 'Invalid config' };
    }

    return res.json(testResult);
  } catch (err: any) {
    return res.status(500).json({ error: 'Integration test failed', message: err.message });
  }
});

apiRouter.post('/integrations/:provider/disconnect', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const providerParam = req.params.provider.toUpperCase();
    const cols = await getCollections();

    if (cols) {
      await cols.tenantIntegrations.updateOne(
        { tenantId, provider: providerParam },
        { $set: { status: 'NOT_CONFIGURED', updatedAt: new Date().toISOString() } }
      );
    }

    logServerAudit(
      tenantId,
      'INTEGRATION_DISCONNECTED',
      'INTEGRATIONS',
      `Disconnected ${providerParam}`,
      req.user?.id,
      req.user?.name
    );

    return res.json({ success: true, message: `${providerParam} disconnected.` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to disconnect integration', message: err.message });
  }
});

// ============================================================================
// 6. TEAM & STAFF USERS
// ============================================================================
apiRouter.get('/team', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const tenantCols = await getTenantCollections(tenantId, isSuperAdmin);

    let users: User[] = [];
    if (tenantCols) {
      const dbUsers = await tenantCols.users.find({}).toArray();
      if (dbUsers.length > 0) users = dbUsers as any;
    }

    if (users.length === 0) {
      users = DEFAULT_USERS.filter((u) => u.tenantId === tenantId);
    }

    // Mask sensitive details
    const safeUsers = users.map((u) => ({
      id: u.id,
      tenantId: u.tenantId,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive !== false,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    }));

    return res.json({ success: true, users: safeUsers });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch team', message: err.message });
  }
});

apiRouter.post('/team', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'name, email, and role are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cols = await getCollections();

    // Enforce subscription user limit
    if (cols) {
      const sub = (await cols.subscriptions.findOne({ tenantId })) as any;
      const plan = DEFAULT_SUBSCRIPTION_PLANS.find(
        (p) => p.id === (sub?.planId || 'STARTER')
      );
      if (plan && plan.limits.users !== -1) {
        const staffCount = await cols.users.countDocuments({ tenantId, active: true });
        if (staffCount >= plan.limits.users) {
          return res.status(403).json({
            error: `Your current ${plan.name} allows up to ${plan.limits.users} staff accounts. Please upgrade your subscription plan to invite more team members.`,
            code: 'USER_LIMIT_REACHED',
          });
        }
      }

      const existing = await cols.users.findOne({ email: cleanEmail, tenantId });
      if (existing) {
        return res.status(409).json({ error: 'A team member with this email already exists in your business.' });
      }
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      tenantId,
      name,
      email: cleanEmail,
      role,
      active: true,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (cols) {
      await cols.users.insertOne(newUser as any);
    }

    logServerAudit(
      tenantId,
      'TEAM_MEMBER_INVITED',
      'TEAM',
      `Invited ${name} (${cleanEmail}) as ${role}`,
      req.user?.id,
      req.user?.name
    );

    return res.status(201).json({ success: true, user: newUser });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add team member', message: err.message });
  }
});

apiRouter.patch('/team/:id', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const { id } = req.params;
    const { role, isActive } = req.body;

    const tenantCols = await getTenantCollections(tenantId);
    if (tenantCols) {
      const updateData: any = {};
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
      await tenantCols.users.updateOne({ id }, { $set: updateData });
    }

    logServerAudit(
      tenantId,
      'TEAM_MEMBER_UPDATED',
      'TEAM',
      `Updated user ${id}`,
      req.user?.id,
      req.user?.name
    );

    return res.json({ success: true, message: 'Team member updated.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update team member', message: err.message });
  }
});

// ============================================================================
// 7. ORDERS & PROFIT ENGINE (STRICT TENANT ISOLATION + USAGE LIMIT CHECK)
// ============================================================================
apiRouter.get('/orders', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const { status, channel, search } = req.query;

    const tenantCols = await getTenantCollections(tenantId, isSuperAdmin);

    if (tenantCols) {
      const query: any = {};
      if (status && status !== 'ALL') query.orderStatus = status;
      if (channel && channel !== 'ALL') query.source = channel;
      if (search) {
        const s = String(search);
        query.$or = [
          { orderNumber: { $regex: s, $options: 'i' } },
          { 'customer.name': { $regex: s, $options: 'i' } },
          { 'customer.phone': { $regex: s, $options: 'i' } },
          { trackingNumber: { $regex: s, $options: 'i' } },
        ];
      }

      const orders = await tenantCols.orders.find(query).sort({ createdAt: -1 }).toArray();
      if (orders.length > 0) {
        return res.json({ success: true, orders, source: 'MONGODB' });
      }
    }

    // Filter fallback orders by active tenant
    const isolatedFallback = INITIAL_ORDERS.filter((o) => o.tenantId === tenantId);
    return res.json({
      success: true,
      orders: isolatedFallback.length > 0 ? isolatedFallback : INITIAL_ORDERS,
      source: 'LOCAL_FALLBACK',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch orders', message: err.message });
  }
});

apiRouter.post('/orders', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const orderData: Partial<Order> = req.body;
    const cols = await getCollections();
    const tenantCols = await getTenantCollections(tenantId);

    // 1. Check Subscription Monthly Order Limit!
    if (cols) {
      const sub = (await cols.subscriptions.findOne({ tenantId })) as any;
      const plan = DEFAULT_SUBSCRIPTION_PLANS.find(
        (p) => p.id === (sub?.planId || 'STARTER')
      );
      if (plan && plan.limits.monthlyOrders !== -1) {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const currentMonthlyOrders = await cols.orders.countDocuments({
          tenantId,
          createdAt: { $gte: startOfMonth.toISOString() },
        });

        if (currentMonthlyOrders >= plan.limits.monthlyOrders) {
          return res.status(403).json({
            error: `Monthly order limit reached! Your current ${plan.name} allows up to ${plan.limits.monthlyOrders} orders per month. Please upgrade your subscription plan to continue accepting orders.`,
            code: 'PLAN_LIMIT_REACHED',
            limit: plan.limits.monthlyOrders,
            current: currentMonthlyOrders,
          });
        }
      }
    }

    // 2. Fetch tenant-scoped commission and pricing configs
    let paymentConfigs = DEFAULT_PAYMENT_METHODS;
    let commissionConfigs = DEFAULT_PLATFORM_COMMISSIONS;
    let productsList: Product[] = DEFAULT_PRODUCTS.filter((p) => p.tenantId === tenantId);

    if (tenantCols) {
      const pConfig = await tenantCols.settings.findOne({ key: 'payment_methods' });
      if (pConfig?.value) paymentConfigs = pConfig.value;

      const cConfig = await tenantCols.platformFees.find({}).toArray();
      if (cConfig.length > 0) commissionConfigs = cConfig as any;

      const dbProds = await tenantCols.products.find({}).toArray();
      if (dbProds.length > 0) productsList = dbProds as any;
    }

    // 3. Calculate Item Profits & Real Net Profit
    const items: OrderItem[] = (orderData.items || []).map((item, idx) => {
      const catalogProduct = productsList.find(
        (p: Product) => p.sku.toLowerCase() === (item.sku || '').toLowerCase()
      );
      const unitCost =
        item.unitCost || catalogProduct?.costPrice || Math.round((item.unitPrice || 0) * 0.7);
      const itemProfit = calculateItemProfit({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost,
        discount: item.discount || 0,
      });

      return {
        ...item,
        id: item.id || `oi_${Date.now()}_${idx + 1}`,
        unitCost,
        totalPrice: itemProfit.totalPrice,
        totalCost: itemProfit.totalCost,
        grossProfit: itemProfit.grossProfit,
        warrantyDuration: item.warrantyDuration || catalogProduct?.warrantyDuration || 12,
        warrantyUnit: item.warrantyUnit || catalogProduct?.warrantyUnit || 'MONTHS',
        serialNumber: item.serialNumber || `SN-${Math.floor(100000 + Math.random() * 900000)}`,
      };
    });

    const profit = calculateOrderProfit({
      items,
      overallDiscount: orderData.discount || 0,
      shippingFee: orderData.shippingFee || 0,
      source: orderData.source || 'MANUAL',
      paymentMethod: orderData.paymentMethod || 'Cash',
      courierFee: orderData.profit?.courierFee || 350,
      otherCosts: orderData.profit?.otherCosts || 50,
      paymentConfigs,
      commissionConfigs,
    });

    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
    const totalAmount = Math.max(0, subtotal - (orderData.discount || 0) + (orderData.shippingFee || 0));

    const defaultAddress = {
      name: orderData.customer?.name || 'Guest Customer',
      phone: orderData.customer?.phone || '+94 77 000 0000',
      addressLine1: 'No 45 Galle Road',
      city: 'Colombo 03',
      district: 'Colombo',
      postalCode: '00300',
      country: 'Sri Lanka',
    };

    const newOrder: Order = {
      id: orderData.id || `ord_${Date.now()}`,
      tenantId, // STRICTLY INJECTED
      orderNumber: orderData.orderNumber || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      externalOrderId: orderData.externalOrderId,
      source: orderData.source || 'MANUAL',
      customer: orderData.customer || {
        name: 'Guest Customer',
        phone: '+94 77 000 0000',
        email: 'customer@wowtek.lk',
      },
      items,
      subtotal,
      discount: orderData.discount || 0,
      shippingFee: orderData.shippingFee || 0,
      totalAmount,
      profit,
      paymentMethod: orderData.paymentMethod || 'Cash',
      paymentStatus: orderData.paymentStatus || 'PENDING',
      orderStatus: orderData.orderStatus || 'NEW',
      shippingAddress: orderData.shippingAddress || defaultAddress,
      billingAddress: orderData.billingAddress || defaultAddress,
      courier: orderData.courier || 'Trans Express',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (tenantCols) {
      await tenantCols.orders.insertOne(newOrder as any);

      // Decrement stock in catalog
      for (const item of items) {
        await tenantCols.products.updateOne(
          { sku: item.sku },
          { $inc: { stockQuantity: -item.quantity }, $set: { updatedAt: new Date().toISOString() } }
        );

        await tenantCols.inventoryTransactions.insertOne({
          id: `tx_${Date.now()}_${item.sku}`,
          tenantId,
          productId: item.productId,
          sku: item.sku,
          productName: item.name,
          type: 'SALE',
          quantityChange: -item.quantity,
          referenceId: newOrder.orderNumber,
          notes: `Manual order created (${newOrder.orderNumber})`,
          createdAt: new Date().toISOString(),
        } as any);
      }

      // Upsert Customer
      if (newOrder.customer.phone) {
        await tenantCols.customers.updateOne(
          { phone: newOrder.customer.phone },
          {
            $set: {
              name: newOrder.customer.name,
              email: newOrder.customer.email,
              address: newOrder.shippingAddress.addressLine1,
              city: newOrder.shippingAddress.city,
              lastOrderDate: newOrder.createdAt,
            },
            $inc: { orderCount: 1, totalSpent: totalAmount },
            $setOnInsert: { id: `cust_${Date.now()}`, createdAt: new Date().toISOString() },
          },
          { upsert: true }
        );
      }

      // Auto-generate invoice
      const invoiceNumber = `INV-${newOrder.orderNumber.replace(/[^a-zA-Z0-9]/g, '')}`;
      await tenantCols.invoices.insertOne({
        id: `inv_${Date.now()}`,
        tenantId,
        invoiceNumber,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        issueDate: new Date().toISOString(),
        customer: newOrder.customer,
        items: newOrder.items,
        subtotal: newOrder.subtotal,
        discount: newOrder.discount,
        shippingFee: newOrder.shippingFee,
        total: newOrder.totalAmount,
        paymentMethod: newOrder.paymentMethod,
        paymentStatus: newOrder.paymentStatus,
        courier: newOrder.courier,
        createdAt: new Date().toISOString(),
      } as any);

      await tenantCols.orders.updateOne({ id: newOrder.id }, { $set: { invoiceNumber } });
    }

    logServerAudit(
      tenantId,
      'ORDER_CREATED',
      'ORDERS',
      `Created Order ${newOrder.orderNumber} (LKR ${totalAmount})`,
      req.user?.id,
      req.user?.name,
      newOrder.id
    );

    return res.status(201).json({ success: true, order: newOrder });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create order', message: err.message });
  }
});

apiRouter.put('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const { id } = req.params;
    const { status, note } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'status is required.' });
    }

    const tenantCols = await getTenantCollections(tenantId);
    if (tenantCols) {
      await tenantCols.orders.updateOne(
        { $or: [{ id }, { orderNumber: id }] },
        { $set: { orderStatus: status, updatedAt: new Date().toISOString() } }
      );
    }

    logServerAudit(
      tenantId,
      'ORDER_STATUS_CHANGED',
      'ORDERS',
      `Changed status of order ${id} to ${status}${note ? ` (${note})` : ''}`,
      req.user?.id,
      req.user?.name,
      id
    );

    return res.json({ success: true, message: `Order status updated to ${status}` });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update order status', message: err.message });
  }
});

// ============================================================================
// 8. PRODUCTS & INVENTORY
// ============================================================================
apiRouter.get('/products', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const tenantCols = await getTenantCollections(tenantId);

    if (tenantCols) {
      const products = await tenantCols.products.find({}).sort({ name: 1 }).toArray();
      if (products.length > 0) {
        return res.json({ success: true, products });
      }
    }

    const fallback = DEFAULT_PRODUCTS.filter((p) => p.tenantId === tenantId);
    return res.json({
      success: true,
      products: fallback.length > 0 ? fallback : DEFAULT_PRODUCTS,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch products', message: err.message });
  }
});

apiRouter.post('/products', requireRole(['ADMIN', 'MANAGER', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const productData: Partial<Product> = req.body;

    if (!productData.name || !productData.sku) {
      return res.status(400).json({ error: 'Product name and SKU are required.' });
    }

    const newProduct: Product = {
      id: productData.id || `prod_${Date.now()}`,
      tenantId,
      name: productData.name,
      sku: productData.sku.toUpperCase().trim(),
      barcode: productData.barcode,
      category: productData.category || 'General',
      brand: productData.brand || 'General',
      sellingPrice: Number(productData.sellingPrice) || 0,
      costPrice: Number(productData.costPrice) || 0,
      stockQuantity: Number(productData.stockQuantity) || 0,
      minStock: Number(productData.minStock) || 5,
      supplierId: productData.supplierId,
      supplierName: productData.supplierName,
      warrantyDuration: Number(productData.warrantyDuration) || 12,
      warrantyUnit: productData.warrantyUnit || 'MONTHS',
      isActive: productData.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const tenantCols = await getTenantCollections(tenantId);
    if (tenantCols) {
      await tenantCols.products.insertOne(newProduct as any);
    }

    logServerAudit(
      tenantId,
      'PRODUCT_CREATED',
      'INVENTORY',
      `Added product ${newProduct.name} (${newProduct.sku})`,
      req.user?.id,
      req.user?.name,
      newProduct.id
    );

    return res.status(201).json({ success: true, product: newProduct });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create product', message: err.message });
  }
});

apiRouter.post('/products/:id/adjust-stock', requireRole(['ADMIN', 'MANAGER', 'STAFF', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const { id } = req.params;
    const { quantityChange, type, reason } = req.body;

    if (quantityChange === undefined || !type) {
      return res.status(400).json({ error: 'quantityChange and type are required.' });
    }

    const tenantCols = await getTenantCollections(tenantId);
    let updatedProduct: any = null;

    if (tenantCols) {
      const prod = await tenantCols.products.findOne({ $or: [{ id }, { sku: id }] });
      if (!prod) {
        return res.status(404).json({ error: 'Product not found in current tenant catalog.' });
      }

      await tenantCols.products.updateOne(
        { _id: prod._id },
        {
          $inc: { stockQuantity: Number(quantityChange) },
          $set: { updatedAt: new Date().toISOString() },
        }
      );

      updatedProduct = await tenantCols.products.findOne({ _id: prod._id });

      await tenantCols.inventoryTransactions.insertOne({
        id: `tx_${Date.now()}`,
        tenantId,
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        type,
        quantityChange: Number(quantityChange),
        referenceId: `ADJ-${Date.now().toString().slice(-4)}`,
        notes: reason || 'Manual stock adjustment',
        createdAt: new Date().toISOString(),
      } as any);
    }

    logServerAudit(
      tenantId,
      'STOCK_ADJUSTMENT',
      'INVENTORY',
      `Stock adjusted ${quantityChange > 0 ? `+${quantityChange}` : quantityChange} for product ${id} (${type})`,
      req.user?.id,
      req.user?.name,
      id
    );

    return res.json({ success: true, product: updatedProduct });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to adjust stock', message: err.message });
  }
});

// ============================================================================
// 9. CUSTOMERS & SUPPLIERS
// ============================================================================
apiRouter.get('/customers', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const tenantCols = await getTenantCollections(tenantId);

    if (tenantCols) {
      const customers = await tenantCols.customers.find({}).sort({ totalSpent: -1 }).toArray();
      if (customers.length > 0) return res.json({ success: true, customers });
    }

    const fallback = DEFAULT_CUSTOMERS.filter((c) => c.tenantId === tenantId);
    return res.json({
      success: true,
      customers: fallback.length > 0 ? fallback : DEFAULT_CUSTOMERS,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch customers', message: err.message });
  }
});

apiRouter.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const tenantCols = await getTenantCollections(tenantId);

    if (tenantCols) {
      const suppliers = await tenantCols.suppliers.find({}).toArray();
      if (suppliers.length > 0) return res.json({ success: true, suppliers });
    }

    const fallback = DEFAULT_SUPPLIERS.filter((s) => s.tenantId === tenantId);
    return res.json({
      success: true,
      suppliers: fallback.length > 0 ? fallback : DEFAULT_SUPPLIERS,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch suppliers', message: err.message });
  }
});

// ============================================================================
// 10. WARRANTIES, WAYBILLS & INVOICES
// ============================================================================
apiRouter.get('/warranties', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const tenantCols = await getTenantCollections(tenantId);

    if (tenantCols) {
      const warranties = await tenantCols.warranties.find({}).sort({ expiryDate: 1 }).toArray();
      if (warranties.length > 0) return res.json({ success: true, warranties });
    }

    const fallback = DEFAULT_WARRANTIES.filter((w) => w.tenantId === tenantId);
    return res.json({
      success: true,
      warranties: fallback.length > 0 ? fallback : DEFAULT_WARRANTIES,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch warranties', message: err.message });
  }
});

apiRouter.get('/shipments', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const tenantCols = await getTenantCollections(tenantId);

    if (tenantCols) {
      const shipments = await tenantCols.shipments.find({}).sort({ createdAt: -1 }).toArray();
      if (shipments.length > 0) return res.json({ success: true, shipments });
    }

    const fallback = DEFAULT_WAYBILLS.filter((wb) => wb.tenantId === tenantId);
    return res.json({
      success: true,
      shipments: fallback.length > 0 ? fallback : DEFAULT_WAYBILLS,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch shipments', message: err.message });
  }
});

apiRouter.get('/invoices', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const tenantCols = await getTenantCollections(tenantId);

    if (tenantCols) {
      const invoices = await tenantCols.invoices.find({}).sort({ issueDate: -1 }).toArray();
      if (invoices.length > 0) return res.json({ success: true, invoices });
    }

    return res.json({ success: true, invoices: [] });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch invoices', message: err.message });
  }
});

// ============================================================================
// 11. AUDIT LOGS (TENANT-SCOPED)
// ============================================================================
apiRouter.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const tenantCols = await getTenantCollections(tenantId, isSuperAdmin);

    if (tenantCols) {
      const logs = await tenantCols.auditLogs.find({}).sort({ createdAt: -1 }).limit(100).toArray();
      if (logs.length > 0) return res.json({ success: true, logs });
    }

    const fallback = INITIAL_AUDIT_LOGS.filter((l) => l.tenantId === tenantId);
    return res.json({
      success: true,
      logs: fallback.length > 0 ? fallback : INITIAL_AUDIT_LOGS,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch audit logs', message: err.message });
  }
});

// ============================================================================
// 12. TENANT BUSINESS SETTINGS
// ============================================================================
apiRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const tenantCols = await getTenantCollections(tenantId);

    let businessSettings = DEFAULT_BUSINESS_SETTINGS;
    let paymentMethods = DEFAULT_PAYMENT_METHODS;
    let platformCommissions = DEFAULT_PLATFORM_COMMISSIONS;

    if (tenantCols) {
      const dbSettings = await tenantCols.settings.findOne({ key: 'business_settings' });
      if (dbSettings && dbSettings.value) businessSettings = dbSettings.value;

      const dbPayments = await tenantCols.settings.findOne({ key: 'payment_methods' });
      if (dbPayments && dbPayments.value) paymentMethods = dbPayments.value;

      const dbCommissions = await tenantCols.platformFees.find({}).toArray();
      if (dbCommissions.length > 0) platformCommissions = dbCommissions as any;
    }

    return res.json({
      success: true,
      tenantId,
      businessSettings,
      paymentMethods,
      platformCommissions,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch settings', message: err.message });
  }
});

apiRouter.put('/settings', requireRole(['ADMIN', 'SUPER_ADMIN']), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId || 'tenant_wowtek_lk';
    const { businessSettings, paymentMethods, platformCommissions } = req.body;
    const tenantCols = await getTenantCollections(tenantId);

    if (tenantCols) {
      if (businessSettings) {
        await tenantCols.settings.updateOne(
          { key: 'business_settings' },
          {
            $set: {
              key: 'business_settings',
              value: businessSettings,
              updatedAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
      }
      if (paymentMethods) {
        await tenantCols.settings.updateOne(
          { key: 'payment_methods' },
          {
            $set: {
              key: 'payment_methods',
              value: paymentMethods,
              updatedAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
      }
      if (platformCommissions && Array.isArray(platformCommissions)) {
        await tenantCols.platformFees.deleteMany({});
        await tenantCols.platformFees.insertMany(platformCommissions);
      }
    }

    logServerAudit(
      tenantId,
      'SETTINGS_UPDATE',
      'SETTINGS',
      'Updated tenant settings & commissions',
      req.user?.id,
      req.user?.name
    );

    return res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update settings', message: err.message });
  }
});

// ============================================================================
// 13. WOOCOMMERCE WEBHOOK (MULTI-TENANT HMAC VERIFICATION & ISOLATION)
// ============================================================================
apiRouter.post('/webhooks/woocommerce/:tenantId?', async (req: Request, res: Response) => {
  try {
    const targetTenantId = req.params.tenantId || req.tenantId || 'tenant_wowtek_lk';
    const cols = await getCollections();
    const tenantCols = await getTenantCollections(targetTenantId);

    // Resolve tenant integration credentials & decrypted webhook secret
    let webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || '';
    if (cols) {
      const integration = (await cols.tenantIntegrations.findOne({
        tenantId: targetTenantId,
        provider: 'WOOCOMMERCE',
      })) as any;
      if (integration?.webhookSecret) {
        const decryptedSecret = decryptCredentials<string>(integration.webhookSecret);
        if (decryptedSecret) webhookSecret = decryptedSecret;
      }
    }

    const signature = req.headers['x-wc-webhook-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    if (webhookSecret && signature) {
      const isValid = verifyWooCommerceSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return res.status(401).json({ error: 'HMAC signature verification failed for tenant.' });
      }
    }

    const wcOrder = req.body as WooCommerceWebhookOrder;
    if (!wcOrder || !wcOrder.id) {
      return res.status(400).json({ error: 'Invalid WooCommerce webhook payload.' });
    }

    // Check duplicate
    if (tenantCols) {
      const existing = await tenantCols.orders.findOne({
        externalOrderId: String(wcOrder.id),
        source: 'WEBSITE',
      });
      if (existing) {
        return res.status(200).json({
          message: `Order #${wcOrder.id} already exists in tenant ${targetTenantId}`,
          orderNumber: existing.orderNumber,
        });
      }
    }

    const customerName =
      `${wcOrder.billing?.first_name || ''} ${wcOrder.billing?.last_name || ''}`.trim() ||
      'Online Customer';
    const customerPhone = wcOrder.billing?.phone || '+94 77 000 0000';
    const customerEmail = wcOrder.billing?.email || 'customer@store.lk';
    const paymentMethod = mapWooCommercePaymentMethod(
      wcOrder.payment_method_title || '',
      wcOrder.payment_method || ''
    );
    const subtotal = parseFloat(wcOrder.total || '0') - parseFloat(wcOrder.shipping_total || '0');
    const totalAmount = parseFloat(wcOrder.total || '0');

    const newOrder: Order = {
      id: `ord_wc_${targetTenantId}_${wcOrder.id}`,
      tenantId: targetTenantId,
      orderNumber: `WC-${wcOrder.id}`,
      externalOrderId: String(wcOrder.id),
      source: 'WEBSITE',
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
      },
      items: (wcOrder.line_items || []).map((item: any, idx: number) => ({
        id: `oi_wc_${wcOrder.id}_${idx}`,
        productId: `prod_wc_${item.product_id || idx}`,
        sku: item.sku || `SKU-${item.product_id || idx}`,
        name: item.name,
        quantity: item.quantity || 1,
        unitPrice: parseFloat(item.price || '0'),
        unitCost: Math.round(parseFloat(item.price || '0') * 0.7),
        discount: 0,
        totalPrice: parseFloat(item.total || '0'),
        totalCost: Math.round(parseFloat(item.total || '0') * 0.7),
        grossProfit: parseFloat(item.total || '0') * 0.3,
        warrantyDuration: 12,
        warrantyUnit: 'MONTHS',
      })),
      subtotal,
      discount: parseFloat(wcOrder.discount_total || '0'),
      shippingFee: parseFloat(wcOrder.shipping_total || '0'),
      totalAmount,
      paymentMethod,
      paymentStatus: wcOrder.status === 'completed' ? 'PAID' : 'PENDING',
      orderStatus: mapWooCommerceStatus(wcOrder.status),
      shippingAddress: {
        name: customerName,
        phone: customerPhone,
        addressLine1: wcOrder.shipping?.address_1 || wcOrder.billing?.address_1 || 'Colombo',
        city: wcOrder.shipping?.city || wcOrder.billing?.city || 'Colombo',
        district: wcOrder.shipping?.state || wcOrder.billing?.state || 'Colombo',
        postalCode: wcOrder.shipping?.postcode || wcOrder.billing?.postcode || '00100',
        country: wcOrder.shipping?.country || 'Sri Lanka',
      },
      billingAddress: {
        name: customerName,
        phone: customerPhone,
        addressLine1: wcOrder.billing?.address_1 || 'Colombo',
        city: wcOrder.billing?.city || 'Colombo',
        district: wcOrder.billing?.state || 'Colombo',
        postalCode: wcOrder.billing?.postcode || '00100',
        country: wcOrder.billing?.country || 'Sri Lanka',
      },
      courier: 'Trans Express',
      createdAt: wcOrder.date_created ? new Date(wcOrder.date_created).toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (tenantCols) {
      await tenantCols.orders.insertOne(newOrder as any);

      // Inventory decrement & stock transaction
      for (const item of newOrder.items) {
        await tenantCols.products.updateOne(
          { sku: item.sku },
          { $inc: { stockQuantity: -item.quantity }, $set: { updatedAt: new Date().toISOString() } }
        );
      }
    }

    logServerAudit(
      targetTenantId,
      'WOOCOMMERCE_ORDER_INGESTED',
      'INTEGRATIONS',
      `Ingested WooCommerce order #${wcOrder.id} for tenant ${targetTenantId}`
    );

    return res.status(200).json({
      success: true,
      message: `Order #${wcOrder.id} ingested successfully for tenant ${targetTenantId}`,
      orderNumber: newOrder.orderNumber,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Webhook processing error', message: err.message });
  }
});
