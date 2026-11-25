import { revalidatePath } from 'next/cache';
import { getDbTestimonials, saveDbTestimonial, deleteDbTestimonial } from '@/lib/db';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';
import { sanitizeTestimonialPayload, sanitizeDocId } from '@/lib/validation';

export async function GET(request) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  const testimonials = await getDbTestimonials(true);
  return Response.json(testimonials);
}

export async function POST(request) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const { data: sanitized, error } = sanitizeTestimonialPayload(body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  try {
    const saved = await saveDbTestimonial(sanitized);
    revalidatePath('/', 'layout');
    return Response.json(saved);
  } catch (err) {
    console.error('[Admin Testimonials] Failed to save testimonial:', err);
    return Response.json({ error: 'Failed to save testimonial' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = sanitizeDocId(searchParams.get('id'));
    if (!id) {
      return Response.json({ error: 'Invalid or missing testimonial ID' }, { status: 400 });
    }

    await deleteDbTestimonial(id);
    revalidatePath('/', 'layout');
    return Response.json({ success: true });
  } catch (err) {
    console.error('[Admin Testimonials] Failed to delete testimonial:', err);
    return Response.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
