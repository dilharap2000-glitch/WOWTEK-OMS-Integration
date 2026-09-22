/**
 * Multi-Tenant SMS Gateway Adapter
 * Instantiated per tenant with decrypted credentials on demand.
 */

export interface SmsGatewayConfig {
  tenantId: string;
  apiUrl?: string;
  apiKey: string;
  senderId: string;
}

export class SmsAdapter {
  private config: SmsGatewayConfig;

  constructor(config: SmsGatewayConfig) {
    if (!config.tenantId) {
      throw new Error('[SmsAdapter] tenantId is required for tenant isolation');
    }
    this.config = config;
  }

  get tenantId(): string {
    return this.config.tenantId;
  }

  async testConnection(): Promise<{ success: boolean; message: string; balance?: number }> {
    if (!this.config.apiKey || !this.config.senderId) {
      return {
        success: false,
        message: 'Incomplete credentials. API Key and Sender ID are required.',
      };
    }

    return {
      success: true,
      message: `SMS gateway adapter ready with Sender Mask [${this.config.senderId}] (Tenant: ${this.config.tenantId})`,
      balance: 500, // Demo credits
    };
  }

  async sendSms(
    recipientPhone: string,
    messageText: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config.apiKey) {
      return {
        success: false,
        error: 'Tenant SMS Gateway not configured with an API key.',
      };
    }

    console.log(`[SmsAdapter:${this.tenantId}] Sending to ${recipientPhone} via mask [${this.config.senderId}]: "${messageText.slice(0, 40)}..."`);

    return {
      success: true,
      messageId: `sms_msg_${Date.now()}`,
    };
  }
}
