'use client';

import React, { useState } from 'react';
import ExcelSpecificationsGrid from './ExcelSpecificationsGrid';
import ImageUploadButton from './ImageUploadButton';
import ImageDropzone from './ImageDropzone';
import { X, Plus, Trash2, Image as ImageIcon, Save, Check } from 'lucide-react';

export default function ProductEditorModal({
  product = null,
  categories = [],
  onClose,
  onSave,
}) {
  const isEditing = Boolean(product?._id);

  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [categorySlug, setCategorySlug] = useState(
    product?.category?.slug || categories[0]?.slug || 'trucks'
  );
  const [cardImage, setCardImage] = useState(
    product?.cardImage || 'https://picsum.photos/seed/vehicle/800/600'
  );
  const [gallery, setGallery] = useState(
    product?.gallery || [product?.cardImage || 'https://picsum.photos/seed/vehicle/800/600']
  );
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [highlights, setHighlights] = useState(product?.highlights || []);
  const [newHighlight, setNewHighlight] = useState('');
  const [specifications, setSpecifications] = useState(product?.specifications || []);
  const [description, setDescription] = useState(product?.description || '');
  const [availability, setAvailability] = useState(product?.availability || 'Ready for Export');
  const [order, setOrder] = useState(
    product?.order !== undefined && product?.order !== null ? product.order : ''
  );
  const [featured, setFeatured] = useState(product?.featured !== undefined ? product.featured : true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (val) => {
    setName(val);
    if (!isEditing || !slug) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const handleAddHighlight = (e) => {
    e.preventDefault();
    if (!newHighlight.trim()) return;
    setHighlights([...highlights, newHighlight.trim()]);
    setNewHighlight('');
  };

  const handleRemoveHighlight = (idx) => {
    setHighlights(highlights.filter((_, i) => i !== idx));
  };

  const handleAddGalleryUrl = (e) => {
    e.preventDefault();
    if (!newGalleryUrl.trim()) return;
    setGallery([...gallery, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryUrl = (idx) => {
    setGallery(gallery.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a vehicle name');
      return;
    }

    setSaving(true);
    setError('');

    const selectedCategory = categories.find((c) => c.slug === categorySlug) || {
      title: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
      slug: categorySlug,
    };

    const payload = {
      _id: product?._id,
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: {
        _id: selectedCategory._id,
        title: selectedCategory.title,
        slug: selectedCategory.slug,
      },
      cardImage: cardImage.trim() || 'https://picsum.photos/seed/vehicle/800/600',
      gallery: gallery.length > 0 ? gallery : [cardImage],
      highlights,
      specifications,
      description: description.trim(),
      availability,
      order: order !== '' && !Number.isNaN(Number(order)) ? Number(order) : null,
      featured,
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save product');
      }

      const saved = await res.json();
      onSave(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl my-8 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{isEditing ? 'Edit Vehicle / Machine' : 'Add New Vehicle / Machine'}</span>
              {name && <span className="text-xs text-amber-400 font-mono font-normal">({name})</span>}
            </h3>
            <p className="text-xs text-slate-400">
              Configure vehicle details, position numbering, gallery images, and the 30-row Excel specifications table.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Row 1: Name, Slug, Category, Availability, Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Vehicle Title / Make & Model *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Tata Prima 4028.S Prime Mover"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Category
              </label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Availability Status
              </label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Ready for Export">Ready for Export</option>
                <option value="In Stock">In Stock</option>
                <option value="Certified Used">Certified Used</option>
                <option value="Low Hours / Inspected">Low Hours / Inspected</option>
                <option value="Reserved">Reserved</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                Position # (Order)
              </label>
              <input
                type="number"
                min="1"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                placeholder="e.g. 1, 2, 3"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-amber-500/60 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                title="Cards on the main page are displayed in this numbered position order (1 = first)"
              />
            </div>
          </div>

          {/* Row 2: Card Thumbnail Image & Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <ImageDropzone
                label="Primary Card Image"
                value={cardImage}
                onChange={setCardImage}
                helperText="Drag & drop primary vehicle photo or click to browse"
                aspectRatio="aspect-[4/3]"
              />
            </div>

            {/* Highlights (Quick Badges) */}
            <div className="lg:col-span-2 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Key Highlights (Badges on Product Card)
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Add tags like &quot;Year: 2023&quot;, &quot;Engine: 410 HP&quot;, &quot;Load: 28 Tonne&quot;.
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    placeholder="e.g. Engine: Cummins 6.7L"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddHighlight(e);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-slate-950/70 border border-slate-800 rounded-lg">
                  {highlights.length === 0 ? (
                    <span className="text-xs text-slate-600 italic">No highlights added yet.</span>
                  ) : (
                    highlights.map((h, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-slate-800 text-slate-200 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-700"
                      >
                        <span>{h}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveHighlight(i)}
                          className="text-slate-400 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Featured toggle & slug info */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    Feature prominently on Homepage Catalog
                  </span>
                </label>

                <div className="text-[11px] font-mono text-slate-500">
                  Slug: <span className="text-amber-400/90">{slug}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: The 2-Column, 30-Row Excel Specification Grid */}
          <div className="pt-2">
            <ExcelSpecificationsGrid
              specifications={specifications}
              onChange={setSpecifications}
            />
          </div>

          {/* Description / Overview */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Vehicle Overview & Inspection Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed mechanical, structural, and shipping export details..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Photo Gallery: Drag-and-Drop + System Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Vehicle Gallery Photos (Detail Page Carousel)
                </label>
                <p className="text-[11px] text-slate-400">
                  Drag & drop multiple photos from your device, or click to browse.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                {gallery.length} {gallery.length === 1 ? 'photo' : 'photos'}
              </span>
            </div>

            <ImageDropzone
              multiple={true}
              value={gallery}
              onChange={setGallery}
              helperText="Drag and drop multiple vehicle photos here, or click to browse files"
              className="w-full"
            />

            {/* Gallery Thumbnails List */}
            {gallery.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                {gallery.map((img, i) => (
                  <div
                    key={i}
                    className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-800 bg-slate-950 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt={`Gallery ${i + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = 'https://picsum.photos/seed/placeholder/800/600';
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryUrl(i)}
                        className="p-1.5 rounded-md bg-red-600/90 hover:bg-red-500 text-white transition-colors cursor-pointer shadow-lg"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/75 backdrop-blur-xs text-[10px] font-mono text-slate-300 px-1.5 py-0.5 rounded">
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Vehicle...' : isEditing ? 'Update Vehicle' : 'Create Vehicle'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
