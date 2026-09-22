/**
 * Multi-Tenant PickMe Merchant & Courier API Adapter
 * Instantiated per tenant with decrypted credentials on demand.
 */

export interface PickMeConfig {
  tenantId: string;
  merchantId: string;
  apiKey: string;
  apiSecret?: string;
  webhookSecret?: string;
}

export class PickMeAdapter {
  private config: PickMeConfig;

  constructor(config: PickMeConfig) {
    if (!config.tenantId) {
      throw new Error('[PickMeAdapter] tenantId is required for tenant isolation');
    }
    this.config = config;
  }

  get tenantId(): string {
    return this.config.tenantId;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.merchantId || !this.config.apiKey) {
      return {
        success: false,
        message: 'Incomplete credentials. Merchant ID and API Key are required.',
      };
    }

    return {
      success: true,
      message: `PickMe Merchant adapter configured for merchant ${this.config.merchantId} (Tenant: ${this.config.tenantId})`,
    };
  }

  async syncActiveOrders(): Promise<{ success: boolean; orders: any[]; count: number }> {
    return { success: true, orders: [], count: 0 };
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    console.log(`[PickMeAdapter:${this.tenantId}] Would notify PickMe of status ${status} for ${orderId}`);
    return true;
  }
}
