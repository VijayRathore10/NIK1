import { revalidatePath } from 'next/cache';
import { getDbCategories, saveDbCategory, deleteDbCategory } from '@/lib/db';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';
import { sanitizeCategoryPayload, sanitizeDocId } from '@/lib/validation';

export async function GET(request) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  const categories = await getDbCategories(true);
  return Response.json(categories);
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

  const { data: sanitized, error } = sanitizeCategoryPayload(body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  try {
    const saved = await saveDbCategory(sanitized);
    revalidatePath('/', 'layout');
    if (saved.slug) revalidatePath(`/category/${saved.slug}`);
    return Response.json(saved);
  } catch (err) {
    console.error('[Admin Categories] Failed to save category:', err);
    return Response.json({ error: 'Failed to save category' }, { status: 500 });
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
      return Response.json({ error: 'Invalid or missing category ID' }, { status: 400 });
    }

    await deleteDbCategory(id);
    revalidatePath('/', 'layout');
    return Response.json({ success: true });
  } catch (err) {
    console.error('[Admin Categories] Failed to delete category:', err);
    return Response.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
