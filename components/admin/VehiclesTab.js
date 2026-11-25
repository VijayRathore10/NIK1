'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  Plus,
  Search,
  Edit,
  Trash2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export default function VehiclesTab({
  products = [],
  totalCount = 0,
  categories = [],
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  loading,
  onRefresh,
  onAddNew,
  onEdit,
  onDelete,
  onUpdatePosition,
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">
            Vehicles &amp; Heavy Equipment
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage vehicle cards, position numbering (defines display order on main page), gallery images, and 30-row Excel specification tables.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            aria-label="Search vehicles"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by vehicle name, model, make, or specs..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#131D2F] border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#131D2F] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="all">All Categories ({totalCount})</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh vehicle list"
            className="p-2 rounded-xl bg-[#131D2F] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => {
          const specsCount = (p.specifications || []).filter(
            (s) => s && ((s.label && s.label.trim()) || (s.value && s.value.trim()))
          ).length;

          return (
            <div
              key={p._id || p.slug}
              className="bg-[#131D2F] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors group"
            >
              <div>
                <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.cardImage || 'https://picsum.photos/seed/vehicle/800/600'}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = 'https://picsum.photos/seed/vehicle/800/600';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="mono-label text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950/80 text-amber-400 backdrop-blur-sm border border-white/10">
                      {p.category?.title || 'Vehicle'}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className="mono-label text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-emerald-400 backdrop-blur-sm border border-emerald-500/30">
                      {p.availability || 'Ready'}
                    </span>
                  </div>
                </div>

                {/* Position Numbering Bar */}
                <div className="px-3.5 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                      Position #
                    </span>
                    <input
                      type="number"
                      min="1"
                      aria-label={`Position order for ${p.name}`}
                      defaultValue={p.order ?? ''}
                      key={`p-order-${p._id}-${p.order}`}
                      onBlur={(e) => onUpdatePosition(p._id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur();
                      }}
                      placeholder="—"
                      className="w-14 px-2 py-0.5 text-center font-mono font-bold text-xs bg-slate-900 border border-slate-700 hover:border-amber-400 focus:border-amber-400 focus:outline-none rounded text-amber-300"
                      title="Set position number for main page display (1 = First, 2 = Second...)"
                    />
                  </div>

                  <span className="text-[10px] font-mono">
                    {p.order !== null && p.order !== undefined && p.order !== '' ? (
                      <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        Card #{p.order}
                      </span>
                    ) : (
                      <span className="text-slate-500">Unordered</span>
                    )}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-display text-lg font-bold text-white tracking-tight leading-snug line-clamp-1">
                    {p.name}
                  </h3>

                  {p.highlights && p.highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 my-2.5">
                      {p.highlights.slice(0, 3).map((h, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                        >
                          {h}
                        </span>
                      ))}
                      {p.highlights.length > 3 && (
                        <span className="text-[10px] font-mono text-slate-500 self-center">
                          +{p.highlights.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[11px] text-amber-400/90 font-semibold">
                      {specsCount} Specifications
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {p.gallery?.length || 1} Photos
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="p-3 bg-slate-950/50 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <Link
                  href={`/product/${p.slug}`}
                  target="_blank"
                  className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(p)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Specs</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(p._id, p.name)}
                    aria-label={`Delete ${p.name}`}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && (
        <div className="text-center py-16 bg-[#131D2F] rounded-2xl border border-slate-800">
          <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-300">No vehicles found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search terms or add a new vehicle.
          </p>
        </div>
      )}
    </div>
  );
}
