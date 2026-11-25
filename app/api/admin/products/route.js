import { revalidatePath } from 'next/cache';
import { getDbProducts, saveDbProduct, deleteDbProduct } from '@/lib/db';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';
import { sanitizeProductPayload, sanitizeDocId } from '@/lib/validation';

export async function GET(request) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  const products = await getDbProducts(true);
  return Response.json(products);
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

  const { data: sanitized, error } = sanitizeProductPayload(body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  try {
    const saved = await saveDbProduct(sanitized);
    revalidatePath('/', 'layout');
    if (saved.slug) revalidatePath(`/product/${saved.slug}`);
    if (saved.category?.slug) revalidatePath(`/category/${saved.category.slug}`);
    return Response.json(saved);
  } catch (err) {
    console.error('[Admin Products] Failed to save product:', err);
    return Response.json({ error: 'Failed to save product' }, { status: 500 });
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
      return Response.json({ error: 'Invalid or missing product ID' }, { status: 400 });
    }

    await deleteDbProduct(id);
    revalidatePath('/', 'layout');
    return Response.json({ success: true });
  } catch (err) {
    console.error('[Admin Products] Failed to delete product:', err);
    return Response.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
