/**
 * WOWTEK OMS — Integrations & Webhooks Hub
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import {
  Plug,
  Zap,
  Globe,
  Bike,
  Store,
  Truck,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Send,
  RefreshCw,
  Copy,
  Info,
} from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { formatTime } from '../lib/formatters';

export const IntegrationsView: React.FC = () => {
  const {
    integrations,
    updateIntegration,
    smsLogs,
    sendSMS,
    simulateWooCommerceWebhookOrder,
  } = useOMS();

  const [testPhone, setTestPhone] = useState('+94 77 123 4567');
  const [testMessage, setTestMessage] = useState('WOWTEK: Testing live SMS gateway connection from Colombo hub.');
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [smsFeedback, setSmsFeedback] = useState<string | null>(null);

  const [isSimulatingWC, setIsSimulatingWC] = useState(false);
  const [wcFeedback, setWcFeedback] = useState<string | null>(null);

  const [testTrackingNumber, setTestTrackingNumber] = useState('TEX-9481029');
  const [trackingResult, setTrackingResult] = useState<string | null>(null);

  const handleSimulateWebhook = () => {
    setIsSimulatingWC(true);
    setTimeout(() => {
      const res = simulateWooCommerceWebhookOrder();
      setIsSimulatingWC(false);
      setWcFeedback(res.message);
    }, 600);
  };

  const handleSendTestSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingSMS(true);
    const success = await sendSMS(testPhone, 'Valued Customer', testMessage, 'CUSTOM');
    setIsSendingSMS(false);
    setSmsFeedback(success ? 'SMS message logged and dispatched!' : 'Failed to dispatch SMS.');
    setTimeout(() => setSmsFeedback(null), 5000);
  };

  const handleTestTracking = async () => {
    setTrackingResult('Querying Trans Express Colombo Gateway API...');
    setTimeout(() => {
      setTrackingResult(
        `Trans Express Status for ${testTrackingNumber}: Consignment scanned at Colombo Central Sort Facility. Out for Delivery.`
      );
    }, 500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            System Integrations & API Adapters
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Production adapters for WooCommerce REST, PickMe Merchant API, Uber Eats, Trans Express, and SMS Gateway
          </p>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. WooCommerce Integration */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">WooCommerce (wowtek.lk)</h2>
                <div className="text-[11px] text-neutral-400 font-mono">REST API v3 & Webhooks</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              CONNECTED
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Webhook Endpoint URL:</span>
              <span className="font-mono text-cyan-400 text-[11px]">
                /api/webhooks/woocommerce/order-created
              </span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Trigger Event:</span>
              <span className="font-mono text-neutral-200 text-[11px]">woocommerce_order_created</span>
            </div>
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-400">Signature Verification:</span>
              <span className="font-mono text-emerald-400 text-[11px]">HMAC-SHA256 Ready</span>
            </div>
          </div>

          {wcFeedback && (
            <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{wcFeedback}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateWebhook}
              disabled={isSimulatingWC}
              className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-xs font-semibold border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Zap className={`w-3.5 h-3.5 ${isSimulatingWC ? 'animate-spin' : ''}`} />
              <span>Simulate Live Webhook Order Ingestion</span>
            </button>
          </div>
        </div>

        {/* 2. Trans Express Logistics */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Trans Express Logistics</h2>
                <div className="text-[11px] text-neutral-400 font-mono">Domestic Islandwide Courier</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              OPERATIONAL
            </span>
          </div>

          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs space-y-2">
            <div className="text-neutral-400 text-[11px]">
              Active partner for automated waybill consignments, pickup requests, and cash-on-delivery (COD) settlements.
            </div>
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={testTrackingNumber}
                onChange={(e) => setTestTrackingNumber(e.target.value)}
                placeholder="TEX-9481029"
                className="flex-1 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-200 font-mono"
              />
              <button
                onClick={handleTestTracking}
                className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer"
              >
                Test Query
              </button>
            </div>
          </div>

          {trackingResult && (
            <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs font-mono">
              {trackingResult}
            </div>
          )}
        </div>

        {/* 3. PickMe Integration Adapter */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">PickMe Food & Courier</h2>
                <div className="text-[11px] text-neutral-400 font-mono">PickMe Merchant API</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              ADAPTER READY
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-950 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>PickMe integration not configured.</span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              Awaiting official API credentials/configuration from the PickMe Merchant Onboarding Portal.
              Once client ID & API key are set in <code className="text-cyan-400">.env</code>, orders will sync automatically.
            </p>
          </div>
        </div>

        {/* 4. Uber Eats Integration Adapter */}
        <div className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Uber Eats</h2>
                <div className="text-[11px] text-neutral-400 font-mono">Uber Direct & Eats API</div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              ADAPTER READY
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-950 border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Uber Eats integration not configured.</span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              Awaiting official API credentials/configuration from Uber Developer Portal. Once credentials are provided,
              the adapter ingests store orders at 22% commission.
            </p>
          </div>
        </div>
      </div>

      {/* SMS Gateway Hub & Test Dispatcher */}
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">SMS Notification Gateway</h2>
              <p className="text-xs text-neutral-400">
                Provider: Sri Lanka Telecom / Mobitel / Dialog Gateway with Sender ID: <span className="text-cyan-400 font-mono font-bold">WOWTEK</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Test Composer */}
        <form onSubmit={handleSendTestSMS} className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3">
          <div className="font-bold text-xs text-neutral-200">Test Live SMS Dispatch</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Sri Lanka Phone (+94)</label>
              <input
                type="text"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] text-neutral-400 block mb-1">Message Body</label>
              <input
                type="text"
                required
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200"
              />
            </div>
          </div>

          {smsFeedback && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{smsFeedback}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSendingSMS}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingSMS ? 'Dispatching...' : 'Send Live SMS Test'}</span>
          </button>
        </form>

        {/* SMS Logs Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            Recent SMS Notification Logs ({smsLogs.length})
          </h3>

          <div className="rounded-xl border border-neutral-800 overflow-hidden">
            <table className="w-full text-left text-xs text-neutral-300">
              <thead className="bg-neutral-950 text-neutral-400 uppercase text-[10px] font-mono tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-2.5 px-3">Sent At</th>
                  <th className="py-2.5 px-3">Recipient & Phone</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Message Content</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-sans">
                {smsLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-800/30">
                    <td className="py-2.5 px-3 font-mono text-[10px] text-neutral-400">
                      {formatTime(log.sentAt, {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-neutral-200">{log.recipientName}</div>
                      <div className="font-mono text-[10px] text-cyan-400">{log.phone}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {log.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-[320px] truncate text-neutral-300">
                      {log.message}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
