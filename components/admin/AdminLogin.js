'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Lock, ExternalLink } from 'lucide-react';

export default function AdminLogin({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Invalid administrator password');
      }

      setPassword('');
      onAuthenticated();
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A101D] text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#131D2F] border border-slate-700/80 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold font-display uppercase tracking-tight text-white">
            Nik Exports Admin
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Fleet, Specifications &amp; Inquiry Management Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {loginError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium"
            >
              {loginError}
            </div>
          )}

          <div>
            <label
              htmlFor="admin-password-input"
              className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Admin Password
            </label>
            <input
              id="admin-password-input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full px-4 py-3 rounded-xl bg-[#0A101D] border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer disabled:opacity-50"
          >
            {loggingIn ? 'Authenticating...' : 'Enter Dashboard'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800 text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-amber-400 inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Return to live public website</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
