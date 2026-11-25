'use client';

import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function TestimonialsTab({
  testimonials = [],
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
            Client Testimonials &amp; Delivery Photos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Testimonials rotate automatically on the homepage with alternating photos and quotes.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Testimonial</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {testimonials.map((t, idx) => (
          <div
            key={t._id || idx}
            className="bg-[#131D2F] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
          >
            <div>
              {/* Position Numbering Bar */}
              <div className="flex items-center justify-between gap-2 p-2.5 mb-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                    Position #
                  </span>
                  <input
                    type="number"
                    min="1"
                    aria-label={`Slide position for ${t.customerName}`}
                    defaultValue={t.order ?? ''}
                    key={`t-order-${t._id}-${t.order}`}
                    onBlur={(e) => onUpdatePosition(t._id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                    }}
                    placeholder="—"
                    className="w-14 px-2 py-0.5 text-center font-mono font-bold text-xs bg-slate-900 border border-slate-700 hover:border-amber-400 focus:border-amber-400 focus:outline-none rounded text-amber-300"
                    title="Set slide position number for main page testimonial rotation (1 = First Slide, 2 = Second Slide...)"
                  />
                </div>

                <span className="text-[10px] font-mono">
                  {t.order !== null && t.order !== undefined && t.order !== '' ? (
                    <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Slide #{t.order}
                    </span>
                  ) : (
                    <span className="text-slate-500">Unordered</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    {t.customerName}
                  </h3>
                  <span className="text-xs font-mono text-amber-400">
                    {t.customerDetail}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">
                  Index #{idx + 1}
                </span>
              </div>

              <blockquote className="text-xs sm:text-sm text-slate-300 leading-relaxed italic mb-4 line-clamp-3">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {t.photos && t.photos.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  {t.photos.slice(0, 4).map((img, i) => (
                    <div
                      key={i}
                      className="w-14 h-14 rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shrink-0"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                {t.photos?.length || 0} Delivery Photos
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEdit(t)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(t._id, t.customerName)}
                  aria-label={`Delete testimonial from ${t.customerName}`}
                  className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Delete Testimonial"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
