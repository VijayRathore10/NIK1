import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const configPath = path.join(rootDir, 'firebase-applet-config.json');
const storePath = path.join(rootDir, 'data', 'store.json');

const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const storeData = JSON.parse(fs.readFileSync(storePath, 'utf-8'));

console.log('[Seed] Connecting to Firebase project:', firebaseConfig.projectId);
console.log('[Seed] Firestore database ID:', firebaseConfig.firestoreDatabaseId);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runSeed() {
  let prodCount = 0;
  let catCount = 0;
  let testiCount = 0;
  let inqCount = 0;

  // 1. Seed Products
  for (const product of storeData.products || []) {
    const id = product._id || product.slug;
    if (id) {
      await setDoc(doc(db, 'products', id), product);
      prodCount++;
      console.log(`  + Product [${prodCount}]: ${product.name} (id: ${id})`);
    }
  }

  // 2. Seed Categories
  for (const cat of storeData.categories || []) {
    const id = cat._id || cat.slug;
    if (id) {
      await setDoc(doc(db, 'categories', id), cat);
      catCount++;
      console.log(`  + Category [${catCount}]: ${cat.title} (id: ${id})`);
    }
  }

  // 3. Seed Testimonials
  for (const test of storeData.testimonials || []) {
    const id = test._id || `testi-${testiCount + 1}`;
    await setDoc(doc(db, 'testimonials', id), test);
    testiCount++;
    console.log(`  + Testimonial [${testiCount}]: ${test.name}`);
  }

  // 4. Seed Site Settings
  if (storeData.siteSettings) {
    await setDoc(doc(db, 'siteSettings', 'global'), storeData.siteSettings);
    console.log('  + Site Settings saved to siteSettings/global');
  }

  // 5. Seed Inquiries if any
  for (const inq of storeData.inquiries || []) {
    if (inq._id) {
      await setDoc(doc(db, 'inquiries', inq._id), inq);
      inqCount++;
      console.log(`  + Inquiry [${inqCount}]: ${inq.name}`);
    }
  }

  // Verify by reading back from Firestore
  const verifyProds = await getDocs(collection(db, 'products'));
  const verifyCats = await getDocs(collection(db, 'categories'));
  const verifyTests = await getDocs(collection(db, 'testimonials'));

  console.log('\n--- VERIFICATION RESULT ---');
  console.log(`Products in Firestore: ${verifyProds.size}`);
  console.log(`Categories in Firestore: ${verifyCats.size}`);
  console.log(`Testimonials in Firestore: ${verifyTests.size}`);
  console.log('--- ALL DATA RESTORED & PERSISTED IN FIREBASE FIRESTORE SUCCESSFULLY! ---');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
