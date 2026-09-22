/**
 * WOWTEK Automation & Event Engine
 * Business: WOWTEK (wowtek.lk)
 *
 * Listens for system events (ORDER_CREATED, CONFIRMED, SHIPPED, DELIVERED, etc.)
 * and executes configured actions (Send SMS, Generate Invoice, Create Warranty, Dispatch Waybill).
 */

import { AutomationEventType, NotificationEvent, Order } from '../types';

export interface AutomationRule {
  id: string;
  name: string;
  eventType: AutomationEventType;
  actionType: 'SEND_SMS' | 'GENERATE_INVOICE' | 'CREATE_WARRANTY' | 'DISPATCH_WAYBILL';
  isEnabled: boolean;
  description: string;
}

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule_1',
    name: 'Auto-Send Order Confirmation SMS',
    eventType: 'ORDER_CONFIRMED',
    actionType: 'SEND_SMS',
    isEnabled: true,
    description: 'Sends confirmation SMS to customer phone as soon as order is confirmed.',
  },
  {
    id: 'rule_2',
    name: 'Auto-Generate Invoice on Confirmation',
    eventType: 'ORDER_CONFIRMED',
    actionType: 'GENERATE_INVOICE',
    isEnabled: true,
    description: 'Generates official WOWTEK invoice number and PDF view upon order confirmation.',
  },
  {
    id: 'rule_3',
    name: 'Auto-Create Warranty upon Delivery',
    eventType: 'ORDER_DELIVERED',
    actionType: 'CREATE_WARRANTY',
    isEnabled: true,
    description: 'Creates warranty registration with serial number when delivery is completed.',
  },
  {
    id: 'rule_4',
    name: 'Auto-Send Tracking SMS on Dispatch',
    eventType: 'ORDER_SHIPPED',
    actionType: 'SEND_SMS',
    isEnabled: true,
    description: 'Dispatches SMS containing courier tracking number to customer.',
  },
];
