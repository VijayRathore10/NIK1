import { addDbInquiry } from '@/lib/db';

export async function POST(request) {
  const body = await request.json();
  const { name, email, phone, message, product } = body;

  if (!name || !email || !message) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 1. Save directly to local in-app database for admin viewing
  try {
    await addDbInquiry({
      name,
      email,
      phone: phone || '',
      message,
      product: product || '',
    });
  } catch (err) {
    console.error('Failed to save inquiry to local DB:', err);
  }

  // 2. Send instant email notification if RESEND is configured
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
          subject: `New inquiry${product ? `: ${product}` : ''}`,
          text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || '-'}\nProduct: ${product || '-'}\n\nMessage:\n${message}`,
        }),
      });
    }
  } catch (err) {
    console.error('Failed to send email notification:', err);
  }

  return Response.json({ ok: true });
}
