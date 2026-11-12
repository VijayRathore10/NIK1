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
} from 'firebase/firestore';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

// Memory cache to ensure high-speed responses
let memoryStore = null;
let hasMigratedToFirestore = false;
let seedingInProgress = false;

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

// Helper to guard remote Firestore promises against hanging
function withTimeout(promise, ms = 1500, fallbackVal = null) {
  if (!promise || typeof promise.then !== 'function') {
    return Promise.resolve(fallbackVal);
  }
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallbackVal), ms)),
  ]);
}

// Standard Error Handler per Firebase Integration Skill
function handleFirestoreError(error, operationType, pathStr) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path: pathStr,
    timestamp: new Date().toISOString(),
  };
  console.warn('Firestore notice:', errInfo.operationType, errInfo.path, errInfo.error);
  return errInfo;
}

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

// Pre-warm local store into cache synchronously on module load for instant 0ms responses
try {
  const initial = loadLocalStore();
  if (initial) {
    cachedProducts = sortByPosition(initial.products || []);
    cachedCategories = sortByPosition(initial.categories || []);
    for (const p of cachedProducts) {
      if (p.slug) cachedSlugMap.set(String(p.slug).toLowerCase(), p);
      if (p._id) cachedSlugMap.set(String(p._id).toLowerCase(), p);
    }
    lastProductsFetchTime = Date.now();
    lastCategoriesFetchTime = Date.now();
  }
} catch {
  // Safe fallback
}

// Auto-seed initial data to Firestore in background without blocking requests
async function ensureFirestoreSeeded() {
  if (hasMigratedToFirestore || seedingInProgress || !db) return;
  seedingInProgress = true;

  try {
    const snap = await withTimeout(getDocs(collection(db, 'products')), 2000, null);
    if (snap && !snap.empty) {
      hasMigratedToFirestore = true;
      seedingInProgress = false;
      return;
    }

    // Only seed if we got an empty collection from Firestore
    if (snap && snap.empty) {
      const local = loadLocalStore();
      for (const p of local.products || []) {
        const id = p._id || p.slug;
        if (id) await setDoc(doc(db, 'products', id), p).catch(() => {});
      }
      for (const c of local.categories || []) {
        const id = c._id || c.slug;
        if (id) await setDoc(doc(db, 'categories', id), c).catch(() => {});
      }
      for (const t of local.testimonials || []) {
        if (t._id) await setDoc(doc(db, 'testimonials', t._id), t).catch(() => {});
      }
      if (local.siteSettings) {
        await setDoc(doc(db, 'siteSettings', 'global'), local.siteSettings).catch(() => {});
      }
      hasMigratedToFirestore = true;
    }
  } catch (err) {
    handleFirestoreError(err, 'write', 'migration_seed');
  } finally {
    seedingInProgress = false;
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

  // Pre-fetch fallback
  const store = loadLocalStore();
  const fallback = sortByPosition(store.products || []);

  try {
    ensureFirestoreSeeded().catch(() => {});
    if (db) {
      const snap = await withTimeout(getDocs(collection(db, 'products')), 1500, null);
      if (snap && !snap.empty) {
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
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'products');
  }

  cachedProducts = fallback;
  cachedSlugMap.clear();
  for (const p of fallback) {
    if (p.slug) cachedSlugMap.set(String(p.slug).toLowerCase(), p);
    if (p._id) cachedSlugMap.set(String(p._id).toLowerCase(), p);
  }
  lastProductsFetchTime = now;
  return fallback;
}

export async function getDbProductBySlug(slug) {
  if (!slug) return null;
  const lower = String(slug).toLowerCase();

  // Instant check from in-memory slug map
  const hit = cachedSlugMap.get(lower);
  if (hit) return hit;

  const all = await getDbProducts();
  return cachedSlugMap.get(lower) || all.find((p) => p.slug?.toLowerCase() === lower || String(p._id).toLowerCase() === lower) || null;
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
    if (db) {
      await withTimeout(setDoc(doc(db, 'products', id), product), 2000, null);
    }
  } catch (err) {
    handleFirestoreError(err, 'update', `products/${id}`);
  }

  const store = loadLocalStore();
  const prods = [...(store.products || [])];
  const idx = prods.findIndex((p) => p._id === id || p.slug === slug);
  if (idx >= 0) {
    prods[idx] = product;
  } else {
    prods.unshift(product);
  }
  saveLocalStore({ ...store, products: prods });
  invalidateProductsCache();

  return product;
}

export async function deleteDbProduct(id) {
  try {
    if (db) {
      await withTimeout(deleteDoc(doc(db, 'products', id)), 2000, null);
    }
  } catch (err) {
    handleFirestoreError(err, 'delete', `products/${id}`);
  }

  const store = loadLocalStore();
  const products = (store.products || []).filter((p) => p._id !== id && p.slug !== id);
  saveLocalStore({ ...store, products });
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

  const store = loadLocalStore();
  const fallback = sortByPosition(store.categories || []);

  try {
    ensureFirestoreSeeded().catch(() => {});
    if (db) {
      const snap = await withTimeout(getDocs(collection(db, 'categories')), 1500, null);
      if (snap && !snap.empty) {
        const cats = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
        const sorted = sortByPosition(cats);
        cachedCategories = sorted;
        lastCategoriesFetchTime = now;
        return sorted;
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'categories');
  }

  cachedCategories = fallback;
  lastCategoriesFetchTime = now;
  return fallback;
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
    if (db) {
      await withTimeout(setDoc(doc(db, 'categories', id), category), 2000, null);
    }
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
    if (db) {
      await withTimeout(deleteDoc(doc(db, 'categories', id)), 2000, null);
    }
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
  const store = loadLocalStore();
  const fallback = sortByPosition(store.testimonials || []);

  try {
    ensureFirestoreSeeded().catch(() => {});
    if (db) {
      const snap = await withTimeout(getDocs(collection(db, 'testimonials')), 1500, null);
      if (snap && !snap.empty) {
        const tests = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
        return sortByPosition(tests);
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'testimonials');
  }

  return fallback;
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
    if (db) {
      await withTimeout(setDoc(doc(db, 'testimonials', id), testimonial), 2000, null);
    }
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
    if (db) {
      await withTimeout(deleteDoc(doc(db, 'testimonials', id)), 2000, null);
    }
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
  const store = loadLocalStore();
  const fallback = store.siteSettings || {};

  try {
    ensureFirestoreSeeded().catch(() => {});
    if (db) {
      const snap = await withTimeout(getDoc(doc(db, 'siteSettings', 'global')), 1500, null);
      if (snap && snap.exists && snap.exists()) {
        return snap.data();
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'get', 'siteSettings/global');
  }

  return fallback;
}

export async function saveDbSiteSettings(settingsData) {
  const current = await getDbSiteSettings();
  const siteSettings = {
    ...current,
    ...settingsData,
  };

  try {
    if (db) {
      await withTimeout(setDoc(doc(db, 'siteSettings', 'global'), siteSettings), 2000, null);
    }
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
  const store = loadLocalStore();
  const fallback = store.inquiries || [];

  try {
    ensureFirestoreSeeded().catch(() => {});
    if (db) {
      const snap = await withTimeout(getDocs(collection(db, 'inquiries')), 1500, null);
      if (snap && !snap.empty) {
        const inqs = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
        return inqs.sort(
          (a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)
        );
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'inquiries');
  }

  return fallback;
}

export async function addDbInquiry(inquiryData) {
  const id = `inq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const inquiry = {
    ...inquiryData,
    _id: id,
    submittedAt: new Date().toISOString(),
  };

  try {
    if (db) {
      await withTimeout(setDoc(doc(db, 'inquiries', id), inquiry), 2000, null);
    }
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
    if (db) {
      await withTimeout(deleteDoc(doc(db, 'inquiries', id)), 2000, null);
    }
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
