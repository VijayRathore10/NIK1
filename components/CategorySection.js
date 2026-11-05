import Link from 'next/link';
import ProductCard from './ProductCard';

export default function CategorySection({ category, products, index }) {
  const num = String(index + 1).padStart(2, '0');

  return (
    <section id={category.slug} className="mx-auto max-w-7xl px-5 md:px-8 py-14 scroll-mt-20">
      <div className="flex items-end justify-between mb-7 border-b border-line pb-4">
        <div className="flex items-baseline gap-4">
          <span className="mono-label text-sm text-amber-dark">{num}</span>
          <h2 className="font-display text-3xl md:text-4xl font-bold">{category.title}</h2>
        </div>
        <Link
          href={`/category/${category.slug}`}
          className="mono-label text-xs uppercase text-freight hover:text-amber-dark transition-colors whitespace-nowrap"
        >
          View All →
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-graphite text-sm">No products listed in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.slice(0, 8).map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
