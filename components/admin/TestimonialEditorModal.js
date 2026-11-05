'use client';

import React, { useState } from 'react';
import ImageUploadButton from './ImageUploadButton';
import ImageDropzone from './ImageDropzone';
import { X, Save, Trash2, Plus, Image as ImageIcon } from 'lucide-react';

export default function TestimonialEditorModal({ testimonial = null, onClose, onSave }) {
  const isEditing = Boolean(testimonial?._id);

  const [customerName, setCustomerName] = useState(testimonial?.customerName || '');
  const [customerDetail, setCustomerDetail] = useState(
    testimonial?.customerDetail || 'Fleet Owner, UAE'
  );
  const [quote, setQuote] = useState(testimonial?.quote || '');
  const [photos, setPhotos] = useState(
    testimonial?.photos || ['https://picsum.photos/seed/customer/800/800']
  );
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [order, setOrder] = useState(
    testimonial?.order !== undefined && testimonial?.order !== null ? testimonial.order : ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddPhoto = (e) => {
    e.preventDefault();
    if (!newPhotoUrl.trim()) return;
    if (photos.length >= 4) {
      alert('Maximum 4 photos allowed per testimonial');
      return;
    }
    setPhotos([...photos, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (idx) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !quote.trim()) {
      setError('Please provide customer name and testimonial quote');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      _id: testimonial?._id || `testi-${Date.now()}`,
      customerName: customerName.trim(),
      customerDetail: customerDetail.trim(),
      quote: quote.trim(),
      photos: photos.slice(0, 4),
      order: order !== '' && !Number.isNaN(Number(order)) ? Number(order) : null,
    };

    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save testimonial');
      }

      const saved = await res.json();
      onSave(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving testimonial');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-xl bg-[#131D2F] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              {isEditing ? 'Edit Client Testimonial' : 'Add New Client Testimonial'}
            </h3>
            <p className="text-xs text-slate-400">
              Manage client quote, delivery photos (up to 4), and country credentials.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Client / Company Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ahmed Al-Mansoor"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Role & Country Detail
              </label>
              <input
                type="text"
                value={customerDetail}
                onChange={(e) => setCustomerDetail(e.target.value)}
                placeholder="e.g. Fleet Owner, Muscat, Oman"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Testimonial Quote *
            </label>
            <textarea
              rows={4}
              required
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Write the customer's feedback and experience..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Delivery Photos (Max 4) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Delivery Photos (Max 4)
              </label>
              <span className="text-[11px] font-mono text-amber-400">
                {photos.length} / 4 Photos
              </span>
            </div>

            {photos.length < 4 && (
              <div className="mb-3">
                <ImageDropzone
                  multiple={true}
                  value={photos}
                  onChange={(newPhotos) => {
                    setPhotos(newPhotos.slice(0, 4));
                  }}
                  helperText="Drag & drop delivery photos or click to browse (up to 4)"
                  className="w-full"
                />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {photos.map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(i)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-red-600 text-white transition-colors cursor-pointer"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-white">
                    #{i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
              Position # (Carousel Slide Order)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="e.g. 1, 2, 3"
                className="w-28 px-3.5 py-2 rounded-xl bg-slate-950 border border-amber-500/60 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-slate-400">
                1 = First Slide, 2 = Second Slide, etc. Controls rotation order on the main page.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : isEditing ? 'Update Testimonial' : 'Create Testimonial'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
