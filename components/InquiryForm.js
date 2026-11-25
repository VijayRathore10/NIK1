'use client';

import { useState, useId } from 'react';

export default function InquiryForm({ productName = '' }) {
  const [status, setStatus] = useState('idle'); // idle | submitting | done
  const [errorMsg, setErrorMsg] = useState('');
  const uid = useId();

  const nameId = `${uid}-name`;
  const emailId = `${uid}-email`;
  const phoneId = `${uid}-phone`;
  const messageId = `${uid}-message`;
  const honeypotId = `${uid}-website`;

  const trimmedProduct = (productName || '').trim();

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    const form = new FormData(e.target);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(
          data.error ||
            'Something went wrong sending your inquiry. Please try again or email us directly.'
        );
        setStatus('idle');
        return;
      }

      setStatus('done');
    } catch {
      setStatus('idle');
      setErrorMsg(
        'Unable to send your inquiry right now. Please check your connection or email us directly.'
      );
    }
  }

  if (status === 'done') {
    return (
      <div
        role="status"
        className="border border-amber bg-amber/10 p-5 text-sm text-steel rounded-lg"
      >
        {trimmedProduct ? (
          <>
            Thanks — your inquiry about <strong>{trimmedProduct}</strong> has been sent. We&apos;ll get back to you shortly.
          </>
        ) : (
          <>Thanks — your inquiry has been sent. We&apos;ll get back to you shortly.</>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line p-6 bg-white space-y-4 rounded-xl">
      <input type="hidden" name="product" value={trimmedProduct} />

      {/* Visually hidden honeypot field for automated spam filtering */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={honeypotId}>Website</label>
        <input
          id={honeypotId}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="border border-red-300 bg-red-50 text-red-800 px-3.5 py-2.5 text-sm rounded-lg"
        >
          {errorMsg}
        </div>
      )}

      <div>
        <label
          htmlFor={nameId}
          className="mono-label text-[11px] uppercase text-graphite block mb-1"
        >
          Name
        </label>
        <input
          id={nameId}
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="name"
          className="w-full border border-line px-3 py-2 text-sm rounded focus:outline-none focus:border-freight"
        />
      </div>

      <div>
        <label
          htmlFor={emailId}
          className="mono-label text-[11px] uppercase text-graphite block mb-1"
        >
          Email
        </label>
        <input
          id={emailId}
          type="email"
          name="email"
          required
          maxLength={160}
          autoComplete="email"
          className="w-full border border-line px-3 py-2 text-sm rounded focus:outline-none focus:border-freight"
        />
      </div>

      <div>
        <label
          htmlFor={phoneId}
          className="mono-label text-[11px] uppercase text-graphite block mb-1"
        >
          WhatsApp / Contact (optional)
        </label>
        <input
          id={phoneId}
          name="phone"
          type="tel"
          maxLength={40}
          autoComplete="tel"
          placeholder="e.g. +91 92169..."
          className="w-full border border-line px-3 py-2 text-sm rounded focus:outline-none focus:border-freight"
        />
      </div>

      <div>
        <label
          htmlFor={messageId}
          className="mono-label text-[11px] uppercase text-graphite block mb-1"
        >
          Message
        </label>
        <textarea
          id={messageId}
          name="message"
          rows={4}
          required
          maxLength={4000}
          className="w-full border border-line px-3 py-2 text-sm rounded focus:outline-none focus:border-freight"
        />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full mono-label text-xs uppercase font-bold bg-amber text-steel px-5 py-3 rounded hover:bg-amber-dark transition-colors disabled:opacity-60 cursor-pointer"
      >
        {status === 'submitting' ? 'Sending…' : 'Request Quote'}
      </button>
    </form>
  );
}
