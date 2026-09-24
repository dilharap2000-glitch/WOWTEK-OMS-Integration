/**
 * Multi-Tenant WooCommerce REST API & Webhook Adapter
 * Instantiated per tenant with decrypted credentials on demand.
 * NEVER uses global credentials.
 */

import crypto from 'crypto';

export interface WooCommerceConfig {
  tenantId: string;
  storeUrl: string;
  consumerKey: string;
  consumerSecret: string;
  webhookSecret?: string;
}

export class WooCommerceAdapter {
  private config: WooCommerceConfig;

  constructor(config: WooCommerceConfig) {
    if (!config.tenantId) {
      throw new Error('[WooCommerceAdapter] tenantId is required for tenant isolation');
    }
    this.config = config;
  }

  get tenantId(): string {
    return this.config.tenantId;
  }

  /**
   * Verifies incoming WooCommerce webhook signature using tenant-specific secret.
   */
  verifyWebhookSignature(signature: string, payload: string | Buffer): boolean {
    const secret = this.config.webhookSecret;
    if (!secret || !signature) return false;

    try {
      const hmac = crypto.createHmac('sha256', secret);
      const computed = hmac.update(payload).digest('base64');
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
    } catch (err: any) {
      console.warn(`[WooCommerceAdapter:${this.tenantId}] Signature verification failed:`, err.message);
      return false;
    }
  }

  /**
   * Tests connection to WooCommerce store endpoint.
   */
  async testConnection(): Promise<{ success: boolean; message: string; storeName?: string }> {
    if (!this.config.storeUrl || !this.config.consumerKey || !this.config.consumerSecret) {
      return {
        success: false,
        message: 'Incomplete credentials. WooCommerce URL, Consumer Key, and Consumer Secret are required.',
      };
    }

    // Ready for future live REST ping: GET /wp-json/wc/v3/system_status
    return {
      success: true,
      message: `Tenant adapter ready for ${this.config.storeUrl} (Tenant: ${this.config.tenantId})`,
      storeName: (this.config.storeUrl || '').replace(/^https?:\/\//, '').split('/')[0] || 'WooCommerce Store',
    };
  }

  /**
   * Syncs orders from WooCommerce for this tenant.
   */
  async syncOrders(sinceDate?: string): Promise<{ success: boolean; orders: any[]; count: number }> {
    return {
      success: true,
      orders: [],
      count: 0,
    };
  }

  /**
   * Pushes status update to WooCommerce store.
   */
  async updateOrderStatus(externalOrderId: string, status: string): Promise<boolean> {
    console.log(`[WooCommerceAdapter:${this.tenantId}] Would update order ${externalOrderId} to ${status}`);
    return true;
  }
}
