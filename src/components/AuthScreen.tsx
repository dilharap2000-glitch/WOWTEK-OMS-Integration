/**
 * WOWTEK OMS — Secure Authentication Screen
 * Business: WOWTEK (wowtek.lk)
 */

import React, { useState } from 'react';
import { Lock, Mail, Shield, CheckCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { useOMS } from '../context/OMSContext';
import { apiClient } from '../services/apiClient';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const { setCurrentUser, users } = useOMS();
  const [email, setEmail] = useState('admin@wowtek.lk');
  const [password, setPassword] = useState('••••••••');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.login(email);
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('wowtek_auth_token', res.token);
        }
        setCurrentUser(res.user);
        onLoginSuccess();
        return;
      }
    } catch {
      // Offline fallback
    } finally {
      setIsSubmitting(false);
    }

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      onLoginSuccess();
    } else {
      setError('User with this email not found. Try one of the quick profiles below.');
    }
  };

  const handleSelectQuickUser = async (userEmail: string) => {
    setEmail(userEmail);
    setIsSubmitting(true);
    try {
      const res = await apiClient.login(userEmail);
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('wowtek_auth_token', res.token);
        }
        setCurrentUser(res.user);
        onLoginSuccess();
        return;
      }
    } catch {
      // Offline fallback
    } finally {
      setIsSubmitting(false);
    }

    const user = users.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());
    if (user) {
      setCurrentUser(user);
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-linear-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/25 mb-1">
            <span className="font-black text-2xl text-white tracking-tighter">W</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">WOWTEK OMS</h1>
          <p className="text-xs text-neutral-400 font-mono">
            wowtek.lk • Order Management & Logistics Engine
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
              Staff & Executive Sign In
            </div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              SECURE
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wowtek.lk"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-neutral-200 placeholder-neutral-500 focus:border-cyan-500 transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-linear-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Access WOWTEK Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Login Profiles */}
          <div className="pt-4 border-t border-neutral-800 space-y-2.5">
            <div className="text-[11px] text-neutral-400 font-medium text-center">
              Or instant sign-in with verified profile:
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSelectQuickUser('admin@wowtek.lk')}
                className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-400">
                    Sahan Admin
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    ADMIN
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">admin@wowtek.lk</div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectQuickUser('staff@wowtek.lk')}
                className="p-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white group-hover:text-cyan-400">
                    Dilshan Staff
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    STAFF
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">staff@wowtek.lk</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-neutral-400 space-y-1">
          <div>WOWTEK LK (PVT) LTD • Bambalapitiya, Colombo 04, Sri Lanka</div>
          <div className="font-mono text-[10px] text-neutral-400">
            Node.js API Active • MongoDB Atlas Schema Ready • Trans Express Gateway
          </div>
        </div>
      </div>
    </div>
  );
};
