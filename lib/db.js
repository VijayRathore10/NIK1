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
  query,
  where,
  limit,
  writeBatch,
} from 'firebase/firestore';
import {
  sanitizeProductPayload,
  sanitizeCategoryPayload,
  sanitizeTestimonialPayload,
  sanitizeSiteSettingsPayload,
} from './validation';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

// In-memory store
let memoryStore = null;

// Cache TTL (60s) — mutations call invalidate*Cache() + Next.js revalidatePath() immediately
const CACHE_TTL = 60 * 1000;

let cachedProducts = null;
let cachedSlugMap = new Map();
let lastProductsFetchTime = 0;

let cachedCategories = null;
let lastCategoriesFetchTime = 0;

let cachedSettings = null;
let lastSettingsFetchTime = 0;

let cachedTestimonials = null;
let lastTestimonialsFetchTime = 0;

export function invalidateProductsCache() {
  cachedProducts = null;
  cachedSlugMap.clear();
  lastProductsFetchTime = 0;
}

export function invalidateCategoriesCache() {
  cachedCategories = null;
  lastCategoriesFetchTime = 0;
}

export function invalidateSettingsCache() {
  cachedSettings = null;
  lastSettingsFetchTime = 0;
}

export function invalidateTestimonialsCache() {
  cachedTestimonials = null;
  lastTestimonialsFetchTime = 0;
}

// Helper to guard remote Firestore promises with a 6-second timeout
function withTimeout(promise, ms = 6000, fallbackVal = null) {
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
  console.warn('[Firestore]', errInfo.operationType, errInfo.path, errInfo.error);
  return errInfo;
}

// Load local fallback / seed (read-only on fallback paths; no blocking writes during reads)
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

// Write local backup only on explicit write mutations (non-fatal on read-only containers)
function saveLocalStore(data) {
  memoryStore = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Ignore EROFS on read-only serverless/Cloud Run containers; Firestore is the primary store
  }
}

// Helper to sort items by position numbering (1, 2, 3...)
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

// Sync in-memory map with a list of products
function updateProductMaps(prods) {
  cachedProducts = prods;
  cachedSlugMap.clear();
  for (const p of prods) {
    if (p.slug) cachedSlugMap.set(String(p.slug).toLowerCase(), p);
    if (p._id) cachedSlugMap.set(String(p._id).toLowerCase(), p);
  }
}

// ==========================================
// PRODUCTS CRUD
// ==========================================

export async function getDbProducts(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedProducts && now - lastProductsFetchTime < CACHE_TTL) {
    return cachedProducts;
  }

  // 1. Primary: Fetch live data directly from Firestore
  try {
    if (db) {
      const snap = await withTimeout(getDocs(collection(db, 'products')), 6000, null);
      if (snap && !snap.empty) {
        const prods = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
        const sorted = sortByPosition(prods);
        updateProductMaps(sorted);
        lastProductsFetchTime = Date.now();
        return sorted;
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'products');
  }

  // 2. Fallback: cached or local seed store
  if (cachedProducts && cachedProducts.length > 0) {
    return cachedProducts;
  }

  const store = loadLocalStore();
  const sorted = sortByPosition(store.products || []);
  updateProductMaps(sorted);
  lastProductsFetchTime = now;
  return sorted;
}

export async function getDbProductBySlug(slug) {
  if (!slug || typeof slug !== 'string') return null;
  const trimmed = slug.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check in-memory slug map if fresh
  if (Date.now() - lastProductsFetchTime < CACHE_TTL) {
    const hit = cachedSlugMap.get(lower);
    if (hit) return hit;
  }

  // 2. Targeted Firestore query by slug field (avoids full collection scan)
  try {
    if (db) {
      const slugQuery = query(
        collection(db, 'products'),
        where('slug', '==', trimmed),
        limit(1)
      );
      const qSnap = await withTimeout(getDocs(slugQuery), 4000, null);
      if (qSnap && !qSnap.empty) {
        const docHit = qSnap.docs[0];
        const prod = { ...docHit.data(), _id: docHit.id };
        cachedSlugMap.set(lower, prod);
        return prod;
      }

      // Also check lowercase slug if casing differed
      if (lower !== trimmed) {
        const lowerQuery = query(
          collection(db, 'products'),
          where('slug', '==', lower),
          limit(1)
        );
        const lowerSnap = await withTimeout(getDocs(lowerQuery), 4000, null);
        if (lowerSnap && !lowerSnap.empty) {
          const docHit = lowerSnap.docs[0];
          const prod = { ...docHit.data(), _id: docHit.id };
          cachedSlugMap.set(lower, prod);
          return prod;
        }
      }

      // Direct document ID lookup
      const docSnap = await withTimeout(getDoc(doc(db, 'products', trimmed)), 4000, null);
      if (docSnap && docSnap.exists && docSnap.exists()) {
        const prod = { ...docSnap.data(), _id: docSnap.id };
        cachedSlugMap.set(lower, prod);
        return prod;
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'get', `products/${trimmed}`);
  }

  // 3. Fallback: local store lookup
  const store = loadLocalStore();
  const localHit = (store.products || []).find(
    (p) => p.slug?.toLowerCase() === lower || String(p._id).toLowerCase() === lower
  );
  return localHit || null;
}

export async function getDbProductsByCategory(categorySlug) {
  if (!categorySlug || typeof categorySlug !== 'string') return [];
  const lower = categorySlug.trim().toLowerCase();

  // 1. Targeted Firestore query by nested category.slug
  try {
    if (db) {
      const catQuery = query(
        collection(db, 'products'),
        where('category.slug', '==', lower)
      );
      const snap = await withTimeout(getDocs(catQuery), 5000, null);
      if (snap && !snap.empty) {
        const matched = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
        return sortByPosition(matched);
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'list', `products?category=${lower}`);
  }

  // 2. Fallback: cached/local filter (also covers legacy string category fields or synonyms)
  const all = await getDbProducts();
  const matched = all.filter(
    (p) => (p.category?.slug || p.category)?.toLowerCase() === lower
  );
  return sortByPosition(matched);
}

export async function saveDbProduct(productData) {
  const { data: sanitized, error } = sanitizeProductPayload(productData);
  if (error) {
    throw new Error(error);
  }

  const product = sanitized;
  const id = product._id;

  // 1. Write to Firestore
  try {
    if (db) {
      await withTimeout(setDoc(doc(db, 'products', id), product), 6000, null);
    }
  } catch (err) {
    handleFirestoreError(err, 'update', `products/${id}`);
  }

  // 2. Update local backup
  const store = loadLocalStore();
  const prods = [...(store.products || [])];
  const idx = prods.findIndex((p) => p._id === id || p.slug === product.slug);
  if (idx >= 0) {
    prods[idx] = product;
  } else {
    prods.unshift(product);
  }
  saveLocalStore({ ...store, products: prods });

  // 3. Invalidate cache so live queries immediately fetch fresh data
  invalidateProductsCache();

  return product;
}

export async function deleteDbProduct(id) {
  try {
    if (db) {
      await withTimeout(deleteDoc(doc(db, 'products', id)), 6000, null);
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
  if (!forceRefresh && cachedCategories && now - lastCategoriesFetchTime < CACHE_TTL) {
    return cachedCategories;
  }

  // 1. Primary: Firestore
  try {
    if (db) {
      const snap = await withTimeout(getDocs(collection(db, 'categories')), 6000, null);
      if (snap && !snap.empty) {
        const cats = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
        const sorted = sortByPosition(cats);
        cachedCategories = sorted;
        lastCategoriesFetchTime = Date.now();
        return sorted;
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'categories');
  }

  // 2. Fallback
  if (cachedCategories && cachedCategories.length > 0) {
    return cachedCategories;
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
  const { data: category, error } = sanitizeCategoryPayload(categoryData);
  if (error) {
    throw new Error(error);
  }

  const id = category._id;

  try {
    if (db) {
      await withTimeout(setDoc(doc(db, 'categories', id), category), 6000, null);
    }
  } catch (err) {
    handleFirestoreError(err, 'update', `categories/${id}`);
  }

  const store = loadLocalStore();
  const categories = [...(store.categories || [])];
  const idx = categories.findIndex((c) => c._id === id || c.slug === category.slug);
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
      await withTimeout(deleteDoc(doc(db, 'categories', id)), 6000, null);
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

export async function getDbTestimonials(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedTestimonials && now - lastTestimonialsFetchTime < CACHE_TTL) {
    return cachedTestimonials;
  }

  try {
    if (db) {
      const snap = await withTimeout(getDocs(collection(db, 'testimonials')), 6000, null);
      if (snap && !snap.empty) {
        const tests = snap.docs.map((d) => ({ ...d.data(), _id: d.id }));
        const sorted = sortByPosition(tests);
        cachedTestimonials = sorted;
        lastTestimonialsFetchTime = Date.now();
        return sorted;
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'testimonials');
  }

  if (cachedTestimonials && cachedTestimonials.length > 0) {
    return cachedTestimonials;
  }

  const store = loadLocalStore();
  const fallback = sortByPosition(store.testimonials || []);
  cachedTestimonials = fallback;
  lastTestimonialsFetchTime = now;
  return fallback;
}

export async function saveDbTestimonial(testimonialData) {
  const { data: testimonial, error } = sanitizeTestimonialPayload(testimonialData);
  if (error) {
    throw new Error(error);
  }

  const id = testimonial._id;

  try {
    if (db) {
      await withTimeout(setDoc(doc(db, 'testimonials', id), testimonial), 6000, null);
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
  invalidateTestimonialsCache();

  return testimonial;
}

export async function deleteDbTestimonial(id) {
  try {
    if (db) {
      await withTimeout(deleteDoc(doc(db, 'testimonials', id)), 6000, null);
    }
  } catch (err) {
    handleFirestoreError(err, 'delete', `testimonials/${id}`);
  }

  const store = loadLocalStore();
  const testimonials = (store.testimonials || []).filter((t) => t._id !== id);
  saveLocalStore({ ...store, testimonials });
  invalidateTestimonialsCache();
  return true;
}

// ==========================================
// SITE SETTINGS CRUD
// ==========================================

export async function getDbSiteSettings(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedSettings && now - lastSettingsFetchTime < CACHE_TTL) {
    return cachedSettings;
  }

  try {
    if (db) {
      const snap = await withTimeout(getDoc(doc(db, 'siteSettings', 'global')), 6000, null);
      if (snap && snap.exists && snap.exists()) {
        const settings = snap.data();
        cachedSettings = settings;
        lastSettingsFetchTime = Date.now();
        return settings;
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'get', 'siteSettings/global');
  }

  if (cachedSettings) {
    return cachedSettings;
  }

  const store = loadLocalStore();
  const fallback = store.siteSettings || {};
  cachedSettings = fallback;
  lastSettingsFetchTime = now;
  return fallback;
}

export async function saveDbSiteSettings(settingsData) {
  const { data: sanitized, error } = sanitizeSiteSettingsPayload(settingsData);
  if (error) {
    throw new Error(error);
  }

  try {
    if (db) {
      await withTimeout(setDoc(doc(db, 'siteSettings', 'global'), sanitized), 6000, null);
    }
  } catch (err) {
    handleFirestoreError(err, 'update', 'siteSettings/global');
  }

  const store = loadLocalStore();
  saveLocalStore({ ...store, siteSettings: sanitized });
  invalidateSettingsCache();

  return sanitized;
}

// ==========================================
// INQUIRIES / LEADS
// ==========================================

export async function getDbInquiries() {
  try {
    if (db) {
      const snap = await withTimeout(getDocs(collection(db, 'inquiries')), 6000, null);
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

  const store = loadLocalStore();
  return store.inquiries || [];
}

export async function addDbInquiry(inquiryData) {
  const id = `inq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const inquiry = {
    _id: id,
    name: inquiryData.name,
    email: inquiryData.email,
    phone: inquiryData.phone || '',
    message: inquiryData.message,
    product: inquiryData.product || '',
    submittedAt: new Date().toISOString(),
  };

  try {
    if (db) {
      await withTimeout(setDoc(doc(db, 'inquiries', id), inquiry), 6000, null);
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
      await withTimeout(deleteDoc(doc(db, 'inquiries', id)), 6000, null);
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
// BACKUP / RESTORE (Batched Firestore Writes)
// ==========================================

export async function getRawDatabase() {
  const [products, categories, testimonials, siteSettings, inquiries] =
    await Promise.all([
      getDbProducts(true),
      getDbCategories(true),
      getDbTestimonials(true),
      getDbSiteSettings(true),
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

  const operations = [];
  const sanitizedStore = {
    products: [],
    categories: [],
    testimonials: [],
    siteSettings: {},
    inquiries: loadLocalStore().inquiries || [],
  };

  if (Array.isArray(fullJson.products)) {
    for (const p of fullJson.products) {
      const { data } = sanitizeProductPayload(p);
      if (data) {
        sanitizedStore.products.push(data);
        operations.push({ col: 'products', id: data._id, data });
      }
    }
  }

  if (Array.isArray(fullJson.categories)) {
    for (const c of fullJson.categories) {
      const { data } = sanitizeCategoryPayload(c);
      if (data) {
        sanitizedStore.categories.push(data);
        operations.push({ col: 'categories', id: data._id, data });
      }
    }
  }

  if (Array.isArray(fullJson.testimonials)) {
    for (const t of fullJson.testimonials) {
      const { data } = sanitizeTestimonialPayload(t);
      if (data) {
        sanitizedStore.testimonials.push(data);
        operations.push({ col: 'testimonials', id: data._id, data });
      }
    }
  }

  if (fullJson.siteSettings && typeof fullJson.siteSettings === 'object') {
    const { data } = sanitizeSiteSettingsPayload(fullJson.siteSettings);
    if (data) {
      sanitizedStore.siteSettings = data;
      operations.push({ col: 'siteSettings', id: 'global', data });
    }
  }

  // Commit in chunks of 450 (strictly under Firestore's 500 write-batch limit)
  if (db && operations.length > 0) {
    const BATCH_LIMIT = 450;
    for (let i = 0; i < operations.length; i += BATCH_LIMIT) {
      const chunk = operations.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);
      for (const op of chunk) {
        batch.set(doc(db, op.col, op.id), op.data);
      }
      try {
        await withTimeout(batch.commit(), 10000, null);
      } catch (err) {
        handleFirestoreError(err, 'write', 'restoreDatabase/batch');
      }
    }
  }

  saveLocalStore(sanitizedStore);
  invalidateProductsCache();
  invalidateCategoriesCache();
  invalidateSettingsCache();
  invalidateTestimonialsCache();
  return true;
}
