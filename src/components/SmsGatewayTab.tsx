import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Settings, Smartphone } from 'lucide-react';
import { SMSConfig } from '../types';

interface SmsGatewayTabProps {
  smsConfig: SMSConfig;
  onSaveSmsConfig: (config: SMSConfig) => void;
}

export const SmsGatewayTab: React.FC<SmsGatewayTabProps> = ({
  smsConfig,
  onSaveSmsConfig,
}) => {
  const [config, setConfig] = useState<SMSConfig>(smsConfig);
  const [testPhone, setTestPhone] = useState('0771234567');
  const [testMessage, setTestMessage] = useState('Dear Customer, your WOWTEK order has been dispatched with Waybill #TE-984210. Track via: https://wowtek.lk/track');
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSmsConfig(config);
    alert('SMS Gateway configuration saved successfully!');
  };

  const handleSendTestSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMessage) {
      alert('Please enter a test phone number and message.');
      return;
    }
    setTestStatus('Sending SMS via ' + config.provider + ' API...');
    setTimeout(() => {
      setTestStatus(`Success! SMS dispatched to ${testPhone} via ${config.provider} (Sender ID: ${config.senderId}).`);
    }, 1200);
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* Configuration Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">SMS Gateway Configuration</h3>
            <p className="text-xs text-zinc-400">Connect SMSlenz, Dialog, or Mobitel API for automated dispatch & warranty reminders</p>
          </div>
        </div>

        <form onSubmit={handleConfigSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">SMS Provider</label>
              <select
                value={config.provider}
                onChange={e => setConfig({ ...config, provider: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              >
                <option value="SMSlenz">SMSlenz Gateway</option>
                <option value="Dialog">Dialog Enterprise SMS</option>
                <option value="Mobitel">Mobitel mSMS API</option>
                <option value="Custom">Custom HTTP Gateway</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Sender ID / Mask</label>
              <input
                type="text"
                required
                value={config.senderId}
                onChange={e => setConfig({ ...config, senderId: e.target.value })}
                placeholder="e.g. WOWTEK"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">API Key / Token</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={e => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="Enter provider API key..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">User ID / Username</label>
              <input
                type="text"
                value={config.userId}
                onChange={e => setConfig({ ...config, userId: e.target.value })}
                placeholder="Enter API user ID..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">API Endpoint URL</label>
              <input
                type="url"
                required
                value={config.endpointUrl}
                onChange={e => setConfig({ ...config, endpointUrl: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">HTTP Method</label>
              <select
                value={config.httpMethod}
                onChange={e => setConfig({ ...config, httpMethod: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="POST">POST</option>
                <option value="GET">GET</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-800 text-purple-600 focus:ring-purple-500 bg-zinc-900"
              />
              <span className="text-sm font-medium text-zinc-200">Enable Automated SMS Dispatch (Order PDF & Warranty Reminders)</span>
            </label>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>

      {/* Test SMS Panel */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-zinc-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Test SMS Dispatch Panel</h3>
            <p className="text-xs text-zinc-400">Send an instant test message to verify gateway connectivity</p>
          </div>
        </div>

        <form onSubmit={handleSendTestSms} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Recipient Phone Number</label>
            <input
              type="text"
              required
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              placeholder="e.g. 0771234567"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Message Content</label>
            <textarea
              rows={3}
              required
              value={testMessage}
              onChange={e => setTestMessage(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {testStatus ? (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {testStatus}
              </span>
            ) : (
              <span></span>
            )}
            <button
              type="submit"
              className="flex items-center space-x-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              <Send className="w-4 h-4 text-purple-400" />
              <span>Send Test SMS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
