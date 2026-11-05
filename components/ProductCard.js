import Link from 'next/link';
import Image from 'next/image';
import { resolveImage } from '@/lib/image';

// Helper to extract available specifications/highlights with real data
function getProductSpecs(product) {
  const specs = [];

  const addSpec = (item) => {
    if (!item) return;
    if (typeof item === 'string') {
      const clean = item.trim();
      if (clean && clean !== ':' && !clean.endsWith(':')) {
        specs.push(clean);
      }
    } else if (typeof item === 'object') {
      const label = item.label || item.title || item.key || '';
      const val = item.value || item.val || '';
      if (label && val) {
        specs.push(`${label}: ${val}`);
      } else if (val) {
        specs.push(String(val));
      } else if (label) {
        specs.push(String(label));
      }
    }
  };

  // Check product.highlights first
  if (Array.isArray(product?.highlights)) {
    product.highlights.forEach(addSpec);
  }

  // If highlights didn't provide specs or are empty, check product.specifications (up to 6)
  if (specs.length === 0 && Array.isArray(product?.specifications)) {
    product.specifications.slice(0, 6).forEach(addSpec);
  }

  return specs;
}

export default function ProductCard({ product }) {
  const specs = getProductSpecs(product);

  return (
    <Link
      href={`/product/${product.slug}`}
      prefetch={true}
      className="group flex flex-col bg-white border border-line hover:border-amber hover:shadow-xl transition-all duration-300 rounded-xl overflow-hidden"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-steel/5 rounded-t-xl">
        <Image
          src={resolveImage(product.cardImage, 600)}
          alt={product.name || 'Vehicle'}
          fill
          referrerPolicy="no-referrer"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2.5 right-2.5">
          <span className="mono-label text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 bg-steel/80 backdrop-blur-sm text-paper border border-white/10 rounded-md">
            Export Ready
          </span>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          <p className="font-display text-lg font-bold leading-tight mb-3 text-steel group-hover:text-freight transition-colors">
            {product.name}
          </p>

          {/* Floating, dynamic-width key specifications (only shows specs with data, no fixed sizes, no cropped text) */}
          {specs.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-4">
              {specs.map((spec, i) => {
                const colonIndex = spec.indexOf(':');
                const hasColon = colonIndex > 0;
                const label = hasColon ? spec.slice(0, colonIndex).trim() : null;
                const value = hasColon ? spec.slice(colonIndex + 1).trim() : spec;

                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-[11px] font-mono leading-tight bg-slate-50 hover:bg-slate-100 text-steel border border-line/80 hover:border-gray-400 rounded-md px-2 py-1 transition-colors whitespace-normal break-words"
                  >
                    {label && (
                      <span className="text-graphite/80 font-medium">{label}:</span>
                    )}
                    <span className="font-bold text-steel">{value}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-line/60 flex items-center justify-between mono-label text-xs">
          <span className="text-freight font-semibold group-hover:text-amber-dark transition-colors">
            View Details →
          </span>
          <span className="text-[11px] font-semibold text-amber-dark uppercase bg-amber/10 px-2 py-0.5 rounded">
            Request Quote
          </span>
        </div>
      </div>
    </Link>
  );
}

