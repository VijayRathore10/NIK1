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
  if (ext === '.svg') return 'image/svg+xml';
  return 'image/jpeg';
}

function readFromLocal(filename) {
  // 1. Check /tmp/uploads (Cloud Run writable disk)
  try {
    const tmpPath = path.join('/tmp', 'uploads', filename);
    if (fs.existsSync(tmpPath)) {
      return fs.readFileSync(tmpPath);
    }
  } catch {}

  // 2. Check public/uploads (local dev / build artifacts)
  try {
    const publicPath = path.join(process.cwd(), 'public', 'uploads', filename);
    if (fs.existsSync(publicPath)) {
      return fs.readFileSync(publicPath);
    }
  } catch {}

  return null;
}

function writeToTmpCache(filename, buffer) {
  try {
    const tmpDir = path.join('/tmp', 'uploads');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(path.join(tmpDir, filename), buffer);
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
        headers: {
          'Content-Type': getMimeType(safeFilename),
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    // 2. Cloud recovery: Restore from Firestore database
    try {
      const docRef = doc(db, 'uploadedImages', safeFilename);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        let fullBase64 = data?.base64 || '';

        // If chunked into subcollection
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

          // Cache in writable /tmp directory for rapid subsequent hits
          writeToTmpCache(safeFilename, buffer);

          return new Response(buffer, {
            headers: {
              'Content-Type': data.contentType || getMimeType(safeFilename),
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
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
