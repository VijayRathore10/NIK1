'use client';

import React from 'react';
import { Mail, Phone, Calendar, Trash2 } from 'lucide-react';

export default function InquiriesTab({ inquiries = [], onDelete }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">
            Client Inquiries &amp; Quote Requests
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Direct leads submitted from the website vehicle inquiry forms.
          </p>
        </div>
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-16 bg-[#131D2F] rounded-2xl border border-slate-800">
          <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-300">No inquiries yet</p>
          <p className="text-xs text-slate-500 mt-1">
            When visitors submit the quote form on vehicle pages, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div
              key={inq._id}
              className="bg-[#131D2F] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 select-text"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-white text-sm">{inq.name}</h3>
                  {inq.product && (
                    <span className="mono-label text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      {inq.product}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap gap-3 font-mono">
                  <a
                    href={`mailto:${inq.email}`}
                    className="inline-flex items-center gap-1.5 hover:text-amber-400 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{inq.email}</span>
                  </a>
                  {inq.phone && (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{inq.phone}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(inq.submittedAt).toLocaleString()}</span>
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed mt-2 whitespace-pre-wrap">
                  {inq.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onDelete(inq._id)}
                aria-label={`Delete inquiry from ${inq.name}`}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer self-start sm:self-auto"
                title="Delete Inquiry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
