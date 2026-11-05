'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';

const ADMIN_TOKEN = 'nik-authorized-session-token-v1';

// Safe in-browser image optimization: scales down 10MB+ images to <=1920px WebP
async function optimizeImageForUpload(file, maxWidth = 1920, quality = 0.88) {
  // If SVG or GIF, preserve exact format
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  // If already small (< 300KB), return as is
  if (file.size < 300 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const img = new Image();
          img.onload = () => {
            try {
              let width = img.width;
              let height = img.height;

              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;

              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);

              canvas.toBlob(
                (blob) => {
                  if (blob && blob.size < file.size) {
                    const cleanName = (file.name || 'image').replace(/\.[^/.]+$/, '') + '.webp';
                    try {
                      const optimizedFile = new File([blob], cleanName, { type: 'image/webp' });
                      resolve(optimizedFile);
                    } catch {
                      // Older browser fallback if new File() fails
                      blob.name = cleanName;
                      resolve(blob);
                    }
                  } else {
                    resolve(file);
                  }
                },
                'image/webp',
                quality
              );
            } catch {
              resolve(file);
            }
          };
          img.onerror = () => resolve(file);
          img.src = e.target.result;
        } catch {
          resolve(file);
        }
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    } catch {
      resolve(file);
    }
  });
}

export async function uploadSingleOrMultipleFiles(fileList, onProgress) {
  const files = Array.from(fileList).filter((f) => {
    const isImage = (f.type && f.type.startsWith('image/')) ||
      /\.(png|jpe?g|webp|gif|svg|heic|avif|bmp)$/i.test(f.name || '');
    return isImage;
  });

  if (files.length === 0) {
    throw new Error('Please select valid image files (PNG, JPG, WEBP, GIF, SVG).');
  }

  const uploadedUrls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (onProgress) {
      onProgress(`Optimizing ${i + 1} of ${files.length}...`);
    }

    const optimized = await optimizeImageForUpload(file);

    if (onProgress) {
      onProgress(`Uploading ${i + 1} of ${files.length}...`);
    }

    const formData = new FormData();
    formData.append('files', optimized);

    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      headers: {
        'x-admin-token': ADMIN_TOKEN,
      },
      credentials: 'include',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload image');
    }

    if (Array.isArray(data.urls) && data.urls.length > 0) {
      uploadedUrls.push(...data.urls);
    } else if (data.url) {
      uploadedUrls.push(data.url);
    }
  }

  return uploadedUrls;
}

export default function ImageDropzone({
  value, // string (url) if multiple=false, or array of strings if multiple=true
  onChange,
  multiple = false,
  label = '',
  helperText = '',
  aspectRatio = 'aspect-[4/3]',
  className = '',
  showUrlInput = true,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');
  const fileInputRef = useRef(null);

  const processFiles = useCallback(
    async (rawFiles) => {
      if (!rawFiles || rawFiles.length === 0) return;
      setUploading(true);
      setError('');
      setSuccess(false);

      try {
        const urls = await uploadSingleOrMultipleFiles(rawFiles, (msg) => {
          setProgressMsg(msg);
        });

        if (multiple) {
          const currentList = Array.isArray(value) ? value : [];
          onChange?.([...currentList, ...urls]);
        } else {
          onChange?.(urls[0] || '');
        }

        setSuccess(true);
        setTimeout(() => setSuccess(false), 2500);
      } catch (err) {
        console.error('Dropzone upload error:', err);
        setError(err.message || 'Upload failed. Please try again.');
        setTimeout(() => setError(''), 5000);
      } finally {
        setUploading(false);
        setProgressMsg('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [multiple, onChange, value]
  );

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only turn off if leaving the root drop zone container
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleManualUrlSubmit = (e) => {
    e?.preventDefault();
    if (!manualUrlInput.trim()) return;
    if (multiple) {
      const currentList = Array.isArray(value) ? value : [];
      onChange?.([...currentList, manualUrlInput.trim()]);
    } else {
      onChange?.(manualUrlInput.trim());
    }
    setManualUrlInput('');
    setShowManualUrl(false);
  };

  const hasSingleValue = !multiple && Boolean(value && typeof value === 'string');

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {label}
          </label>
          {showUrlInput && (
            <button
              type="button"
              onClick={() => setShowManualUrl(!showManualUrl)}
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{showManualUrl ? 'Hide URL field' : 'Paste web URL instead'}</span>
            </button>
          )}
        </div>
      )}

      {/* Manual URL Input dropdown / toggle */}
      {showManualUrl && (
        <div className="flex gap-2 p-2 bg-slate-950/90 border border-slate-700 rounded-xl">
          <input
            type="text"
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            placeholder="Paste direct image link (https://...)"
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleManualUrlSubmit(e);
            }}
          />
          <button
            type="button"
            onClick={handleManualUrlSubmit}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Apply
          </button>
        </div>
      )}

      {/* Main Drag-and-Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative group rounded-xl border-2 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center select-none ${
          isDragging
            ? 'border-amber-400 bg-amber-500/15 scale-[1.01] shadow-lg shadow-amber-500/10 border-dashed ring-4 ring-amber-400/20'
            : hasSingleValue
            ? 'border-slate-800 bg-slate-950 hover:border-slate-700'
            : 'border-dashed border-slate-700 hover:border-amber-400/70 bg-slate-950/60 hover:bg-slate-950/90'
        } ${multiple ? 'p-6 min-h-[140px]' : aspectRatio}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => processFiles(e.target.files)}
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml,image/heic,image/avif"
          multiple={multiple}
          className="hidden"
        />

        {/* Uploading State Overlay */}
        {uploading && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-2" />
            <span className="text-xs font-bold text-white tracking-wide">
              {progressMsg || 'Uploading photo...'}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">
              Optimizing and securing image...
            </span>
          </div>
        )}

        {/* Success State Overlay */}
        {success && !uploading && (
          <div className="absolute inset-0 z-20 bg-emerald-950/80 backdrop-blur-sm flex items-center justify-center gap-2 p-3 text-emerald-300 font-bold text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Photo successfully uploaded!</span>
          </div>
        )}

        {/* Single Image Display with Hover Overlay */}
        {hasSingleValue && !isDragging ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Uploaded Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://picsum.photos/seed/placeholder/800/600';
              }}
            />

            {/* Hover Actions Bar */}
            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 shadow-md">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Drag new photo here or click to replace</span>
              </span>

              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange?.('');
                  }}
                  className="px-2.5 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Multiple Drop Zone Placeholder */
          <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                isDragging
                  ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg'
                  : 'bg-slate-900 text-amber-400 group-hover:bg-amber-500/10 group-hover:scale-105'
              }`}
            >
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                {isDragging
                  ? 'Drop photo to upload now'
                  : multiple
                  ? 'Drag & drop photos here, or click to browse'
                  : 'Drag & drop photo here, or click to upload'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {helperText ||
                  'Upload directly from your computer or phone (JPG, PNG, WEBP, GIF)'}
              </p>
            </div>

            <div className="pt-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-semibold border border-slate-700 transition-colors">
                <ImageIcon className="w-3 h-3" />
                <span>Browse Files</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
