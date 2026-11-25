import { revalidatePath } from 'next/cache';
import { getDbSiteSettings, saveDbSiteSettings } from '@/lib/db';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';
import { sanitizeSiteSettingsPayload } from '@/lib/validation';

export async function GET(request) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  const settings = await getDbSiteSettings(true);
  return Response.json(settings);
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

  const { data: sanitized, error } = sanitizeSiteSettingsPayload(body);
  if (error) {
    return Response.json({ error }, { status: 400 });
  }

  try {
    const saved = await saveDbSiteSettings(sanitized);
    revalidatePath('/', 'layout');
    return Response.json(saved);
  } catch (err) {
    console.error('[Admin Settings] Failed to save settings:', err);
    return Response.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
