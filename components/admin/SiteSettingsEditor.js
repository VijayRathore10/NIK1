'use client';

import React, { useState } from 'react';
import ImageUploadButton from './ImageUploadButton';
import ImageDropzone from './ImageDropzone';
import { Save, Plus, Trash2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export default function SiteSettingsEditor({ settings = {}, onSave }) {
  const [tagline, setTagline] = useState(settings?.tagline || '');
  const [aboutText, setAboutText] = useState(settings?.aboutText || '');
  const [contactEmail, setContactEmail] = useState(settings?.contactEmail || '');
  const [contactPhone, setContactPhone] = useState(settings?.contactPhone || '');
  const [address, setAddress] = useState(settings?.address || '');

  // Social Links
  const [whatsapp, setWhatsapp] = useState(settings?.socialLinks?.whatsapp || '');
  const [facebook, setFacebook] = useState(settings?.socialLinks?.facebook || '');
  const [instagram, setInstagram] = useState(settings?.socialLinks?.instagram || '');
  const [linkedin, setLinkedin] = useState(settings?.socialLinks?.linkedin || '');

  // Hero Slider Images
  const [heroImages, setHeroImages] = useState(
    settings?.heroImages || [
      'https://picsum.photos/seed/ssg-heavy-haulage-1610/1920/1200',
      'https://picsum.photos/seed/ssg-machinery-1610/1920/1200',
      'https://picsum.photos/seed/ssg-transit-1610/1920/1200',
      'https://picsum.photos/seed/ssg-agricultural-1610/1920/1200',
    ]
  );
  const [newHeroImageUrl, setNewHeroImageUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddHeroImage = (e) => {
    e.preventDefault();
    if (!newHeroImageUrl.trim()) return;
    setHeroImages([...heroImages, newHeroImageUrl.trim()]);
    setNewHeroImageUrl('');
  };

  const handleRemoveHeroImage = (idx) => {
    setHeroImages(heroImages.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    const payload = {
      tagline: tagline.trim(),
      aboutText: aboutText.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      address: address.trim(),
      socialLinks: {
        whatsapp: whatsapp.trim(),
        facebook: facebook.trim(),
        instagram: instagram.trim(),
        linkedin: linkedin.trim(),
      },
      heroImages: heroImages.filter(Boolean),
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        onSave(data);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch (err) {
      alert('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl select-none">
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>All site settings and hero slides saved successfully!</span>
        </div>
      )}

      {/* Hero Section Photography */}
      <div className="bg-[#131D2F] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            1. Hero Slider Photography (16:10 Cinematic Slides)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Background photography rotating at the top of the homepage.
          </p>
        </div>

        <ImageDropzone
          multiple={true}
          value={heroImages}
          onChange={setHeroImages}
          helperText="Drag & drop 16:10 high-resolution cinematic slides here, or click to browse files"
          className="w-full"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {heroImages.map((url, i) => (
            <div
              key={i}
              className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Hero ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemoveHeroImage(i)}
                className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-red-600 text-white transition-colors cursor-pointer"
                title="Remove Slide"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-amber-300">
                Slide #{i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Branding & Taglines */}
      <div className="bg-[#131D2F] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            2. Company Taglines & About Description
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Displayed on hero banners and the About Us section.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
            Hero Tagline
          </label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="COMMERCIAL VEHICLES & FLEET EXPORT"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
            About Company Overview
          </label>
          <textarea
            rows={3}
            value={aboutText}
            onChange={(e) => setAboutText(e.target.value)}
            placeholder="NIK EXPORTS is India’s premier commercial vehicle export partner..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Contact & Registered Office */}
      <div className="bg-[#131D2F] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            3. Contact Information & Registered Office
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Shown on header, footer, inquiry popups, and contact page.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="export@nikexports.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Contact Phone / WhatsApp
            </label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+971 50 698 8527"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
            Registered Office Address
          </label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="SevenSeas Global Trading FZ LLC, Compass Building, Al Shohada Road, Ras Al Khaimah, UAE"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Social Media Links */}
      <div className="bg-[#131D2F] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            4. Social Media & Direct Chat Links
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Connected to social buttons in the footer and contact sections.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              WhatsApp Link
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="https://wa.me/971506988527"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Facebook Page URL
            </label>
            <input
              type="text"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              Instagram Profile URL
            </label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
              LinkedIn Profile URL
            </label>
            <input
              type="text"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/company/..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-lg cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Settings...' : 'Save All Settings'}</span>
        </button>
      </div>
    </form>
  );
}
