import { cookies } from 'next/headers';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const AUTH_COOKIE = 'nik_admin_auth';
const TOKEN_VALUE = 'nik-authorized-session-token-v1';

export async function POST(request) {
  try {
    const { password } = await request.json();

    if (password === ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set(AUTH_COOKIE, TOKEN_VALUE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Incorrect administrator password' }, { status: 401 });
  } catch (err) {
    return Response.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

export async function GET(request) {
  const headerToken =
    request.headers.get('x-admin-token') ||
    request.headers.get('authorization')?.replace('Bearer ', '');
  if (headerToken === TOKEN_VALUE) {
    return Response.json({ authenticated: true });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE);
  const isAuthenticated = token?.value === TOKEN_VALUE;
  return Response.json({ authenticated: isAuthenticated });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  return Response.json({ success: true });
}
