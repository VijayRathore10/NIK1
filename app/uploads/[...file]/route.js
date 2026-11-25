import fs from 'fs';
import path from 'path';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.avif') return 'image/avif';
  if (ext === '.bmp') return 'image/bmp';
  if (ext === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

function buildSecurityHeaders(contentType) {
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  };
  if (contentType === 'image/svg+xml') {
    headers['Content-Security-Policy'] = "default-src 'none'; sandbox";
  }
  return headers;
}

function readFromLocal(filename) {
  const safeName = path.basename(filename);

  try {
    const tmpDir = path.resolve('/tmp', 'uploads');
    const tmpPath = path.resolve(tmpDir, safeName);
    if (tmpPath.startsWith(tmpDir + path.sep) && fs.existsSync(tmpPath)) {
      return fs.readFileSync(tmpPath);
    }
  } catch {}

  try {
    const publicDir = path.resolve(process.cwd(), 'public', 'uploads');
    const publicPath = path.resolve(publicDir, safeName);
    if (publicPath.startsWith(publicDir + path.sep) && fs.existsSync(publicPath)) {
      return fs.readFileSync(publicPath);
    }
  } catch {}

  return null;
}

function writeToTmpCache(filename, buffer) {
  try {
    const safeName = path.basename(filename);
    const tmpDir = path.resolve('/tmp', 'uploads');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const target = path.resolve(tmpDir, safeName);
    if (target.startsWith(tmpDir + path.sep)) {
      fs.writeFileSync(target, buffer);
    }
  } catch (err) {
    console.warn('Could not cache to /tmp/uploads:', err?.message);
  }
}

export async function GET(request, context) {
  try {
    const params = await context.params;
    const fileSegments = Array.isArray(params?.file) ? params.file : [params?.file];
    const filename = fileSegments.filter(Boolean).join('/');

    if (!filename) {
      return new Response('Not Found', { status: 404 });
    }

    const safeFilename = path.basename(filename);

    // 1. Fast path: Read from local /tmp or public disk
    const localBuffer = readFromLocal(safeFilename);
    if (localBuffer) {
      return new Response(localBuffer, {
        headers: buildSecurityHeaders(getMimeType(safeFilename)),
      });
    }

    // 2. Cloud recovery: Restore from Firestore database
    try {
      const docRef = doc(db, 'uploadedImages', safeFilename);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        let fullBase64 = data?.base64 || '';

        if (data?.isChunked && data?.totalChunks) {
          const chunksCol = collection(db, 'uploadedImages', safeFilename, 'chunks');
          const chunksSnap = await getDocs(chunksCol);
          const chunkMap = {};
          chunksSnap.forEach((c) => {
            const chunkData = c.data();
            chunkMap[chunkData.index] = chunkData.chunk;
          });

          fullBase64 = '';
          for (let i = 0; i < data.totalChunks; i++) {
            fullBase64 += chunkMap[i] || '';
          }
        }

        if (fullBase64) {
          const buffer = Buffer.from(fullBase64, 'base64');
          writeToTmpCache(safeFilename, buffer);

          const mime = data.contentType || getMimeType(safeFilename);
          return new Response(buffer, {
            headers: buildSecurityHeaders(mime),
          });
        }
      }
    } catch (restoreErr) {
      console.warn('Firestore image restoration warning:', restoreErr?.message);
    }

    return new Response('Image Not Found', { status: 404 });
  } catch (err) {
    console.error('Error serving upload:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
