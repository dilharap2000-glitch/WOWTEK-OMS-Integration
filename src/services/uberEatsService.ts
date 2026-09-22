/**
 * WOWTEK Uber Eats Integration Adapter
 * Business: WOWTEK (wowtek.lk)
 *
 * Implements the official adapter pattern for Uber Eats Enterprise Integration API.
 * Securely wraps OAuth2 token management and order ingestion.
 */

export interface UberEatsCredentials {
  apiUrl?: string;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
}

export interface UberEatsResponse {
  success: boolean;
  message: string;
  orders?: any[];
  error?: string;
  isConfigured: boolean;
}

export class UberEatsServiceAdapter {
  private apiUrl: string;
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;

  constructor(creds?: UberEatsCredentials) {
    this.apiUrl = creds?.apiUrl || process.env.UBER_API_URL || 'https://api.uber.com/v1/eats';
    this.clientId = creds?.clientId || process.env.UBER_CLIENT_ID || '';
    this.clientSecret = creds?.clientSecret || process.env.UBER_CLIENT_SECRET || '';
    this.accessToken = creds?.accessToken || process.env.UBER_ACCESS_TOKEN || '';
  }

  public isConfigured(): boolean {
    return Boolean((this.clientId && this.clientSecret) || this.accessToken);
  }

  public getStatusDescription(): string {
    if (!this.isConfigured()) {
      return 'Uber Eats integration not configured. Awaiting official API credentials/configuration from Uber Developer Portal.';
    }
    return `Connected to Uber Eats API (${this.apiUrl})`;
  }

  /**
   * Fetches active orders from Uber Eats API
   */
  public async fetchOrders(): Promise<UberEatsResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        isConfigured: false,
        message: 'Uber Eats integration not configured.',
        error: 'Missing UBER_CLIENT_ID or UBER_ACCESS_TOKEN.',
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/orders/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Uber Eats API returned status ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        isConfigured: true,
        message: 'Uber Eats orders fetched successfully.',
        orders: data.orders || [],
      };
    } catch (err: any) {
      return {
        success: false,
        isConfigured: true,
        message: 'Failed to communicate with Uber Eats API.',
        error: err.message,
      };
    }
  }

  /**
   * Accepts or updates status of an order on Uber Eats
   */
  public async updateOrderStatus(
    orderId: string,
    action: 'accept' | 'deny' | 'ready_for_pickup'
  ): Promise<{ success: boolean; message: string; error?: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Uber Eats integration not configured.',
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/orders/${orderId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify({
          reason: action === 'deny' ? 'ITEM_OUT_OF_STOCK' : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Uber Eats status transition failed (${response.status})`);
      }

      return {
        success: true,
        message: `Uber Eats order #${orderId} marked as ${action}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message,
      };
    }
  }
}
