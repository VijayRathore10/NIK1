import { getDbSiteSettings, saveDbSiteSettings } from '@/lib/db';
import { cookies } from 'next/headers';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nik_admin_auth');
  return token?.value === 'nik-authorized-session-token-v1';
}

export async function GET() {
  const settings = await getDbSiteSettings();
  return Response.json(settings);
}

export async function POST(request) {
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const saved = await saveDbSiteSettings(data);
    return Response.json(saved);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
