import React, { useState } from 'react';
import { MessageSquare, Globe, Truck, CheckCircle2, RefreshCw, Settings, ShieldAlert, Key } from 'lucide-react';
import { IntegrationConfig, SMSConfig } from '../types';

interface IntegrationsTabProps {
  integrations: IntegrationConfig;
  smsConfig: SMSConfig;
  onSaveIntegrations: (newConfigs: IntegrationConfig) => void;
  onSaveSmsConfig: (newSms: SMSConfig) => void;
  onRunTestSuite: () => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({
  integrations,
  smsConfig,
  onSaveIntegrations,
  onSaveSmsConfig,
  onRunTestSuite,
}) => {
  const [config, setConfig] = useState<IntegrationConfig>(integrations);
  const [sms, setSms] = useState<SMSConfig>(smsConfig);
  const [testResults, setTestResults] = useState<any>(null);

  const handleSaveWoo = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIntegrations(config);
    alert('WooCommerce integration settings saved successfully!');
  };

  const handleSaveTransExpress = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveIntegrations(config);
    alert('Trans Express Courier settings saved successfully!');
  };

  const handleSaveSms = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSmsConfig(sms);
    alert('SMS Gateway settings saved successfully!');
  };

  const runTests = async () => {
    try {
      const res = await fetch('/api/tests/run');
      const data = await res.json();
      setTestResults(data.results);
    } catch (err) {
      console.error(err);
      alert('Error running automated test suite');
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      {/* Top Banner & Test Suite Trigger */}
      <div className="bg-gradient-to-r from-purple-900/30 via-zinc-900 to-zinc-950 border border-purple-500/20 rounded-2xl p-6 flex items-center justify-between shadow-xl">
        <div>
          <h3 className="text-lg font-bold text-white">Unified API Integration Dashboard</h3>
          <p className="text-xs text-zinc-400">Manage WooCommerce, PickMe, Uber Eats, Trans Express & SMS gateways with secure server-side proxy</p>
        </div>
        <button
          onClick={runTests}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Run Automated Integration Tests</span>
        </button>
      </div>

      {testResults && (
        <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-3">
          <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Automated Integration & Workflow Test Results
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {Object.entries(testResults).map(([key, val]) => (
              key !== 'timestamp' && (
                <div key={key} className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-zinc-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="text-emerald-400 font-bold">{String(val)}</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WooCommerce Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">WooCommerce Store API</h4>
                  <p className="text-[11px] text-zinc-400">REST API & HMAC Webhooks</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${config.woocommerce.connected ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300'}`}>
                {config.woocommerce.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <form onSubmit={handleSaveWoo} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 uppercase font-semibold mb-1">Store URL</label>
                <input
                  type="url"
                  value={config.woocommerce.storeUrl}
                  onChange={e => setConfig({ ...config, woocommerce: { ...config.woocommerce, storeUrl: e.target.value } })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 uppercase font-semibold mb-1">Consumer Key</label>
                  <input
                    type="password"
                    value={config.woocommerce.consumerKey}
                    onChange={e => setConfig({ ...config, woocommerce: { ...config.woocommerce, consumerKey: e.target.value } })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase font-semibold mb-1">Webhook Secret</label>
                  <input
                    type="password"
                    value={config.woocommerce.webhookSecret}
                    onChange={e => setConfig({ ...config, woocommerce: { ...config.woocommerce, webhookSecret: e.target.value } })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 py-2 rounded-xl font-semibold transition-colors"
              >
                Save WooCommerce Settings
              </button>
            </form>
          </div>
        </div>

        {/* Trans Express Courier Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Trans Express Courier API</h4>
                  <p className="text-[11px] text-zinc-400">Automated Waybill Booking</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${config.transExpress.connected ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/15 text-red-300'}`}>
                {config.transExpress.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <form onSubmit={handleSaveTransExpress} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 uppercase font-semibold mb-1">Account Number</label>
                  <input
                    type="text"
                    value={config.transExpress.accountNumber}
                    onChange={e => setConfig({ ...config, transExpress: { ...config.transExpress, accountNumber: e.target.value } })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 uppercase font-semibold mb-1">Pickup Hub</label>
                  <input
                    type="text"
                    value={config.transExpress.pickupLocation}
                    onChange={e => setConfig({ ...config, transExpress: { ...config.transExpress, pickupLocation: e.target.value } })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.transExpress.autoBookWaybill}
                    onChange={e => setConfig({ ...config, transExpress: { ...config.transExpress, autoBookWaybill: e.target.checked } })}
                    className="w-4 h-4 rounded border-zinc-800 text-purple-600 bg-zinc-900"
                  />
                  <span className="text-zinc-200">Auto-book waybill for website orders</span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 py-2 rounded-xl font-semibold transition-colors"
              >
                Save Trans Express Settings
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* SMS Gateway Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">SMS Gateway Configuration (SMSlenz / Dialog / Mobitel)</h4>
            <p className="text-xs text-zinc-400">Automated 30-day warranty expiry reminders and invoice link dispatch</p>
          </div>
        </div>

        <form onSubmit={handleSaveSms} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-zinc-400 uppercase font-semibold mb-1">Provider</label>
              <select
                value={sms.provider}
                onChange={e => setSms({ ...sms, provider: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200"
              >
                <option value="SMSlenz">SMSlenz</option>
                <option value="Dialog">Dialog Enterprise</option>
                <option value="Mobitel">Mobitel mSMS</option>
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 uppercase font-semibold mb-1">Sender ID</label>
              <input
                type="text"
                value={sms.senderId}
                onChange={e => setSms({ ...sms, senderId: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-zinc-400 uppercase font-semibold mb-1">API Key</label>
              <input
                type="password"
                value={sms.apiKey}
                onChange={e => setSms({ ...sms, apiKey: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/25"
            >
              Save SMS Gateway Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
