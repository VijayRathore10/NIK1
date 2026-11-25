import { getDbInquiries, deleteDbInquiry } from '@/lib/db';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';
import { sanitizeDocId } from '@/lib/validation';

export async function GET(request) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  const inquiries = await getDbInquiries();
  return Response.json(inquiries);
}

export async function DELETE(request) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = sanitizeDocId(searchParams.get('id'));
    if (!id) {
      return Response.json({ error: 'Invalid or missing inquiry ID' }, { status: 400 });
    }

    await deleteDbInquiry(id);
    return Response.json({ success: true });
  } catch (err) {
    console.error('[Admin Inquiries] Failed to delete inquiry:', err);
    return Response.json({ error: 'Failed to delete inquiry' }, { status: 500 });
  }
}
