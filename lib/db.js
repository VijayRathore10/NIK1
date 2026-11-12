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

// In-memory store
let memoryStore = null;

// Short TTL (5s) for cache so edits in Firestore/Admin reflect almost instantly
const CACHE_TTL = 5 * 1000;

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

// Helper to guard remote Firestore promises with a generous 6-second timeout
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
  if (!forceRefresh && cachedProducts && (now - lastProductsFetchTime < CACHE_TTL)) {
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

        // Background sync to store.json
        try {
          const currentStore = loadLocalStore();
          saveLocalStore({ ...currentStore, products: sorted });
        } catch {
          // ignore
        }

        return sorted;
      }
    }
  } catch (err) {
    handleFirestoreError(err, 'list', 'products');
  }

  // 2. Fallback: local store
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
  if (!slug) return null;
  const lower = String(slug).toLowerCase();

  // 1. Check in-memory map
  let hit = cachedSlugMap.get(lower);
  if (hit) return hit;

  // 2. Query Firestore directly for document with matching ID
  try {
    if (db) {
      const docSnap = await withTimeout(getDoc(doc(db, 'products', slug)), 4000, null);
      if (docSnap && docSnap.exists && docSnap.exists()) {
        const prod = { ...docSnap.data(), _id: docSnap.id };
        cachedSlugMap.set(lower, prod);
        return prod;
      }
    }
  } catch (err) {
    // continue
  }

  // 3. Force-refresh all products from Firestore to find matching slug
  const all = await getDbProducts(true);
  hit = cachedSlugMap.get(lower) || all.find((p) => p.slug?.toLowerCase() === lower || String(p._id).toLowerCase() === lower);
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

  // 1. Write to Firestore
  try {
    if (db) {
      await withTimeout(setDoc(doc(db, 'products', id), product), 6000, null);
    }
  } catch (err) {
    handleFirestoreError(err, 'update', `products/${id}`);
  }

  // 2. Write to local store backup
  const store = loadLocalStore();
  const prods = [...(store.products || [])];
  const idx = prods.findIndex((p) => p._id === id || p.slug === slug);
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
  if (!forceRefresh && cachedCategories && (now - lastCategoriesFetchTime < CACHE_TTL)) {
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

        try {
          const currentStore = loadLocalStore();
          saveLocalStore({ ...currentStore, categories: sorted });
        } catch {
          // ignore
        }

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
  const id = categoryData._id || `cat-${Date.now()}`;
  const slug = categoryData.slug || categoryData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const category = {
    ...categoryData,
    _id: id,
    slug,
  };

  try {
    if (db) {
      await withTimeout(setDoc(doc(db, 'categories', id), category), 6000, null);
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
  if (!forceRefresh && cachedTestimonials && (now - lastTestimonialsFetchTime < CACHE_TTL)) {
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

        try {
          const currentStore = loadLocalStore();
          saveLocalStore({ ...currentStore, testimonials: sorted });
        } catch {
          // ignore
        }

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
  if (!forceRefresh && cachedSettings && (now - lastSettingsFetchTime < CACHE_TTL)) {
    return cachedSettings;
  }

  try {
    if (db) {
      const snap = await withTimeout(getDoc(doc(db, 'siteSettings', 'global')), 6000, null);
      if (snap && snap.exists && snap.exists()) {
        const settings = snap.data();
        cachedSettings = settings;
        lastSettingsFetchTime = Date.now();

        try {
          const currentStore = loadLocalStore();
          saveLocalStore({ ...currentStore, siteSettings: settings });
        } catch {
          // ignore
        }

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
  const current = await getDbSiteSettings(true);
  const siteSettings = {
    ...current,
    ...settingsData,
  };

  try {
    if (db) {
      await withTimeout(setDoc(doc(db, 'siteSettings', 'global'), siteSettings), 6000, null);
    }
  } catch (err) {
    handleFirestoreError(err, 'update', 'siteSettings/global');
  }

  const store = loadLocalStore();
  saveLocalStore({ ...store, siteSettings });
  invalidateSettingsCache();

  return siteSettings;
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
    ...inquiryData,
    _id: id,
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
// BACKUP / RESTORE
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
  invalidateCategoriesCache();
  invalidateSettingsCache();
  invalidateTestimonialsCache();
  return true;
}
