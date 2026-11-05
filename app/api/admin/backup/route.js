import { getRawDatabase, restoreDatabase } from '@/lib/db';
import { cookies } from 'next/headers';

async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nik_admin_auth');
  return token?.value === 'nik-authorized-session-token-v1';
}

export async function GET() {
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = getRawDatabase();
  return new Response(JSON.stringify(raw, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="nikexports-backup-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}

export async function POST(request) {
  if (!(await checkAuth())) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    restoreDatabase(data);
    return Response.json({ success: true, message: 'Database successfully restored from backup' });
  } catch (err) {
    return Response.json({ error: err.message || 'Failed to restore database' }, { status: 500 });
  }
}
