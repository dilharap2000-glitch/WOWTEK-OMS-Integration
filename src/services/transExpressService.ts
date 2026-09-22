/**
 * WOWTEK Trans Express Sri Lanka Courier Adapter
 * Business: WOWTEK (wowtek.lk)
 *
 * Implements shipment generation, waybill retrieval, tracking,
 * and delivery status updates for Trans Express courier services.
 */

import { Order, Waybill } from '../types';

export interface TransExpressCredentials {
  apiUrl?: string;
  apiKey?: string;
  apiSecret?: string;
  accountId?: string;
}

export interface TransExpressShipmentRequest {
  orderId: string;
  orderNumber: string;
  source?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  district?: string;
  codAmount: number;
  itemDescription: string;
  weightKg?: number;
  specialInstructions?: string;
}

export interface TransExpressShipmentResponse {
  success: boolean;
  isConfigured: boolean;
  message: string;
  trackingNumber?: string;
  waybillNumber?: string;
  trackingUrl?: string;
  error?: string;
}

export class TransExpressServiceAdapter {
  private apiUrl: string;
  private apiKey: string;
  private apiSecret: string;
  private accountId: string;

  constructor(creds?: TransExpressCredentials) {
    this.apiUrl = creds?.apiUrl || process.env.TRANSEX_API_URL || 'https://api.transexpress.lk/v1';
    this.apiKey = creds?.apiKey || process.env.TRANSEX_API_KEY || '';
    this.apiSecret = creds?.apiSecret || process.env.TRANSEX_API_SECRET || '';
    this.accountId = creds?.accountId || process.env.TRANSEX_ACCOUNT_ID || '';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public getStatusDescription(): string {
    if (!this.isConfigured()) {
      return 'Trans Express integration not configured. Awaiting official credentials from Trans Express Logistics.';
    }
    return `Connected to Trans Express API (${this.apiUrl})`;
  }

  /**
   * Creates a formal shipment consignment in Trans Express
   * STRICT BUSINESS RULE: Trans Express shipments can ONLY be created for WEBSITE / WOOCOMMERCE orders.
   */
  public async createShipment(req: TransExpressShipmentRequest): Promise<TransExpressShipmentResponse> {
    if (req.source && req.source !== 'WEBSITE') {
      return {
        success: false,
        isConfigured: true,
        message: `Trans Express shipment creation rejected. Shipments can only be created for WEBSITE / WooCommerce orders. Delivery for ${req.source} is handled by the platform.`,
        error: `INVALID_SOURCE: ${req.source}`,
      };
    }

    if (!this.isConfigured()) {
      // In development or when credentials are not configured, return clear warning response
      return {
        success: false,
        isConfigured: false,
        message: 'Trans Express integration not configured.',
        error: 'Trans Express API credentials (TRANSEX_API_KEY) are missing in environment variables.',
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/shipments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TransEx-Key': this.apiKey,
          'X-TransEx-Secret': this.apiSecret,
          'X-Account-Id': this.accountId,
        },
        body: JSON.stringify({
          reference: req.orderNumber,
          recipient: {
            name: req.customerName,
            phone: req.customerPhone,
            address: req.deliveryAddress,
            city: req.city,
            district: req.district,
          },
          package: {
            description: req.itemDescription,
            cod_amount: req.codAmount,
            weight_kg: req.weightKg || 0.5,
            remarks: req.specialInstructions || 'Handle with care - Electronics',
          },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        throw new Error(`Trans Express API responded with HTTP status ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        isConfigured: true,
        message: 'Shipment created successfully with Trans Express.',
        trackingNumber: data.tracking_number,
        waybillNumber: data.waybill_number,
        trackingUrl: data.tracking_url || `https://transexpress.lk/track/${data.tracking_number}`,
      };
    } catch (err: any) {
      return {
        success: false,
        isConfigured: true,
        message: 'Trans Express shipment creation failed.',
        error: err.message,
      };
    }
  }

  /**
   * Queries tracking status for a tracking / waybill number
   */
  public async trackShipment(trackingNumber: string): Promise<{
    success: boolean;
    status?: string;
    currentLocation?: string;
    events?: any[];
    error?: string;
  }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Trans Express integration not configured.',
      };
    }

    try {
      const response = await fetch(`${this.apiUrl}/shipments/${trackingNumber}/track`, {
        headers: {
          'X-TransEx-Key': this.apiKey,
          'X-Account-Id': this.accountId,
        },
      });

      if (!response.ok) {
        throw new Error(`Tracking request returned status ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        status: data.status,
        currentLocation: data.location,
        events: data.history || [],
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
      };
    }
  }
}
