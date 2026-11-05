import { getDbTestimonials, saveDbTestimonial, deleteDbTestimonial } from '@/lib/db';
import { cookies } from 'next/headers';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nik_admin_auth');
  return token?.value === 'nik-authorized-session-token-v1';
}

export async function GET() {
  const testimonials = await getDbTestimonials();
  return Response.json(testimonials);
}

export async function POST(request) {
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const saved = await saveDbTestimonial(data);
    return Response.json(saved);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await deleteDbTestimonial(id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
