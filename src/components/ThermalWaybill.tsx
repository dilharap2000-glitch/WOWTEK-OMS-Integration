/**
 * WOWTEK OMS — Premium Courier Thermal Waybill Component
 * Physical Print Dimensions: 100mm (W) x 150mm (H) / 4 x 6 inch portrait
 * 203 DPI thermal label printer optimized
 * High-contrast, thermal-friendly, clean courier typography
 */

import React from 'react';
import { Barcode } from './Barcode';
import { Waybill, Order } from '../types';
import { formatDate, formatNumber } from '../lib/formatters';

interface ThermalWaybillProps {
  waybill: Waybill;
  order?: Order;
  businessSettings: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
  };
  format?: 'THERMAL_4X6' | 'A4';
  courierName?: string;
}

export const ThermalWaybill: React.FC<ThermalWaybillProps> = ({
  waybill,
  order,
  businessSettings,
  format = 'THERMAL_4X6',
  courierName = 'Trans Express',
}) => {
  // Determine if COD is applicable
  const isPrepaid =
    waybill.codAmount <= 0 ||
    order?.paymentStatus === 'PAID' ||
    (order?.paymentMethod &&
      !order.paymentMethod.toLowerCase().includes('cash') &&
      !order.paymentMethod.toLowerCase().includes('cod'));

  const codValue = isPrepaid ? 0 : waybill.codAmount || order?.totalAmount || order?.total || 0;

  // Determine items list
  const items =
    waybill.items && waybill.items.length > 0
      ? waybill.items
      : order?.items && order.items.length > 0
      ? order.items.map((i) => ({ name: i.name, quantity: i.quantity, sku: i.sku }))
      : [{ name: 'Standard Merchandise', quantity: 1 }];

  // Fragile check
  const isFragile =
    Boolean(waybill.isFragile) ||
    Boolean(
      items.some((i) => {
        const lower = (i.name || '').toLowerCase();
        return (
          lower.includes('glass') ||
          lower.includes('screen') ||
          lower.includes('display') ||
          lower.includes('fragile') ||
          lower.includes('watch') ||
          lower.includes('phone')
        );
      })
    );

  const barcodeData = waybill.barcodeValue || waybill.trackingNumber || waybill.waybillNumber || 'WB-TEX-9041';

  const displayDate = waybill.createdAt
    ? formatDate(waybill.createdAt, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : formatDate(new Date(), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

  // Format routing code from tracking or order
  const routingCode = (waybill.city || 'COLOMBO').toUpperCase().slice(0, 3) + '-01';

  return (
    <div
      className={`waybill-sheet bg-white text-black font-sans box-border overflow-hidden select-none print:shadow-none print:m-0 print:border-black ${
        format === 'THERMAL_4X6'
          ? 'w-[100mm] h-[150mm] min-w-[100mm] min-h-[150mm] max-w-[100mm] max-h-[150mm] p-[3.5mm] mx-auto border-2 border-black flex flex-col justify-between'
          : 'w-[100mm] h-[150mm] max-w-[100mm] p-[3.5mm] mx-auto border-2 border-black shadow-lg flex flex-col justify-between my-4'
      }`}
      style={{
        pageBreakAfter: 'always',
        breakAfter: 'page',
      }}
    >
      {/* 1. TOP HEADER: SENDER BRAND, ROUTING CODE & COURIER PARTNER */}
      <div className="border-b-2 border-black pb-1 shrink-0">
        <div className="flex items-stretch justify-between gap-1">
          {/* Brand & Store */}
          <div className="flex-1 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tighter uppercase leading-none font-mono">
                {businessSettings.name || 'WOWTEK'}
              </span>
              <span className="text-[7.5px] bg-black text-white px-1 py-0.5 font-bold uppercase tracking-wider rounded-xs">
                EXPRESS
              </span>
            </div>
            <div className="text-[8px] font-bold text-neutral-800 tracking-wider mt-0.5">
              {businessSettings.website || 'wowtek.lk'}
            </div>
          </div>

          {/* District / Routing Sort Hub */}
          <div className="border-2 border-black px-2 py-0.5 text-center flex flex-col justify-center bg-black text-white min-w-[28mm]">
            <div className="text-[7px] font-mono font-bold tracking-widest uppercase">
              ROUTING / HUB
            </div>
            <div className="text-base font-black tracking-tight font-mono leading-none">
              {routingCode}
            </div>
          </div>

          {/* Logistics Partner */}
          <div className="text-right border-2 border-black px-1.5 py-0.5 flex flex-col justify-center min-w-[25mm] bg-neutral-100">
            <div className="text-[7px] font-bold uppercase tracking-wider text-neutral-600">
              Courier
            </div>
            <div className="text-[10px] font-black tracking-tight uppercase leading-tight">
              {courierName || waybill.courierName || 'Trans Express'}
            </div>
          </div>
        </div>

        {/* Sender details mini row */}
        <div className="mt-1 pt-0.5 border-t border-dotted border-black/50 flex items-center justify-between text-[7.5px] leading-tight">
          <div className="truncate pr-1">
            <span className="font-extrabold uppercase text-[7px] tracking-wide">FROM: </span>
            <span className="font-bold">{businessSettings.name || 'WOWTEK'}</span>
            <span className="text-neutral-700"> • {businessSettings.address || 'Colombo 04, Sri Lanka'}</span>
          </div>
          <div className="font-mono font-bold whitespace-nowrap text-[7.5px]">
            TEL: {businessSettings.phone || '+94 11 755 8899'}
          </div>
        </div>
      </div>

      {/* 2. PRIMARY WAYBILL / TRACKING & LARGE 203 DPI CODE128 BARCODE */}
      <div className="py-1 border-b-2 border-black text-center shrink-0">
        <div className="flex items-center justify-between px-1 text-[8px] font-mono font-bold text-neutral-800">
          <span>TRACKING: <strong className="text-black text-[9px]">{waybill.trackingNumber}</strong></span>
          <span>DATE: {displayDate}</span>
        </div>

        {/* Dynamic Code128 Barcode */}
        <div className="my-0.5 px-1 py-0.5 bg-white flex flex-col items-center justify-center">
          <Barcode
            value={barcodeData}
            format="CODE128"
            width={1.75}
            height={40}
            displayValue={false}
          />
          <div className="text-[11px] font-mono font-black tracking-widest mt-0.5 text-black">
            {waybill.waybillNumber}
          </div>
        </div>
      </div>

      {/* 3. RECEIVER / CONSIGNEE SECTION (HIGH CONTRAST & READABILITY) */}
      <div className="py-1 px-1 border-b-2 border-black shrink-0 bg-neutral-50/70">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-xs">
              SHIP TO / CONSIGNEE
            </span>
            {isFragile && (
              <span className="text-[7.5px] font-black border border-black px-1.5 py-0.2 bg-black text-white uppercase rounded-xs">
                ⚠️ FRAGILE HANDLE WITH CARE
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono font-black text-black">
            TEL: {waybill.customerPhone}
          </span>
        </div>

        {/* Customer Name */}
        <div className="text-[13px] font-black tracking-tight uppercase leading-tight text-black mt-0.5">
          {waybill.customerName}
        </div>

        {/* Full Delivery Address */}
        <div className="text-[10px] font-bold leading-tight text-neutral-900 mt-0.5">
          {waybill.address}
        </div>

        {/* Destination City Highlight */}
        <div className="mt-1 pt-1 border-t border-black/40 flex items-center justify-between">
          <div className="text-[11px] font-black uppercase tracking-wide">
            DESTINATION: <span className="underline decoration-2 font-black">{waybill.city}</span>
          </div>
          <div className="text-[8px] font-mono font-bold text-neutral-700">
            ORDER #{waybill.orderNumber}
          </div>
        </div>
      </div>

      {/* 4. PACKAGE CONTENTS & LINE ITEMS */}
      <div className="py-1 px-1 border-b-2 border-black shrink-0 text-[8px] leading-tight">
        <div className="flex items-center justify-between border-b border-dotted border-black/50 pb-0.5 mb-1 font-mono">
          <div>
            <span className="font-bold text-neutral-700">PACKAGE CONTENT:</span>
          </div>
          <div>
            <span className="font-bold text-neutral-700">CHANNEL: </span>
            <span className="font-black text-black">WEBSITE / WOOCOMMERCE</span>
          </div>
        </div>

        {/* Items Summary Table */}
        <div className="space-y-0.5 max-h-[20mm] overflow-hidden">
          {items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-[8px] font-medium">
              <span className="truncate pr-2 font-semibold">
                • {item.name}
              </span>
              <span className="font-mono font-black whitespace-nowrap">
                QTY: {item.quantity}
              </span>
            </div>
          ))}
          {items.length > 3 && (
            <div className="text-[7.5px] text-neutral-600 italic">
              + {items.length - 3} more line item(s)
            </div>
          )}
        </div>
      </div>

      {/* 5. PAYMENT SECTION (COD OR PREPAID) — MASSIVE PROMINENCE FOR THERMAL LABEL */}
      <div className="my-1 border-2 border-black shrink-0">
        {codValue > 0 ? (
          <div className="p-1.5 bg-neutral-100 flex items-center justify-between">
            <div>
              <div className="text-[8.5px] font-black uppercase tracking-wider text-neutral-900 leading-none">
                CASH ON DELIVERY (COD)
              </div>
              <div className="text-[7.5px] text-neutral-700 mt-0.5 leading-none">
                Courier: Collect exact cash prior to package release
              </div>
            </div>

            <div className="text-right">
              <div className="text-[7.5px] font-black uppercase text-neutral-700 leading-none">
                AMOUNT TO COLLECT
              </div>
              <div className="text-lg font-black tracking-tight text-black font-mono leading-tight">
                Rs. {formatNumber(codValue, '0.00', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-1.5 bg-neutral-100 flex items-center justify-between">
            <div>
              <div className="text-[9px] font-black uppercase tracking-wider text-black leading-none">
                PAYMENT STATUS: PREPAID
              </div>
              <div className="text-[7.5px] text-neutral-700 mt-0.5 leading-none">
                Paid online • Zero cash collection required
              </div>
            </div>

            <div className="text-right">
              <span className="px-2 py-0.5 bg-black text-white font-black text-xs font-mono uppercase tracking-widest rounded-xs">
                DO NOT COLLECT CASH
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 6. COURIER SIGNATURE / RUNSHEET & VERIFICATION BAR */}
      <div className="border border-black p-1 shrink-0 flex items-center justify-between text-[7px] font-mono">
        <div>
          <span>RECIPIENT SIGNATURE / NIC:</span>
          <div className="w-28 border-b border-black mt-3"></div>
        </div>
        <div className="text-right">
          <span>DELIVERY DATE & TIME:</span>
          <div className="w-24 border-b border-black mt-3"></div>
        </div>
      </div>

      {/* 7. FOOTER */}
      <div className="pt-0.5 border-t border-black shrink-0 flex items-center justify-between text-[7px] text-neutral-700">
        <div>
          <span className="font-bold text-black">{businessSettings.name || 'WOWTEK'}</span> • {businessSettings.website || 'wowtek.lk'} • Hotline: {businessSettings.phone || '+94 11 755 8899'}
        </div>
        <div className="font-mono text-[7px] text-neutral-600">
          IF UNDELIVERED, RETURN TO SENDER
        </div>
      </div>
    </div>
  );
};
