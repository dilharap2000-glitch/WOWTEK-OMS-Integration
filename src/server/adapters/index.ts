/**
 * Multi-Tenant Integration Adapter Factory
 * Dynamically resolves decrypted credentials for the active tenant
 */

import { WooCommerceAdapter, WooCommerceConfig } from './WooCommerceAdapter';
import { PickMeAdapter, PickMeConfig } from './PickMeAdapter';
import { UberEatsAdapter, UberEatsConfig } from './UberEatsAdapter';
import { TransExpressAdapter, TransExpressConfig } from './TransExpressAdapter';
import { SmsAdapter, SmsGatewayConfig } from './SmsAdapter';
import { decryptCredentials } from '../crypto';

export {
  WooCommerceAdapter,
  PickMeAdapter,
  UberEatsAdapter,
  TransExpressAdapter,
  SmsAdapter,
};

export class TenantAdapterManager {
  /**
   * Builds an active WooCommerceAdapter using server-side environment variables
   * (WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, WOOCOMMERCE_CONSUMER_SECRET)
   * or encrypted database integration record.
   */
  static getWooCommerceAdapter(tenantId: string, encryptedCredentials?: string, webhookSecret?: string): WooCommerceAdapter {
    const creds = encryptedCredentials ? decryptCredentials<WooCommerceConfig>(encryptedCredentials) : null;

    return new WooCommerceAdapter({
      tenantId,
      storeUrl: creds?.storeUrl || process.env.WOOCOMMERCE_URL || 'https://wowtek.lk',
      consumerKey: creds?.consumerKey || process.env.WOOCOMMERCE_CONSUMER_KEY || '',
      consumerSecret: creds?.consumerSecret || process.env.WOOCOMMERCE_CONSUMER_SECRET || '',
      webhookSecret: creds?.webhookSecret || process.env.WOOCOMMERCE_WEBHOOK_SECRET || webhookSecret || '',
    });
  }

  /**
   * Builds an active PickMeAdapter
   */
  static getPickMeAdapter(tenantId: string, encryptedCredentials?: string): PickMeAdapter | null {
    if (!encryptedCredentials) return null;
    const creds = decryptCredentials<PickMeConfig>(encryptedCredentials);
    if (!creds) return null;

    return new PickMeAdapter({
      tenantId,
      merchantId: creds.merchantId,
      apiKey: creds.apiKey,
      apiSecret: creds.apiSecret,
    });
  }

  /**
   * Builds an active UberEatsAdapter
   */
  static getUberEatsAdapter(tenantId: string, encryptedCredentials?: string): UberEatsAdapter | null {
    if (!encryptedCredentials) return null;
    const creds = decryptCredentials<UberEatsConfig>(encryptedCredentials);
    if (!creds) return null;

    return new UberEatsAdapter({
      tenantId,
      storeId: creds.storeId,
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
    });
  }

  /**
   * Builds an active TransExpressAdapter
   */
  static getTransExpressAdapter(tenantId: string, encryptedCredentials?: string): TransExpressAdapter {
    const creds = encryptedCredentials ? decryptCredentials<TransExpressConfig>(encryptedCredentials) : null;

    return new TransExpressAdapter({
      tenantId,
      merchantCode: creds?.merchantCode || 'WOWTEK',
      apiKey: creds?.apiKey || process.env.TRANSEX_API_KEY || '',
    });
  }

  /**
   * Builds an active SmsAdapter
   */
  static getSmsAdapter(tenantId: string, encryptedCredentials?: string): SmsAdapter | null {
    if (!encryptedCredentials) return null;
    const creds = decryptCredentials<SmsGatewayConfig>(encryptedCredentials);
    if (!creds) return null;

    return new SmsAdapter({
      tenantId,
      apiUrl: creds.apiUrl,
      apiKey: creds.apiKey,
      senderId: creds.senderId,
    });
  }
}
