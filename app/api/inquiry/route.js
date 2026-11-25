import { addDbInquiry } from '@/lib/db';
import { sanitizeInquiryPayload } from '@/lib/validation';

// Simple in-memory sliding-window per-IP rate limiter (5 requests / 10 minutes)
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQUESTS = 5;
const ipHits = new Map();

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  // Prune stale entries periodically to prevent unbounded memory growth
  if (ipHits.size > 1000) {
    for (const [key, timestamps] of ipHits.entries()) {
      const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
      if (recent.length === 0) {
        ipHits.delete(key);
      } else {
        ipHits.set(key, recent);
      }
    }
  }

  const existing = (ipHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (existing.length >= RATE_MAX_REQUESTS) {
    ipHits.set(ip, existing);
    return true;
  }

  existing.push(now);
  ipHits.set(ip, existing);
  return false;
}

export async function POST(request) {
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp)) {
    return Response.json(
      { error: 'Too many inquiries submitted. Please try again in a few minutes.' },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request payload.' }, { status: 400 });
  }

  // Honeypot anti-spam trap: silently accept without saving or emailing
  if (
    (typeof body?.website === 'string' && body.website.trim().length > 0) ||
    (typeof body?.companyUrl === 'string' && body.companyUrl.trim().length > 0)
  ) {
    return Response.json({ ok: true });
  }

  const { data: inquiry, error } = sanitizeInquiryPayload(body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  // 1. Save sanitized inquiry to Firestore / local store
  try {
    await addDbInquiry(inquiry);
  } catch (err) {
    console.error('[Inquiry] Failed to save inquiry:', err);
    return Response.json({ error: 'Failed to submit inquiry. Please try again.' }, { status: 500 });
  }

  // 2. Send optional email notification if Resend is configured
  try {
    if (process.env.RESEND_API_KEY && process.env.NOTIFY_EMAIL) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Nik Exports Website <inquiries@nikexports.com>',
          to: process.env.NOTIFY_EMAIL,
          subject: `New inquiry${inquiry.product ? `: ${inquiry.product}` : ''}`,
          text: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone || '-'}\nProduct: ${inquiry.product || '-'}\n\nMessage:\n${inquiry.message}`,
        }),
      });
    }
  } catch (err) {
    console.error('[Inquiry] Failed to send email notification:', err);
  }

  return Response.json({ ok: true });
}
