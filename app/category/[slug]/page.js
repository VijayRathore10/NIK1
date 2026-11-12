import ProductCard from '@/components/ProductCard';
import { getCategoryBySlug, getProductsByCategory, getCategories } from '@/lib/data';
import { notFound } from 'next/navigation';

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Category' };
  return {
    title: category.title,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const [category, products] = await Promise.all([
    getCategoryBySlug(slug),
    getProductsByCategory(slug),
  ]);

  if (!category) return notFound();

  return (
    <section className="mx-auto max-w-7xl px-5 md:px-8 pt-28 pb-16">
      <p className="mono-label text-xs uppercase text-amber-dark mb-2">Category</p>
      <h1 className="font-display text-4xl md:text-5xl font-bold mb-8 border-b border-line pb-6">
        {category.title}
      </h1>

      {products.length === 0 ? (
        <p className="text-graphite">No products listed in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
