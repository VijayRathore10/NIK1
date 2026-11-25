import fs from 'fs';
import path from 'path';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { verifyAdminRequest, unauthorizedResponse } from '@/lib/adminAuth';

const CHUNK_SIZE = 650 * 1024; // 650KB chunks for Firestore 1MB doc limit safety
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB maximum per uploaded image

// Raster formats only — SVG disallowed to prevent stored XSS
const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.heic',
  '.avif',
  '.bmp',
]);

function isBlockedSvg(filename = '', mime = '') {
  const lowerMime = String(mime || '').toLowerCase();
  const ext = path.extname(filename || '').toLowerCase();
  return ext === '.svg' || lowerMime.includes('svg');
}

function resolveSafeImageExt(filename, mime = '') {
  const rawExt = path.extname(filename || '').toLowerCase();
  if (ALLOWED_IMAGE_EXTENSIONS.has(rawExt)) {
    return rawExt;
  }
  const lowerMime = String(mime || '').toLowerCase();
  if (lowerMime.includes('jpeg') || lowerMime.includes('jpg')) return '.jpg';
  if (lowerMime.includes('png')) return '.png';
  if (lowerMime.includes('webp')) return '.webp';
  if (lowerMime.includes('gif')) return '.gif';
  if (lowerMime.includes('avif')) return '.avif';
  if (lowerMime.includes('heic')) return '.heic';
  if (lowerMime.includes('bmp')) return '.bmp';
  return '.jpg';
}

function resolveSafeMime(ext, rawMime = '') {
  const lower = String(rawMime || '').toLowerCase();
  if (lower.startsWith('image/') && !lower.includes('svg')) {
    return lower.slice(0, 64);
  }
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.avif') return 'image/avif';
  if (ext === '.bmp') return 'image/bmp';
  return 'image/jpeg';
}

// Safely write to local disk with path confinement and without crashing on read-only filesystems (Cloud Run EROFS)
function safeSaveToDisk(filename, buffer) {
  const safeName = path.basename(filename);

  try {
    const tmpDir = path.resolve('/tmp', 'uploads');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const targetPath = path.resolve(tmpDir, safeName);
    if (targetPath.startsWith(tmpDir + path.sep)) {
      fs.writeFileSync(targetPath, buffer);
    }
  } catch (tmpErr) {
    console.warn('Could not write to /tmp/uploads:', tmpErr?.message);
  }

  try {
    const publicDir = path.resolve(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    const targetPath = path.resolve(publicDir, safeName);
    if (targetPath.startsWith(publicDir + path.sep)) {
      fs.writeFileSync(targetPath, buffer);
    }
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
      await setDoc(docRef, {
        filename,
        contentType: mimeType || 'image/jpeg',
        base64: base64Data,
        size: buffer.length,
        isChunked: false,
        createdAt: new Date().toISOString(),
      });
    } else {
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
  if (!(await verifyAdminRequest(request))) {
    return unauthorizedResponse('Unauthorized. Please log in to admin again.');
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    const uploadedUrls = [];

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null);
      if (!body) {
        return Response.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }
      const rawList = Array.isArray(body.files) ? body.files : body.file ? [body.file] : [];

      for (const item of rawList) {
        if (!item?.data || typeof item.data !== 'string') continue;
        if (isBlockedSvg(item.name, item.type)) {
          return Response.json(
            { error: 'SVG uploads are not permitted. Please upload JPG, PNG, WEBP, GIF, or AVIF.' },
            { status: 400 }
          );
        }

        const cleanBase64 = item.data.replace(/^data:image\/[a-z0-9-+.]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');

        if (buffer.length === 0) continue;
        if (buffer.length > MAX_FILE_SIZE_BYTES) {
          return Response.json(
            { error: 'Image exceeds the 8 MB maximum file size limit.' },
            { status: 413 }
          );
        }

        const ext = resolveSafeImageExt(item.name || '', item.type);
        const mime = resolveSafeMime(ext, item.type);

        const originalBase = path
          .basename(item.name || 'image', path.extname(item.name || ''))
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .toLowerCase()
          .slice(0, 32);

        const uniqueName = `${originalBase || 'img'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;

        safeSaveToDisk(uniqueName, buffer);
        await saveToFirestore(uniqueName, buffer, mime);

        uploadedUrls.push(`/uploads/${uniqueName}`);
      }
    } else {
      const formData = await request.formData();
      const files = formData.getAll('files');
      const singleFile = formData.get('file');
      const fileList = files.length > 0 ? files : singleFile ? [singleFile] : [];

      if (fileList.length === 0) {
        return Response.json({ error: 'No files provided for upload' }, { status: 400 });
      }

      for (const file of fileList) {
        if (!file || typeof file.arrayBuffer !== 'function') continue;

        if (isBlockedSvg(file.name, file.type)) {
          return Response.json(
            { error: 'SVG uploads are not permitted. Please upload JPG, PNG, WEBP, GIF, or AVIF.' },
            { status: 400 }
          );
        }

        if (typeof file.size === 'number' && file.size > MAX_FILE_SIZE_BYTES) {
          return Response.json(
            { error: 'Image exceeds the 8 MB maximum file size limit.' },
            { status: 413 }
          );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        if (buffer.length === 0) continue;
        if (buffer.length > MAX_FILE_SIZE_BYTES) {
          return Response.json(
            { error: 'Image exceeds the 8 MB maximum file size limit.' },
            { status: 413 }
          );
        }

        const ext = resolveSafeImageExt(file.name || '', file.type);
        const mime = resolveSafeMime(ext, file.type);

        const originalBase = path
          .basename(file.name || 'image', path.extname(file.name || ''))
          .replace(/[^a-zA-Z0-9-_]/g, '-')
          .toLowerCase()
          .slice(0, 32);

        const uniqueName = `${originalBase || 'img'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}${ext}`;

        safeSaveToDisk(uniqueName, buffer);
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
    console.error('[Upload] File upload failed:', err);
    return Response.json({ error: 'File upload failed. Please try again.' }, { status: 500 });
  }
}
