import {
  getDbCategories,
  getDbCategoryBySlug,
  getDbProducts,
  getDbProductsByCategory,
  getDbProductBySlug,
  getDbTestimonials,
  getDbSiteSettings,
} from './db';

export async function getCategories() {
  return getDbCategories();
}

export async function getCategoryBySlug(slug) {
  return getDbCategoryBySlug(slug);
}

export async function getProducts() {
  return getDbProducts();
}

export async function getProductsByCategory(slug) {
  return getDbProductsByCategory(slug);
}

export async function getProductBySlug(slug) {
  return getDbProductBySlug(slug);
}

export async function getTestimonials() {
  return getDbTestimonials();
}

export async function getSiteSettings() {
  return getDbSiteSettings();
}
