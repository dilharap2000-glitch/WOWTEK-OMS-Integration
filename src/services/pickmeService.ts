/**
 * WOWTEK PickMe Food & Flash Courier Integration Adapter
 * Business: WOWTEK (wowtek.lk)
 *
 * Implements the official adapter pattern for PickMe Sri Lanka Partner API.
 * Safely guards against missing production credentials with descriptive status states.
 */

export interface PickMeCredentials {
  apiUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
}

export interface PickMeOrderResponse {
  success: boolean;
  message: string;
  orders?: any[];
  error?: string;
  isConfigured: boolean;
}

export class PickMeServiceAdapter {
  private apiUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private merchantId: string;

  constructor(creds?: PickMeCredentials) {
    this.apiUrl = creds?.apiUrl || process.env.PICKME_API_URL || '';
    this.apiKey = creds?.apiKey || process.env.PICKME_API_KEY || '';
    this.apiSecret = creds?.apiSecret || process.env.PICKME_API_SECRET || '';
    this.merchantId = creds?.merchantId || process.env.PICKME_MERCHANT_ID || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getStatusDescription(): string {
    if (!this.isConfigured()) {
      return 'PickMe integration not configured. Awaiting official API credentials/configuration from PickMe Merchant Portal.';
    }
    return `Connected to PickMe API (${this.apiUrl || 'https://api.pickme.lk/merchant/v1'})`;
  }

  /**
   * Fetches active orders from PickMe API
   */
  public async fetchOrders(): Promise<PickMeOrderResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        isConfigured: false,
        message: 'PickMe integration not configured.',
        error: 'Missing PICKME_API_KEY or PICKME_API_SECRET.',
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/orders/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-PickMe-Key': this.apiKey,
          'X-PickMe-Secret': this.apiSecret,
          'X-Merchant-ID': this.merchantId,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`PickMe API responded with HTTP status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        isConfigured: true,
        message: 'PickMe orders fetched successfully.',
        orders: data.orders || [],
      };
    } catch (err: any) {
      return {
        success: false,
        isConfigured: true,
        message: 'Failed to communicate with PickMe API.',
        error: err.message,
      };
    }
  }

  /**
   * Updates order status on PickMe platform (e.g. ACCEPTED, READY_FOR_PICKUP, DISPATCHED)
   */
  public async updateOrderStatus(
    orderId: string,
    status: 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'CANCELLED'
  ): Promise<{ success: boolean; message: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'PickMe integration not configured.',
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/orders/${orderId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PickMe-Key': this.apiKey,
          'X-PickMe-Secret': this.apiSecret,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Status update failed: ${response.status}`);
      }

      return { success: true, message: `PickMe order #${orderId} status updated to ${status}.` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
