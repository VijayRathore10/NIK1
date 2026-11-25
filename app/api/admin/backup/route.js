import { revalidatePath } from 'next/cache';
import { getRawDatabase, restoreDatabase } from '@/lib/db';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';

export async function GET(request) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  try {
    const raw = await getRawDatabase();
    return new Response(JSON.stringify(raw, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="nikexports-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (err) {
    console.error('[Admin Backup] Failed to export backup:', err);
    return Response.json({ error: 'Failed to generate backup' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse();
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ error: 'Invalid backup JSON payload' }, { status: 400 });
  }

  try {
    await restoreDatabase(data);
    revalidatePath('/', 'layout');
    return Response.json({ success: true, message: 'Database successfully restored from backup' });
  } catch (err) {
    console.error('[Admin Backup] Failed to restore database:', err);
    return Response.json({ error: 'Failed to restore database' }, { status: 500 });
  }
}
