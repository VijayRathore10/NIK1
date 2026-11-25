'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

export default function CategoriesTab({
  categories = [],
  products = [],
  onAddNew,
  onEdit,
  onDelete,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">
            Vehicle Categories
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Add, edit, or customize categories shown across the catalog tabs.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map((c) => {
          const count = products.filter((p) => p.category?.slug === c.slug).length;
          return (
            <div
              key={c.slug}
              className="bg-[#131D2F] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.image || 'https://picsum.photos/seed/category/800/600'}
                    alt={c.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://picsum.photos/seed/placeholder/800/600';
                    }}
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-amber-400">
                    order: {c.order || 0}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-white text-base">{c.title}</h3>
                  <span className="font-mono text-xs text-slate-400 block mt-0.5">
                    slug: {c.slug}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium block mt-2">
                    {count} vehicles in catalog
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                <Link
                  href={`/category/${c.slug}`}
                  target="_blank"
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>View</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(c._id, c.title)}
                    aria-label={`Delete category ${c.title}`}
                    className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
