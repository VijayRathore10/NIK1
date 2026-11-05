import fs from 'fs';
import path from 'path';
import { db } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  getDocFromServer,
} from 'firebase/firestore';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

// Memory cache to ensure high-speed responses
let memoryStore = null;
let hasMigratedToFirestore = false;

// Fast in-memory cache for product data with 60s TTL
let cachedProducts = null;
let cachedSlugMap = new Map();
let lastProductsFetchTime = 0;
const PRODUCTS_CACHE_TTL = 60 * 1000; // 60s

export function invalidateProductsCache() {
  cachedProducts = null;
  cachedSlugMap.clear();
  lastProductsFetchTime = 0;
}

// Fast in-memory cache for category data
let cachedCategories = null;
let lastCategoriesFetchTime = 0;

export function invalidateCategoriesCache() {
  cachedCategories = null;
  lastCategoriesFetchTime = 0;
}

// Standard Error Handler per Firebase Integration Skill
function handleFirestoreError(error, operationType, pathStr) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path: pathStr,
    timestamp: new Date().toISOString(),
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

// Quick connection test
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database initializing.');
    }
  }
}
testFirestoreConnection().catch(() => {});

// Load local fallback / seed
function loadLocalStore() {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      memoryStore = JSON.parse(raw);
      return memoryStore;
    }
    if (fs.existsSync(SEED_FILE)) {
      const raw = fs.readFileSync(SEED_FILE, 'utf-8');
      memoryStore = JSON.parse(raw);
      return memoryStore;
    }
  } catch (err) {
    console.error('[DB] Error reading local store:', err?.message || err);
  }

  return {
    categories: [],
    products: [],
    testimonials: [],
    siteSettings: {},
    inquiries: [],
  };
}

function saveLocalStore(data) {
  memoryStore = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error writing to store.json:', err?.message || err);
  }
}

// Helper to sort items basis position numbering system (1, 2, 3...)
function sortByPosition(items = []) {
  return [...items].sort((a, b) => {
    const hasA = a.order !== undefined && a.order !== null && a.order !== '';
    const hasB = b.order !== undefined && b.order !== null && b.order !== '';
    const orderA = hasA ? Number(a.order) : Infinity;
    const orderB = hasB ? Number(b.order) : Infinity;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    const dateA = new Date(a.updatedAt || a._updatedAt || a._createdAt || 0).getTime();
    const dateB = new Date(b.updatedAt || b._updatedAt || b._createdAt || 0).getTime();
    return dateB - dateA;
  });
}

// Auto-seed initial data to Firestore if Firestore is empty on first boot
async function ensureFirestoreSeeded() {
  if (hasMigratedToFirestore) return;

  try {
    const prodsSnap = await getDocs(collection(db, 'products'));
    if (!prodsSnap.empty) {
      hasMigratedToFirestore = true;
      return;
    }

    // Firestore is empty; seed current data
    console.log('[Firebase] Empty Firestore detected. Migrating initial data to Firestore...');
    const local = loadLocalStore();

    // 1. Seed Products
    for (const p of local.products || []) {
      const id = p._id || p.slug;
      if (id) {
        await setDoc(doc(db, 'products', id), p);
      }
    }

    // 2. Seed Categories
    for (const c of local.categories || []) {
      const id = c._id || c.slug;
      if (id) {
        await setDoc(doc(db, 'categories', id), c);
      }
    }

    // 3. Seed Testimonials
    for (const t of local.testimonials || []) {
      const id = t._id;
      if (id) {
        await setDoc(doc(db, 'testimonials', id), t);
      }
    }

    // 4. Seed Site Settings
    if (local.siteSettings) {
      await setDoc(doc(db, 'siteSettings', 'global'), local.siteSettings);
    }

    // 5. Seed Inquiries
    for (const inq of local.inquiries || []) {
      if (inq._id) {
        await setDoc(doc(db, 'inquiries', inq._id), inq);
      }
    }

    hasMigratedToFirestore = true;
    console.log('[Firebase] Migration to Firestore complete!');
  } catch (err) {
    handleFirestoreError(err, 'write', 'migration_seed');
  }
}

// ==========================================
// PRODUCTS CRUD
// ==========================================

export async function getDbProducts(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedProducts && (now - lastProductsFetchTime < PRODUCTS_CACHE_TTL)) {
    return cachedProducts;
  }

  try {
    await ensureFirestoreSeeded();
    const snap = await getDocs(collection(db, 'products'));
    if (!snap.empty) {
      const prods = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
      const sorted = sortByPosition(prods);
      cachedProducts = sorted;
      cachedSlugMap.clear();
      for (const p of sorted) {
        if (p.slug) cachedSlugMap.set(String(p.slug).toLowerCase(), p);
        if (p._id) cachedSlugMap.set(String(p._id).toLowerCase(), p);
      }
      lastProductsFetchTime = now;
      return sorted;
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'products');
  }

  // Fallback to local
  const store = loadLocalStore();
  const sorted = sortByPosition(store.products || []);
  cachedProducts = sorted;
  cachedSlugMap.clear();
  for (const p of sorted) {
    if (p.slug) cachedSlugMap.set(String(p.slug).toLowerCase(), p);
    if (p._id) cachedSlugMap.set(String(p._id).toLowerCase(), p);
  }
  lastProductsFetchTime = now;
  return sorted;
}

export async function getDbProductBySlug(slug) {
  if (!slug) return null;
  const lower = String(slug).toLowerCase();

  // 1. Instant check from in-memory slug map if cache is warm
  const now = Date.now();
  if (cachedProducts && (now - lastProductsFetchTime < PRODUCTS_CACHE_TTL)) {
    const hit = cachedSlugMap.get(lower);
    if (hit) return hit;
  }

  // 2. Refresh or warm up products cache (single query, index populated)
  const all = await getDbProducts();
  const hit = cachedSlugMap.get(lower) || all.find((p) => p.slug?.toLowerCase() === lower || String(p._id).toLowerCase() === lower);
  return hit || null;
}

export async function getDbProductsByCategory(categorySlug) {
  const all = await getDbProducts();
  const lower = categorySlug?.toLowerCase();
  const matched = all.filter(
    (p) => (p.category?.slug || p.category)?.toLowerCase() === lower
  );
  return sortByPosition(matched);
}

export async function saveDbProduct(productData) {
  // Clean specifications: filter out completely blank rows, max 30 rows
  const cleanedSpecs = (productData.specifications || [])
    .filter((s) => s && ((s.label && s.label.trim()) || (s.value && s.value.trim())))
    .slice(0, 30)
    .map((s) => ({
      label: (s.label || '').trim(),
      value: (s.value || '').trim(),
    }));

  let productOrder = null;
  if (
    productData.order !== undefined &&
    productData.order !== null &&
    productData.order !== ''
  ) {
    const parsed = Number(productData.order);
    if (!Number.isNaN(parsed)) {
      productOrder = parsed;
    }
  }

  const id = productData._id || `prod-${Date.now()}`;
  const slug = productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const product = {
    ...productData,
    _id: id,
    slug,
    order: productOrder,
    specifications: cleanedSpecs,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'products', id), product);
  } catch (err) {
    handleFirestoreError(err, 'update', `products/${id}`);
  }

  // Keep local store synchronized as persistent backup
  const store = loadLocalStore();
  const prods = [...(store.products || [])];
  const idx = prods.findIndex((p) => p._id === id || p.slug === slug);
  if (idx >= 0) {
    prods[idx] = product;
  } else {
    prods.unshift(product);
  }
  saveLocalStore({ ...store, products: prods });

  // Invalidate in-memory cache so updates immediately propagate everywhere
  invalidateProductsCache();

  return product;
}

export async function deleteDbProduct(id) {
  try {
    await deleteDoc(doc(db, 'products', id));
  } catch (err) {
    handleFirestoreError(err, 'delete', `products/${id}`);
  }

  const store = loadLocalStore();
  const products = (store.products || []).filter((p) => p._id !== id && p.slug !== id);
  saveLocalStore({ ...store, products });

  // Invalidate in-memory cache
  invalidateProductsCache();

  return true;
}

// ==========================================
// CATEGORIES CRUD
// ==========================================

export async function getDbCategories(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedCategories && (now - lastCategoriesFetchTime < PRODUCTS_CACHE_TTL)) {
    return cachedCategories;
  }

  try {
    await ensureFirestoreSeeded();
    const snap = await getDocs(collection(db, 'categories'));
    if (!snap.empty) {
      const cats = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
      const sorted = sortByPosition(cats);
      cachedCategories = sorted;
      lastCategoriesFetchTime = now;
      return sorted;
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'categories');
  }

  const store = loadLocalStore();
  const sorted = sortByPosition(store.categories || []);
  cachedCategories = sorted;
  lastCategoriesFetchTime = now;
  return sorted;
}

export async function getDbCategoryBySlug(slug) {
  const cats = await getDbCategories();
  const lower = slug?.toLowerCase();
  return cats.find((c) => c.slug?.toLowerCase() === lower || c._id === slug) || null;
}

export async function saveDbCategory(categoryData) {
  const id = categoryData._id || `cat-${Date.now()}`;
  const slug = categoryData.slug || categoryData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const category = {
    ...categoryData,
    _id: id,
    slug,
  };

  try {
    await setDoc(doc(db, 'categories', id), category);
  } catch (err) {
    handleFirestoreError(err, 'update', `categories/${id}`);
  }

  const store = loadLocalStore();
  const categories = [...(store.categories || [])];
  const idx = categories.findIndex((c) => c._id === id || c.slug === slug);
  if (idx >= 0) {
    categories[idx] = category;
  } else {
    categories.push(category);
  }
  saveLocalStore({ ...store, categories });

  invalidateCategoriesCache();

  return category;
}

export async function deleteDbCategory(id) {
  try {
    await deleteDoc(doc(db, 'categories', id));
  } catch (err) {
    handleFirestoreError(err, 'delete', `categories/${id}`);
  }

  const store = loadLocalStore();
  const categories = (store.categories || []).filter((c) => c._id !== id && c.slug !== id);
  saveLocalStore({ ...store, categories });

  invalidateCategoriesCache();

  return true;
}

// ==========================================
// TESTIMONIALS CRUD
// ==========================================

export async function getDbTestimonials() {
  try {
    await ensureFirestoreSeeded();
    const snap = await getDocs(collection(db, 'testimonials'));
    if (!snap.empty) {
      const tests = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
      return sortByPosition(tests);
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'testimonials');
  }

  const store = loadLocalStore();
  return sortByPosition(store.testimonials || []);
}

export async function saveDbTestimonial(testimonialData) {
  let testiOrder = null;
  if (
    testimonialData.order !== undefined &&
    testimonialData.order !== null &&
    testimonialData.order !== ''
  ) {
    const parsed = Number(testimonialData.order);
    if (!Number.isNaN(parsed)) {
      testiOrder = parsed;
    }
  }

  const id = testimonialData._id || `testi-${Date.now()}`;
  const testimonial = {
    ...testimonialData,
    _id: id,
    order: testiOrder,
    photos: (testimonialData.photos || []).slice(0, 4),
  };

  try {
    await setDoc(doc(db, 'testimonials', id), testimonial);
  } catch (err) {
    handleFirestoreError(err, 'update', `testimonials/${id}`);
  }

  const store = loadLocalStore();
  const testimonials = [...(store.testimonials || [])];
  const idx = testimonials.findIndex((t) => t._id === id);
  if (idx >= 0) {
    testimonials[idx] = testimonial;
  } else {
    testimonials.push(testimonial);
  }
  saveLocalStore({ ...store, testimonials });

  return testimonial;
}

export async function deleteDbTestimonial(id) {
  try {
    await deleteDoc(doc(db, 'testimonials', id));
  } catch (err) {
    handleFirestoreError(err, 'delete', `testimonials/${id}`);
  }

  const store = loadLocalStore();
  const testimonials = (store.testimonials || []).filter((t) => t._id !== id);
  saveLocalStore({ ...store, testimonials });
  return true;
}

// ==========================================
// SITE SETTINGS CRUD
// ==========================================

export async function getDbSiteSettings() {
  try {
    await ensureFirestoreSeeded();
    const snap = await getDoc(doc(db, 'siteSettings', 'global'));
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    handleFirestoreError(err, 'get', 'siteSettings/global');
  }

  const store = loadLocalStore();
  return store.siteSettings || {};
}

export async function saveDbSiteSettings(settingsData) {
  const current = await getDbSiteSettings();
  const siteSettings = {
    ...current,
    ...settingsData,
  };

  try {
    await setDoc(doc(db, 'siteSettings', 'global'), siteSettings);
  } catch (err) {
    handleFirestoreError(err, 'update', 'siteSettings/global');
  }

  const store = loadLocalStore();
  saveLocalStore({ ...store, siteSettings });

  return siteSettings;
}

// ==========================================
// INQUIRIES / LEADS
// ==========================================

export async function getDbInquiries() {
  try {
    await ensureFirestoreSeeded();
    const snap = await getDocs(collection(db, 'inquiries'));
    if (!snap.empty) {
      const inqs = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
      return inqs.sort(
        (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
      );
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'inquiries');
  }

  const store = loadLocalStore();
  return store.inquiries || [];
}

export async function addDbInquiry(inquiryData) {
  const id = `inq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const inquiry = {
    ...inquiryData,
    _id: id,
    submittedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'inquiries', id), inquiry);
  } catch (err) {
    handleFirestoreError(err, 'create', `inquiries/${id}`);
  }

  const store = loadLocalStore();
  const inquiries = [...(store.inquiries || [])];
  inquiries.unshift(inquiry);
  saveLocalStore({ ...store, inquiries });

  return inquiry;
}

export async function deleteDbInquiry(id) {
  try {
    await deleteDoc(doc(db, 'inquiries', id));
  } catch (err) {
    handleFirestoreError(err, 'delete', `inquiries/${id}`);
  }

  const store = loadLocalStore();
  const inquiries = (store.inquiries || []).filter((inq) => inq._id !== id);
  saveLocalStore({ ...store, inquiries });
  return true;
}

// ==========================================
// BACKUP / RESTORE
// ==========================================

export async function getRawDatabase() {
  const [products, categories, testimonials, siteSettings, inquiries] =
    await Promise.all([
      getDbProducts(),
      getDbCategories(),
      getDbTestimonials(),
      getDbSiteSettings(),
      getDbInquiries(),
    ]);

  return {
    categories,
    products,
    testimonials,
    siteSettings,
    inquiries,
  };
}

export async function restoreDatabase(fullJson) {
  if (!fullJson || typeof fullJson !== 'object') {
    throw new Error('Invalid database format');
  }

  if (Array.isArray(fullJson.products)) {
    for (const p of fullJson.products) {
      await saveDbProduct(p);
    }
  }
  if (Array.isArray(fullJson.categories)) {
    for (const c of fullJson.categories) {
      await saveDbCategory(c);
    }
  }
  if (Array.isArray(fullJson.testimonials)) {
    for (const t of fullJson.testimonials) {
      await saveDbTestimonial(t);
    }
  }
  if (fullJson.siteSettings) {
    await saveDbSiteSettings(fullJson.siteSettings);
  }

  saveLocalStore(fullJson);
  invalidateProductsCache();
  return true;
}
