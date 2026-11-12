import ImageCarousel from '@/components/ImageCarousel';
import InquiryForm from '@/components/InquiryForm';
import { getProductBySlug, getProducts } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Truck,
  FileCheck,
  Globe2,
  MessageCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getProducts();
  return (products || []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Vehicle Details' };
  return {
    title: product.name,
    description: product.description || `Specifications and export quotation for ${product.name}.`,
  };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product || !product.name) return notFound();

  // Filter out any blank/empty rows: empty rows will not be captured on the webpage (max 30 rows)
  const specs = (product.specifications || [])
    .filter((s) => s && ((s.label && s.label.trim().length > 0) || (s.value && s.value.trim().length > 0)))
    .slice(0, 30);
  const highlights = (product.highlights || []).filter(Boolean);

  const whatsappMessage = encodeURIComponent(
    `Hello SSG Motors, I would like an export quotation and port delivery details for: ${product.name}`
  );
  const whatsappUrl = `https://wa.me/971506988527?text=${whatsappMessage}`;

  return (
    <article className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-20">
      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mono-label text-[11px] uppercase text-graphite mb-4 sm:mb-6 flex items-center flex-wrap gap-1.5">
        <Link href="/" className="hover:text-freight transition-colors">
          Home
        </Link>
        <span className="text-graphite/60">/</span>
        <Link href={`/category/${product.category?.slug}`} className="hover:text-freight transition-colors">
          {product.category?.title}
        </Link>
        <span className="text-graphite/60">/</span>
        <span className="text-steel font-bold truncate max-w-[280px] sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* 2. Full-Page Width Image Carousel on Top */}
      <section aria-label="Vehicle Gallery" className="w-full mb-8 sm:mb-10">
        <ImageCarousel images={product.gallery} alt={product.name} />
      </section>

      {/* 3. Vehicle Headline & Key Specifications Badges Bar */}
      <header className="mb-8 pb-6 border-b border-line/80 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="mono-label text-xs uppercase font-bold text-amber-dark tracking-wider">
              {product.category?.title || 'Commercial Machinery & Fleet'}
            </span>
            {product.availability && (
              <>
                <span className="text-graphite/40">·</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{product.availability}</span>
                </span>
              </>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-steel leading-[1.05] tracking-tight">
            {product.name}
          </h1>

          {highlights.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {highlights.map((h, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 bg-white border border-line/90 px-3 py-1 rounded text-xs text-steel font-medium shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-dark shrink-0" />
                  <span>{h}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick WhatsApp Action Button */}
        <div className="shrink-0 flex items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </header>

      {/* 4. Full-Width Vehicle Overview & Inspection Description */}
      {product.description && (
        <section aria-label="Vehicle Overview" className="w-full mb-10 sm:mb-12 bg-white p-6 sm:p-8 lg:p-10 rounded-2xl border border-line/80 shadow-2xs">
          <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-line/60">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-steel">
              Vehicle Overview & Inspection Description
            </h2>
          </div>
          <p className="text-base sm:text-lg leading-relaxed text-steel/90 whitespace-pre-line max-w-none">
            {product.description}
          </p>
        </section>
      )}

      {/* 5. Specifications & Quotation Section Below Vehicle Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column (7 of 12 cols): 30-Row Specifications Grid & Export Pillars */}
        <div className="lg:col-span-7 space-y-8">
          {/* 30-Row Excel Specifications Table */}
          {specs.length > 0 && (
            <section aria-label="Technical Specifications" className="bg-white p-6 sm:p-8 rounded-xl border border-line shadow-2xs">
              <div className="mb-4 pb-3 border-b border-line">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-steel">
                  Technical Specifications
                </h2>
                <p className="text-xs text-graphite mt-0.5">
                  Certified parameters from mechanical verification inspection
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <tbody>
                    {specs.map((s, i) => (
                      <tr
                        key={i}
                        className={`border-b border-line/70 transition-colors hover:bg-paper/50 ${
                          i % 2 === 0 ? 'bg-white' : 'bg-[#FAF8F5]'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-semibold text-graphite w-2/5 sm:w-1/3 align-top text-xs sm:text-sm">
                          {s.label}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-steel text-xs sm:text-sm">
                          {s.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Export Guarantee Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-4 bg-white/70 border border-line rounded-lg flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-dark shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase text-steel">Inspected & Verified</h3>
                <p className="text-[11px] text-graphite mt-0.5">Pre-shipment mechanical and engine diagnostics.</p>
              </div>
            </div>

            <div className="p-4 bg-white/70 border border-line rounded-lg flex items-start gap-3">
              <Globe2 className="w-5 h-5 text-amber-dark shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase text-steel">Global Port Export</h3>
                <p className="text-[11px] text-graphite mt-0.5">Ro-Ro, Flat Rack, and Containerized sea freight.</p>
              </div>
            </div>

            <div className="p-4 bg-white/70 border border-line rounded-lg flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-amber-dark shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold uppercase text-steel">Export Documentation</h3>
                <p className="text-[11px] text-graphite mt-0.5">Original bill of lading, inspection certs & clearance.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 of 12 cols): Sticky Quotation & Export Inquiry Card */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          <div className="bg-white rounded-xl border-2 border-line/90 shadow-md p-6 sm:p-7">
            <div className="border-b border-line/80 pb-4 mb-5">
              <span className="mono-label text-[11px] uppercase tracking-wider text-amber-dark font-bold block mb-1">
                Official Export Portal
              </span>
              <h2 className="font-display text-2xl font-bold text-steel leading-tight">
                Request Export Quotation
              </h2>
              <p className="text-xs text-graphite mt-1">
                Receive freight rates, port transit times, and vehicle pricing CIF to your destination.
              </p>
            </div>

            {/* Target Vehicle Tag */}
            <div className="mb-5 p-3 rounded-lg bg-paper border border-line flex items-center justify-between gap-2">
              <div className="truncate">
                <span className="block text-[10px] uppercase font-mono text-graphite">Selected Machine:</span>
                <span className="text-xs font-bold text-steel truncate block">{product.name}</span>
              </div>
              <Truck className="w-5 h-5 text-amber-dark shrink-0" />
            </div>

            {/* Interactive Quotation Form */}
            <InquiryForm productName={product.name} />

            {/* Direct Instant Contact Options - WhatsApp Only (No Phone Mentions) */}
            <div className="mt-6 pt-5 border-t border-line/80 space-y-2.5">
              <p className="text-[11px] uppercase font-mono text-graphite text-center">
                Need instant assistance? Connect directly on WhatsApp:
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer text-center"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
