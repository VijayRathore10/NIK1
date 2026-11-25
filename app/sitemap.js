import { getCategories, getProducts } from '@/lib/data';
import { getSiteBaseUrl } from '@/lib/validation';

export const revalidate = 300;

export default async function sitemap() {
  const baseUrl = getSiteBaseUrl();
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);

  const staticRoutes = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];

  const categoryRoutes = (categories || [])
    .filter((c) => c?.slug)
    .map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

  const productRoutes = (products || [])
    .filter((p) => p?.slug)
    .map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
