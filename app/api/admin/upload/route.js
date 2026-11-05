import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

const AUTH_COOKIE = 'nik_admin_auth';
const TOKEN_VALUE = 'nik-authorized-session-token-v1';
const CHUNK_SIZE = 650 * 1024; // 650KB chunks for Firestore 1MB doc limit safety

async function checkAuth(request) {
  try {
    const headerToken =
      request.headers.get('x-admin-token') ||
      request.headers.get('authorization')?.replace('Bearer ', '');
    if (headerToken === TOKEN_VALUE) {
      return true;
    }

    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE);
    if (token?.value === TOKEN_VALUE) {
      return true;
    }
  } catch (err) {
    console.warn('Auth check warning:', err?.message || err);
  }
  return false;
}

// Safely write to local disk without crashing on read-only filesystems (Cloud Run EROFS)
function safeSaveToDisk(filename, buffer) {
  // 1. Write to /tmp/uploads (guaranteed writable in Linux/Cloud Run environments)
  try {
    const tmpDir = path.join('/tmp', 'uploads');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(path.join(tmpDir, filename), buffer);
  } catch (tmpErr) {
    console.warn('Could not write to /tmp/uploads:', tmpErr?.message);
  }

  // 2. Attempt write to public/uploads (works in local dev, ignored on EROFS read-only containers)
  try {
    const publicDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(path.join(publicDir, filename), buffer);
  } catch {
    // EROFS (Read-only file system) in Cloud Run - safely ignore because /tmp and Firestore handle it
  }
}

// Persist image permanently in Firestore database
async function saveToFirestore(filename, buffer, mimeType) {
  try {
    const base64Data = buffer.toString('base64');
    const docRef = doc(db, 'uploadedImages', filename);

    if (base64Data.length <= 800 * 1024) {
      // Direct single-document storage
      await setDoc(docRef, {
        filename,
        contentType: mimeType || 'image/jpeg',
        base64: base64Data,
        size: buffer.length,
        isChunked: false,
        createdAt: new Date().toISOString(),
      });
    } else {
      // Chunked storage for large images (>800KB base64)
      const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
      await setDoc(docRef, {
        filename,
        contentType: mimeType || 'image/jpeg',
        size: buffer.length,
        isChunked: true,
        totalChunks,
        createdAt: new Date().toISOString(),
      });

      for (let i = 0; i < totalChunks; i++) {
        const chunk = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        const chunkRef = doc(db, 'uploadedImages', filename, 'chunks', String(i));
        await setDoc(chunkRef, { index: i, chunk });
      }
    }
  } catch (err) {
    console.warn('[Firestore upload persistence warning]:', err?.message || err);
  }
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!(await checkAuth(request))) {
    return Response.json({ error: 'Unauthorized. Please log in to admin again.' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    const uploadedUrls = [];

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const rawList = Array.isArray(body.files) ? body.files : (body.file ? [body.file] : []);

      for (const item of rawList) {
        if (!item?.data) continue;
        const cleanBase64 = item.data.replace(/^data:image\/[a-z0-9-+.]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        const mime = item.type || 'image/jpeg';
        let ext = path.extname(item.name || '').toLowerCase() || '.webp';

        const originalBase = path
          .basename(item.name || 'image', ext)
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .toLowerCase()
          .slice(0, 32);

        const uniqueName = `${originalBase || 'img'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;

        // Safe disk save (no EROFS crash)
        safeSaveToDisk(uniqueName, buffer);

        // Firestore persistent cloud save
        await saveToFirestore(uniqueName, buffer, mime);

        uploadedUrls.push(`/uploads/${uniqueName}`);
      }
    } else {
      const formData = await request.formData();
      const files = formData.getAll('files');
      const singleFile = formData.get('file');
      const fileList = files.length > 0 ? files : (singleFile ? [singleFile] : []);

      if (fileList.length === 0) {
        return Response.json({ error: 'No files provided for upload' }, { status: 400 });
      }

      for (const file of fileList) {
        if (!file || typeof file.arrayBuffer !== 'function') continue;

        const buffer = Buffer.from(await file.arrayBuffer());
        const mime = file.type || '';

        let ext = path.extname(file.name || '').toLowerCase();
        if (!ext) {
          if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
          else if (mime.includes('png')) ext = '.png';
          else if (mime.includes('webp')) ext = '.webp';
          else if (mime.includes('gif')) ext = '.gif';
          else if (mime.includes('svg')) ext = '.svg';
          else ext = '.jpg';
        }

        const originalBase = path
          .basename(file.name || 'image', ext)
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .toLowerCase()
          .slice(0, 32);

        const uniqueName = `${originalBase || 'img'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;

        // Safe disk save (no EROFS crash)
        safeSaveToDisk(uniqueName, buffer);

        // Firestore persistent cloud save
        await saveToFirestore(uniqueName, buffer, mime);

        uploadedUrls.push(`/uploads/${uniqueName}`);
      }
    }

    if (uploadedUrls.length === 0) {
      return Response.json({ error: 'No valid image files could be processed' }, { status: 400 });
    }

    return Response.json({
      success: true,
      urls: uploadedUrls,
      url: uploadedUrls[0] || null,
      count: uploadedUrls.length,
    });
  } catch (err) {
    console.error('File upload failed:', err);
    return Response.json({ error: err.message || 'File upload failed' }, { status: 500 });
  }
}
