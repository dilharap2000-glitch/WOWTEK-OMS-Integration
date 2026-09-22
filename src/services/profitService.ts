/**
 * WOWTEK Profit Calculation Engine
 * Calculates item-level and order-level gross profit, fees, net profit, and profit margin.
 */

import { OrderItem, PaymentMethodConfig, PlatformCommissionConfig, ProfitBreakdown, ChannelSource } from '../types';

export function calculatePaymentFee(
  amount: number,
  paymentMethodCode: string,
  configs: PaymentMethodConfig[]
): number {
  const config = configs.find(
    (c) => c.code.toLowerCase() === paymentMethodCode.toLowerCase() ||
           c.name.toLowerCase() === paymentMethodCode.toLowerCase()
  );

  if (!config || !config.isEnabled) {
    return 0;
  }

  let fee = 0;
  if (config.feeType === 'PERCENTAGE' || config.feeType === 'PERCENTAGE_AND_FIXED') {
    fee += (amount * (config.feePercentage || 0)) / 100;
  }
  if (config.feeType === 'FIXED' || config.feeType === 'PERCENTAGE_AND_FIXED') {
    fee += config.fixedFee || 0;
  }

  return Math.round(fee * 100) / 100;
}

export function calculatePlatformCommission(
  amount: number,
  channel: ChannelSource,
  configs: PlatformCommissionConfig[]
): number {
  const config = configs.find((c) => c.channel === channel && c.isActive);
  if (!config) {
    return 0;
  }

  const commission = (amount * (config.percentage || 0)) / 100 + (config.fixedFee || 0);
  return Math.round(commission * 100) / 100;
}

export function calculateItemProfit(item: {
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount?: number;
}): {
  totalPrice: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
} {
  const discount = item.discount || 0;
  const totalPrice = Math.max(0, (item.unitPrice * item.quantity) - discount);
  const totalCost = item.unitCost * item.quantity;
  const grossProfit = totalPrice - totalCost;
  const profitMargin = totalPrice > 0 ? (grossProfit / totalPrice) * 100 : 0;

  return {
    totalPrice: Math.round(totalPrice * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    profitMargin: Math.round(profitMargin * 10) / 10,
  };
}

export function calculateOrderProfit(params: {
  items: OrderItem[];
  overallDiscount?: number;
  shippingFee?: number;
  source: ChannelSource;
  paymentMethod: string;
  courierFee?: number;
  otherCosts?: number;
  paymentConfigs: PaymentMethodConfig[];
  commissionConfigs: PlatformCommissionConfig[];
}): ProfitBreakdown {
  const {
    items,
    overallDiscount = 0,
    shippingFee = 0,
    source,
    paymentMethod,
    courierFee = 0,
    otherCosts = 0,
    paymentConfigs,
    commissionConfigs,
  } = params;

  // Calculate gross merchandise value
  const grossRevenue = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const itemDiscounts = items.reduce((acc, item) => acc + (item.discount || 0), 0);
  const totalDiscount = itemDiscounts + overallDiscount;
  const netRevenue = Math.max(0, grossRevenue - totalDiscount);

  // Total product cost
  const productCost = items.reduce((acc, item) => acc + (item.unitCost * item.quantity), 0);

  // Gross Profit = Net Revenue - Product Cost
  const grossProfit = netRevenue - productCost;

  // Total order transaction value including shipping for payment processing calculation
  const totalOrderAmount = netRevenue + shippingFee;

  // Platform Commission
  const platformCommission = calculatePlatformCommission(netRevenue, source, commissionConfigs);

  // Payment Fee (e.g. Mintpay, Card, Koko)
  const paymentFee = calculatePaymentFee(totalOrderAmount, paymentMethod, paymentConfigs);

  // Total Fees
  const totalFees = platformCommission + paymentFee + courierFee + otherCosts;

  // Net Profit = Gross Profit - Total Fees
  const netProfit = grossProfit - totalFees;

  // Net Profit Margin %
  const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

  return {
    revenue: Math.round(grossRevenue * 100) / 100,
    discount: Math.round(totalDiscount * 100) / 100,
    netRevenue: Math.round(netRevenue * 100) / 100,
    productCost: Math.round(productCost * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    platformCommission: Math.round(platformCommission * 100) / 100,
    paymentFee: Math.round(paymentFee * 100) / 100,
    courierFee: Math.round(courierFee * 100) / 100,
    otherCosts: Math.round(otherCosts * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    netProfit: Math.round(netProfit * 100) / 100,
    profitMargin: Math.round(profitMargin * 10) / 10,
  };
}
