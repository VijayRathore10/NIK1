'use client';

import React, { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { uploadSingleOrMultipleFiles } from './ImageDropzone';

export default function ImageUploadButton({
  onUploaded,
  onMultipleUploaded,
  multiple = false,
  label = 'Upload Image',
  className = '',
  buttonStyle = 'primary', // 'primary' | 'secondary' | 'compact'
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      const urls = await uploadSingleOrMultipleFiles(files);

      if (multiple && onMultipleUploaded) {
        onMultipleUploaded(urls);
      } else if (onUploaded) {
        onUploaded(urls[0]);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Upload failed');
      setTimeout(() => setError(''), 4000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const styleClasses = {
    primary:
      'px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50',
    secondary:
      'px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-400/60 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50',
    compact:
      'px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50',
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml,image/heic,image/avif"
        multiple={multiple}
        className="hidden"
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className={`${styleClasses[buttonStyle] || styleClasses.primary} ${
          isDragOver ? 'ring-2 ring-amber-400 scale-105 bg-amber-400 text-slate-950' : ''
        }`}
        title="Upload or drag & drop image from your computer / phone"
      >
        {uploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Uploading...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Uploaded!</span>
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" />
            <span>{isDragOver ? 'Drop Image Here' : label}</span>
          </>
        )}
      </button>

      {error && (
        <span className="text-[11px] text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </span>
      )}
    </div>
  );
}
