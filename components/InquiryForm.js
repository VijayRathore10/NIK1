'use client';

import { useState } from 'react';

export default function InquiryForm({ productName }) {
  const [status, setStatus] = useState('idle'); // idle | submitting | done

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    const form = new FormData(e.target);
    const payload = Object.fromEntries(form.entries());

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Request failed');
      setStatus('done');
    } catch (err) {
      setStatus('idle');
      alert('Something went wrong sending your inquiry. Please try again or email us directly.');
    }
  }

  if (status === 'done') {
    return (
      <div className="border border-amber bg-amber/10 p-5 text-sm">
        Thanks — your inquiry about <strong>{productName}</strong> has been sent. We&apos;ll get back to you shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-line p-6 bg-white space-y-4">
      <input type="hidden" name="product" value={productName} />
      <div>
        <label className="mono-label text-[11px] uppercase text-graphite block mb-1">Name</label>
        <input name="name" required className="w-full border border-line px-3 py-2 text-sm focus:outline-none focus:border-freight" />
      </div>
      <div>
        <label className="mono-label text-[11px] uppercase text-graphite block mb-1">Email</label>
        <input type="email" name="email" required className="w-full border border-line px-3 py-2 text-sm focus:outline-none focus:border-freight" />
      </div>
      <div>
        <label className="mono-label text-[11px] uppercase text-graphite block mb-1">WhatsApp / Contact (optional)</label>
        <input name="phone" placeholder="e.g. +971 50..." className="w-full border border-line px-3 py-2 text-sm focus:outline-none focus:border-freight" />
      </div>
      <div>
        <label className="mono-label text-[11px] uppercase text-graphite block mb-1">Message</label>
        <textarea name="message" rows={4} required className="w-full border border-line px-3 py-2 text-sm focus:outline-none focus:border-freight" />
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full mono-label text-xs uppercase bg-amber text-steel px-5 py-3 hover:bg-amber-dark transition-colors disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Request Quote'}
      </button>
    </form>
  );
}
