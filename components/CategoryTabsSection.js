'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';

export default function CategoryTabsSection({ categories = [], products = [] }) {
  const [selectedSlug, setSelectedSlug] = useState(null);

  const activeSlug =
    selectedSlug || (categories.length > 0 ? categories[0].slug : 'trucks');

  const activeCategory =
    categories.find(
      (c) => c.slug?.toLowerCase() === activeSlug?.toLowerCase()
    ) || categories[0];

  const filteredProducts = products.filter((p) => {
    const pSlug = (typeof p.category === 'string' ? p.category : p.category?.slug)?.toLowerCase();
    const pTitle = (typeof p.category === 'object' ? p.category?.title : '')?.toLowerCase();
    const active = activeSlug?.toLowerCase();
    
    if (!active) return true;
    if (pSlug === active || pTitle === active) return true;
    
    // Normalize machinery / equipment synonyms
    const isMachinery = (s) => ['equipment', 'equipments', 'heavy-equipment', 'machineries', 'machinery'].includes(s);
    if (isMachinery(active) && (isMachinery(pSlug) || isMachinery(pTitle))) return true;

    return false;
  });

  // Sort products basis position numbering system (1, 2, 3...)
  const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
    const hasA = a.order !== undefined && a.order !== null && a.order !== '';
    const hasB = b.order !== undefined && b.order !== null && b.order !== '';
    const orderA = hasA ? Number(a.order) : Infinity;
    const orderB = hasB ? Number(b.order) : Infinity;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  return (
    <section id="catalog" className="w-full bg-[#F3F6FA] border-y border-line/70 py-20 md:py-28 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight text-steel">
              EXPLORE OUR CATALOGUE HERE
            </h2>
          </div>
        </div>

        {/* Horizontal Category Selector Tabs */}
        <div className="mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:gap-3.5 p-2.5 bg-white rounded-xl border border-gray-300/80 shadow-md">
            {categories.map((cat, idx) => {
              const isActive = cat.slug === activeSlug;
              const count = products.filter((p) => p.category?.slug === cat.slug).length;
              const num = String(idx + 1).padStart(2, '0');

              return (
                <button
                  key={cat._id || cat.slug}
                  onClick={() => setSelectedSlug(cat.slug)}
                  className={`flex items-center justify-center px-4 py-4 rounded-lg transition-all duration-200 text-center cursor-pointer ${
                    isActive
                      ? 'bg-[#102035] text-white shadow-lg border-b-4 border-[#B69255] ring-2 ring-[#102035]/30'
                      : 'bg-[#F8FAFC] hover:bg-white text-[#0F172A] hover:text-black border border-gray-300/70 hover:border-gray-400 font-semibold shadow-xs'
                  }`}
                >
                  <span className="font-display text-lg md:text-xl font-extrabold tracking-wider uppercase text-inherit">
                    {cat.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Category Heading */}
        <div className="mb-8 px-1">
          <h3 className="font-display text-2xl md:text-3xl font-bold text-steel uppercase">
            {activeCategory?.title || 'Selected'} Units
          </h3>
        </div>

        {/* Products Grid - 2/2/2 layout (Total 6 elements: 2 columns per row or 3x2) */}
        {sortedFilteredProducts.length === 0 ? (
          <div className="bg-white border border-line rounded-xl p-12 text-center my-6 shadow-sm">
            <p className="text-graphite font-display text-lg mb-2">
              No products listed in this category yet.
            </p>
            <p className="text-sm text-graphite/80 mb-5">
              Contact our export desk for custom sourcing and upcoming inventory.
            </p>
            <Link
              href="/contact"
              className="inline-block mono-label text-xs uppercase bg-amber text-steel px-5 py-2.5 font-bold hover:bg-amber-dark transition-colors rounded"
            >
              Inquire For Availability
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {sortedFilteredProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
