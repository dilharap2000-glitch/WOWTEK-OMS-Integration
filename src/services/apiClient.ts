/**
 * WOWTEK OMS — Multi-Tenant Client-Side API Service
 * Business: WOWTEK Multi-Tenant SaaS (wowtek.lk)
 *
 * Provides typed, error-handled HTTP communication with server-side API endpoints (/api/*).
 * Automatically manages Bearer auth token and tenant isolation context.
 * Never imports MongoDB, server credentials, or secrets into client code.
 */

import {
  Customer,
  Order,
  Product,
  Supplier,
  WarrantyRecord,
  Waybill,
  User,
  Invoice,
  BusinessSettings,
  PaymentMethodConfig,
  PlatformCommissionConfig,
  AuditLog,
  SMSLog,
  Tenant,
  Subscription,
  SubscriptionPlan,
  SuperAdminMetrics,
  SystemIntegrations,
  IntegrationProvider,
  TransExpressProvince,
  TransExpressDistrict,
  TransExpressCity,
} from '../types';

export interface HealthResponse {
  system: string;
  status: string;
  version: string;
  timestamp: string;
  activeTenantId: string;
  authenticatedUser: { name: string; role: string } | null;
  database: {
    type: string;
    connected: boolean;
    mode: 'LIVE_ATLAS' | 'LOCAL_RESILLIENT_STORAGE';
    counts?: Record<string, number>;
    info?: string;
  };
}

export interface SubscriptionUsageResponse {
  success: boolean;
  subscription: Subscription;
  plan: SubscriptionPlan;
  usage: {
    currentOrdersThisMonth: number;
    maxMonthlyOrders: number;
    orderUsagePercentage: number;
    isOrderLimitReached: boolean;
    staffCount: number;
    maxStaffUsers: number;
    isUserLimitReached: boolean;
    integrationsCount: number;
    maxIntegrations: number;
    isIntegrationLimitReached: boolean;
  };
}

class APIClient {
  private baseUrl = '/api';
  private tokenKey = 'wowtek_oms_token';

  public getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch {
      return null;
    }
  }

  public setToken(token: string | null) {
    try {
      if (token) {
        localStorage.setItem(this.tokenKey, token);
      } else {
        localStorage.removeItem(this.tokenKey);
      }
    } catch {
      // ignore
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string; code?: string }> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errorBody.error || errorBody.message || `HTTP ${res.status}: ${res.statusText}`,
          code: errorBody.code,
        };
      }

      const json = await res.json();
      return { success: true, data: json };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network request failed. Operating in tenant offline mode.',
      };
    }
  }

  // Health
  async getHealth(): Promise<HealthResponse | null> {
    const res = await this.request<HealthResponse>('/health');
    return res.success && res.data ? res.data : null;
  }

  // Auth & Session
  async login(email: string): Promise<{
    success: boolean;
    user?: User;
    tenant?: Tenant;
    token?: string;
    permissions?: any;
    error?: string;
  }> {
    const res = await this.request<{
      success: boolean;
      user: User;
      tenant: Tenant;
      token: string;
      permissions: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });

    if (res.success && res.data) {
      this.setToken(res.data.token);
      return {
        success: true,
        user: res.data.user,
        tenant: res.data.tenant,
        token: res.data.token,
        permissions: res.data.permissions,
      };
    }
    return { success: false, error: res.error };
  }

  async getMe(): Promise<{
    success: boolean;
    user?: User;
    tenant?: Tenant;
    subscription?: Subscription;
    permissions?: any;
    error?: string;
  }> {
    const res = await this.request<{
      success: boolean;
      user: User;
      tenant: Tenant;
      subscription: Subscription;
      permissions: any;
    }>('/auth/me');

    if (res.success && res.data) {
      return {
        success: true,
        user: res.data.user,
        tenant: res.data.tenant,
        subscription: res.data.subscription,
        permissions: res.data.permissions,
      };
    }
    return { success: false, error: res.error };
  }

  async switchTenant(targetTenantId: string): Promise<{
    success: boolean;
    tenant?: Tenant;
    user?: User;
    token?: string;
    error?: string;
  }> {
    const res = await this.request<{
      success: boolean;
      tenant: Tenant;
      user: User;
      token: string;
    }>('/auth/switch-tenant', {
      method: 'POST',
      body: JSON.stringify({ targetTenantId }),
    });

    if (res.success && res.data) {
      this.setToken(res.data.token);
      return {
        success: true,
        tenant: res.data.tenant,
        user: res.data.user,
        token: res.data.token,
      };
    }
    return { success: false, error: res.error };
  }

  async logout() {
    this.setToken(null);
  }

  // Super Admin Platform Area
  async getSuperAdminMetrics(): Promise<{
    metrics: SuperAdminMetrics;
    tenants: Tenant[];
  } | null> {
    const res = await this.request<{
      success: boolean;
      metrics: SuperAdminMetrics;
      tenants: Tenant[];
    }>('/superadmin/metrics');
    return res.success && res.data ? { metrics: res.data.metrics, tenants: res.data.tenants } : null;
  }

  async getSuperAdminTenants(): Promise<Tenant[]> {
    const res = await this.request<{ success: boolean; tenants: Tenant[] }>('/superadmin/tenants');
    return res.success && res.data?.tenants ? res.data.tenants : [];
  }

  async createTenant(data: {
    businessName: string;
    email: string;
    phone?: string;
    address?: string;
    currency?: string;
    planId?: string;
  }): Promise<{ success: boolean; tenant?: Tenant; error?: string }> {
    const res = await this.request<{ success: boolean; tenant: Tenant }>('/superadmin/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) return { success: true, tenant: res.data.tenant };
    return { success: false, error: res.error };
  }

  async updateTenantStatus(id: string, status: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/superadmin/tenants/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.success;
  }

  // Subscriptions & Usage
  async getCurrentSubscription(): Promise<SubscriptionUsageResponse | null> {
    const res = await this.request<SubscriptionUsageResponse>('/subscriptions/current');
    return res.success && res.data ? res.data : null;
  }

  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const res = await this.request<{ success: boolean; plans: SubscriptionPlan[] }>('/subscriptions/plans');
    return res.success && res.data?.plans ? res.data.plans : [];
  }

  async upgradeSubscription(planId: string, billingCycle: 'MONTHLY' | 'ANNUAL' = 'MONTHLY'): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const res = await this.request<{ success: boolean; message: string }>('/subscriptions/upgrade', {
      method: 'POST',
      body: JSON.stringify({ planId, billingCycle }),
    });
    if (res.success && res.data) return { success: true, message: res.data.message };
    return { success: false, error: res.error };
  }

  // Integrations & Encryption
  async getTenantIntegrations(): Promise<SystemIntegrations | null> {
    const res = await this.request<{ success: boolean; integrations: SystemIntegrations }>('/integrations');
    return res.success && res.data?.integrations ? res.data.integrations : null;
  }

  async saveTenantIntegration(
    provider: IntegrationProvider,
    payload: {
      credentials: Record<string, any>;
      webhookSecret?: string;
      storeUrl?: string;
      senderId?: string;
    }
  ): Promise<{ success: boolean; message?: string; maskedCredentialsHint?: string; error?: string }> {
    const res = await this.request<{
      success: boolean;
      message: string;
      status: string;
      maskedCredentialsHint: string;
    }>(`/integrations/${provider.toLowerCase()}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.success && res.data) {
      return {
        success: true,
        message: res.data.message,
        maskedCredentialsHint: res.data.maskedCredentialsHint,
      };
    }
    return { success: false, error: res.error };
  }

  async testTenantIntegration(provider: IntegrationProvider): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    const res = await this.request<{ success: boolean; message: string; data?: any }>(
      `/integrations/${provider.toLowerCase()}/test`,
      { method: 'POST' }
    );
    if (res.success && res.data) return res.data;
    return { success: false, message: res.error || 'Connection test failed' };
  }

  async disconnectTenantIntegration(provider: IntegrationProvider): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(
      `/integrations/${provider.toLowerCase()}/disconnect`,
      { method: 'POST' }
    );
    return res.success;
  }

  // Team & Staff
  async getTeam(): Promise<User[]> {
    const res = await this.request<{ success: boolean; users: User[] }>('/team');
    return res.success && res.data?.users ? res.data.users : [];
  }

  async addTeamMember(data: { name: string; email: string; role: string }): Promise<{
    success: boolean;
    user?: User;
    error?: string;
    code?: string;
  }> {
    const res = await this.request<{ success: boolean; user: User }>('/team', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success && res.data) return { success: true, user: res.data.user };
    return { success: false, error: res.error, code: res.code };
  }

  async updateTeamMember(id: string, data: { role?: string; isActive?: boolean }): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/team/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.success;
  }

  // Orders
  async getOrders(filters?: { status?: string; channel?: string; search?: string }): Promise<{ orders: Order[]; source: string } | null> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.channel) params.set('channel', filters.channel);
    if (filters?.search) params.set('search', filters.search);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request<{ success: boolean; orders: Order[]; source: string }>(`/orders${queryStr}`);
    if (res.success && res.data) {
      return { orders: res.data.orders, source: res.data.source };
    }
    return null;
  }

  async createOrder(orderData: Partial<Order>): Promise<{
    success: boolean;
    order?: Order;
    error?: string;
    code?: string;
  }> {
    const res = await this.request<{ success: boolean; order: Order }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    if (res.success && res.data) {
      return { success: true, order: res.data.order };
    }
    return { success: false, error: res.error, code: res.code };
  }

  async updateOrderStatus(
    orderId: string,
    status: Order['orderStatus'],
    note?: string
  ): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note }),
    });
    return res.success;
  }

  // Products
  async getProducts(): Promise<Product[] | null> {
    const res = await this.request<{ success: boolean; products: Product[] }>('/products');
    if (res.success && res.data?.products) return res.data.products;
    return null;
  }

  async createProduct(productData: Partial<Product>): Promise<{ success: boolean; product?: Product; error?: string }> {
    const res = await this.request<{ success: boolean; product: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    if (res.success && res.data) return { success: true, product: res.data.product };
    return { success: false, error: res.error };
  }

  async adjustStock(productId: string, quantityChange: number, type: string, reason?: string) {
    const res = await this.request<{ success: boolean; product: Product }>(`/products/${productId}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ quantityChange, type, reason }),
    });
    return res.success && res.data?.product ? res.data.product : null;
  }

  // Customers & Suppliers
  async getCustomers(): Promise<Customer[]> {
    const res = await this.request<{ success: boolean; customers: Customer[] }>('/customers');
    return res.success && res.data?.customers ? res.data.customers : [];
  }

  async getSuppliers(): Promise<Supplier[]> {
    const res = await this.request<{ success: boolean; suppliers: Supplier[] }>('/suppliers');
    return res.success && res.data?.suppliers ? res.data.suppliers : [];
  }

  // Warranties & Shipments
  async getWarranties(): Promise<WarrantyRecord[]> {
    const res = await this.request<{ success: boolean; warranties: WarrantyRecord[] }>('/warranties');
    return res.success && res.data?.warranties ? res.data.warranties : [];
  }

  async getShipments(): Promise<Waybill[]> {
    const res = await this.request<{ success: boolean; shipments: Waybill[] }>('/shipments');
    return res.success && res.data?.shipments ? res.data.shipments : [];
  }

  // Trans Express Logistics API Methods
  async createTransExpressWaybill(params: {
    orderId: string;
    cityId?: number;
    note?: string;
    phone2?: string;
  }): Promise<{
    success: boolean;
    alreadyExists?: boolean;
    waybill?: Waybill;
    waybillId?: string;
    waybillNumber?: string;
    trackingNumber?: string;
    trackingUrl?: string;
    orderStatus?: string;
    message?: string;
    error?: string;
  }> {
    const res = await this.request<{
      success: boolean;
      alreadyExists?: boolean;
      waybill?: Waybill;
      waybillId?: string;
      waybillNumber?: string;
      trackingNumber?: string;
      trackingUrl?: string;
      orderStatus?: string;
      message?: string;
      error?: string;
    }>('/integrations/trans-express/waybill', {
      method: 'POST',
      body: JSON.stringify(params),
    });

    if (res.success && res.data) {
      return res.data;
    }
    return {
      success: false,
      error: res.error || 'Failed to create Trans Express waybill',
    };
  }

  async getTransExpressProvinces(): Promise<TransExpressProvince[]> {
    const res = await this.request<{ success: boolean; provinces: TransExpressProvince[] }>(
      '/integrations/trans-express/provinces'
    );
    return res.success && res.data?.provinces ? res.data.provinces : [];
  }

  async getTransExpressDistricts(provinceId: number): Promise<TransExpressDistrict[]> {
    const res = await this.request<{ success: boolean; districts: TransExpressDistrict[] }>(
      `/integrations/trans-express/districts?province_id=${provinceId}`
    );
    return res.success && res.data?.districts ? res.data.districts : [];
  }

  async getTransExpressCities(districtId: number): Promise<TransExpressCity[]> {
    const res = await this.request<{ success: boolean; cities: TransExpressCity[] }>(
      `/integrations/trans-express/cities?district_id=${districtId}`
    );
    return res.success && res.data?.cities ? res.data.cities : [];
  }

  async testTransExpress(): Promise<{ success: boolean; message: string; provincesCount?: number }> {
    const res = await this.request<{ success: boolean; message: string; provincesCount?: number }>(
      '/integrations/trans-express/test',
      { method: 'POST' }
    );
    return res.success && res.data ? res.data : { success: false, message: res.error || 'Test failed' };
  }

  async testWooCommerce(): Promise<{
    success: boolean;
    status: 'SUCCESS' | 'FAILED';
    httpStatus?: number;
    message: string;
    result?: string;
    ordersCount: number;
    totalOrders?: number;
  }> {
    const res = await this.request<{
      success: boolean;
      status: 'SUCCESS' | 'FAILED';
      httpStatus?: number;
      message: string;
      result?: string;
      ordersCount: number;
      totalOrders?: number;
    }>('/integrations/woocommerce/test', { method: 'POST' });

    if (res.data) {
      return res.data;
    }
    return {
      success: false,
      status: 'FAILED',
      httpStatus: 500,
      message: res.error || 'WooCommerce test failed',
      ordersCount: 0,
    };
  }

  async getWooCommerceOrders(params?: { per_page?: number; page?: number; status?: string }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.per_page) query.set('per_page', String(params.per_page));
    if (params?.page) query.set('page', String(params.page));
    if (params?.status) query.set('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';

    const res = await this.request<{ success: boolean; orders: any[] }>(`/integrations/woocommerce/orders${qs}`);
    return res.success && res.data?.orders ? res.data.orders : [];
  }

  async trackTransExpress(orderNoOrWaybill: string): Promise<any> {
    const res = await this.request<{ success: boolean; tracking: any }>(
      `/integrations/trans-express/track?order_no=${encodeURIComponent(orderNoOrWaybill)}`
    );
    return res.success && res.data ? res.data.tracking : null;
  }

  async getInvoices(): Promise<Invoice[]> {
    const res = await this.request<{ success: boolean; invoices: Invoice[] }>('/invoices');
    return res.success && res.data?.invoices ? res.data.invoices : [];
  }

  // Settings
  async getSettings(): Promise<{
    businessSettings: BusinessSettings;
    paymentMethods: PaymentMethodConfig[];
    platformCommissions: PlatformCommissionConfig[];
  } | null> {
    const res = await this.request<{
      success: boolean;
      businessSettings: BusinessSettings;
      paymentMethods: PaymentMethodConfig[];
      platformCommissions: PlatformCommissionConfig[];
    }>('/settings');
    if (res.success && res.data) {
      return {
        businessSettings: res.data.businessSettings,
        paymentMethods: res.data.paymentMethods,
        platformCommissions: res.data.platformCommissions,
      };
    }
    return null;
  }

  async updateSettings(payload: {
    businessSettings?: BusinessSettings;
    paymentMethods?: PaymentMethodConfig[];
    platformCommissions?: PlatformCommissionConfig[];
  }): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.success;
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await this.request<{ success: boolean; logs: AuditLog[] }>('/audit-logs');
    return res.success && res.data?.logs ? res.data.logs : [];
  }
}

export const apiClient = new APIClient();
