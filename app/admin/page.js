'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ProductEditorModal from '@/components/admin/ProductEditorModal';
import CategoryEditorModal from '@/components/admin/CategoryEditorModal';
import TestimonialEditorModal from '@/components/admin/TestimonialEditorModal';
import SiteSettingsEditor from '@/components/admin/SiteSettingsEditor';
import Link from 'next/link';
import {
  Truck,
  Layers,
  MessageSquareQuote,
  Settings,
  Mail,
  Download,
  Upload,
  Plus,
  Search,
  Edit,
  Trash2,
  Lock,
  ExternalLink,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Database,
  Eye,
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('products');

  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Modals
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);

  // Backup file input ref
  const fileInputRef = useRef(null);

  // Product Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Check auth on load
  const verifyAuth = useCallback(async () => {
    setCheckingAuth(true);
    try {
      const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('nik_admin_auth') || '' : '';
      const res = await fetch('/api/admin/auth', {
        headers: storedToken ? { 'x-admin-token': storedToken } : {},
      });
      const data = await res.json();
      setIsAuthenticated(Boolean(data.authenticated));
    } catch {
      setIsAuthenticated(false);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    verifyAuth();
  }, [verifyAuth]);

  // Load all data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes, testiRes, setsRes, inqsRes] = await Promise.all([
        fetch('/api/admin/products').then((r) => r.json()),
        fetch('/api/admin/categories').then((r) => r.json()),
        fetch('/api/admin/testimonials').then((r) => r.json()),
        fetch('/api/admin/settings').then((r) => r.json()),
        fetch('/api/admin/inquiries').then((r) => r.json()),
      ]);

      setProducts(Array.isArray(prodsRes) ? prodsRes : []);
      setCategories(Array.isArray(catsRes) ? catsRes : []);
      setTestimonials(Array.isArray(testiRes) ? testiRes : []);
      setSiteSettings(setsRes || {});
      setInquiries(Array.isArray(inqsRes) ? inqsRes : []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid administrator password');
      }

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('nik_admin_auth', 'nik-authorized-session-token-v1');
      }
      setIsAuthenticated(true);
      loadData();
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nik_admin_auth');
    }
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setIsAuthenticated(false);
  };

  // Product Actions
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter((p) => p._id !== id));
        showToast(`Deleted ${name}`);
      }
    } catch {
      alert('Failed to delete vehicle');
    }
  };

  const handleSaveProduct = (saved) => {
    const idx = products.findIndex((p) => p._id === saved._id);
    if (idx >= 0) {
      const copy = [...products];
      copy[idx] = saved;
      setProducts(copy);
      showToast(`Updated "${saved.name}"`);
    } else {
      setProducts([saved, ...products]);
      showToast(`Created "${saved.name}"`);
    }
  };

  // Category Actions
  const handleDeleteCategory = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete category "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCategories(categories.filter((c) => c._id !== id && c.slug !== id));
        showToast(`Deleted category "${title}"`);
      }
    } catch {
      alert('Failed to delete category');
    }
  };

  const handleSaveCategory = (saved) => {
    const idx = categories.findIndex((c) => c._id === saved._id || c.slug === saved.slug);
    if (idx >= 0) {
      const copy = [...categories];
      copy[idx] = saved;
      setCategories(copy);
      showToast(`Updated category "${saved.title}"`);
    } else {
      setCategories([...categories, saved]);
      showToast(`Created category "${saved.title}"`);
    }
  };

  // Testimonial Actions
  const handleDeleteTestimonial = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete testimonial from "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/testimonials?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTestimonials(testimonials.filter((t) => t._id !== id));
        showToast(`Deleted testimonial from "${name}"`);
      }
    } catch {
      alert('Failed to delete testimonial');
    }
  };

  const handleSaveTestimonial = (saved) => {
    const idx = testimonials.findIndex((t) => t._id === saved._id);
    if (idx >= 0) {
      const copy = [...testimonials];
      copy[idx] = saved;
      setTestimonials(copy);
      showToast(`Updated testimonial from "${saved.customerName}"`);
    } else {
      setTestimonials([...testimonials, saved]);
      showToast(`Created testimonial from "${saved.customerName}"`);
    }
  };

  // Quick Position Update Handlers
  const handleUpdateProductPosition = async (id, newPosition) => {
    const target = products.find((p) => p._id === id);
    if (!target) return;
    const parsedOrder =
      newPosition === '' || newPosition === null ? null : Number(newPosition);
    const updated = { ...target, order: parsedOrder };

    const copy = products.map((p) => (p._id === id ? updated : p));
    setProducts(copy);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        showToast(
          `Updated position for "${target.name}" to ${
            parsedOrder !== null ? '#' + parsedOrder : 'Default'
          }`
        );
      } else {
        loadData();
      }
    } catch {
      loadData();
    }
  };

  const handleUpdateTestimonialPosition = async (id, newPosition) => {
    const target = testimonials.find((t) => t._id === id);
    if (!target) return;
    const parsedOrder =
      newPosition === '' || newPosition === null ? null : Number(newPosition);
    const updated = { ...target, order: parsedOrder };

    const copy = testimonials.map((t) => (t._id === id ? updated : t));
    setTestimonials(copy);

    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        showToast(
          `Updated position for "${target.customerName}" to ${
            parsedOrder !== null ? '#' + parsedOrder : 'Default'
          }`
        );
      } else {
        loadData();
      }
    } catch {
      loadData();
    }
  };

  // Inquiries Actions
  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('Delete this inquiry record?')) return;
    try {
      const res = await fetch(`/api/admin/inquiries?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setInquiries(inquiries.filter((inq) => inq._id !== id));
        showToast('Inquiry removed');
      }
    } catch {
      alert('Failed to delete inquiry');
    }
  };

  // Restore Database Backup
  const handleRestoreFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Restore database from file "${file.name}"? This will update all vehicles and settings.`)) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      if (res.ok) {
        showToast('Database successfully restored!');
        loadData();
      } else {
        alert('Failed to restore database from backup file.');
      }
    } catch (err) {
      alert('Invalid backup file JSON: ' + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filtered Products - sorted basis position numbering system (1, 2, 3...)
  const sortedProducts = [...products].sort((a, b) => {
    const hasA = a.order !== undefined && a.order !== null && a.order !== '';
    const hasB = b.order !== undefined && b.order !== null && b.order !== '';
    const orderA = hasA ? Number(a.order) : Infinity;
    const orderB = hasB ? Number(b.order) : Infinity;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });

  const filteredProducts = sortedProducts.filter((p) => {
    const matchesQuery =
      (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category?.slug === categoryFilter;
    return matchesQuery && matchesCat;
  });

  // Testimonials sorted basis position numbering system (1, 2, 3...)
  const sortedTestimonials = [...testimonials].sort((a, b) => {
    const hasA = a.order !== undefined && a.order !== null && a.order !== '';
    const hasB = b.order !== undefined && b.order !== null && b.order !== '';
    const orderA = hasA ? Number(a.order) : Infinity;
    const orderB = hasB ? Number(b.order) : Infinity;
    return orderA - orderB;
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0A101D] text-slate-100 flex items-center justify-center p-4">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
          <span className="text-sm font-medium text-slate-300">Checking credentials...</span>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A101D] text-slate-100 flex items-center justify-center p-4 select-none">
        <div className="max-w-md w-full bg-[#131D2F] border border-slate-700/80 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold font-display uppercase tracking-tight text-white">
              Nik Exports Admin
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Local Fleet & Specifications Management Portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 rounded-xl bg-[#0A101D] border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                <span>Default setup password: <strong className="text-amber-400 font-mono">admin123</strong></span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loggingIn ? 'Authenticating...' : 'Enter Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-amber-400 inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Return to live public website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A101D] text-slate-100 flex flex-col font-sans select-none">
      {/* Hidden File Input for Restoring Backup */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRestoreFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Admin Bar */}
      <header className="bg-[#131D2F] border-b border-slate-800 px-5 md:px-8 py-3.5 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center font-display text-lg">
              N
            </div>
            <div>
              <span className="font-display font-bold text-base tracking-tight text-white uppercase block leading-none">
                Nik Exports
              </span>
              <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
                Firebase Cloud Admin
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full border border-emerald-500/30 text-[11px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Connected to Firebase (Firestore & Cloud Storage)</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Backup & Restore Controls */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <a
              href="/api/admin/backup"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              title="Download full JSON backup"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Backup</span>
            </a>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="Restore from JSON backup"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restore</span>
            </button>
          </div>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-64 bg-[#0E1626] border-b md:border-b-0 md:border-r border-slate-800 p-4 shrink-0 flex md:flex-col justify-between overflow-x-auto">
          <nav className="flex md:flex-col gap-1.5 w-full">
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer shrink-0 ${
                activeTab === 'products'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4" />
                <span>Vehicles</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'products' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer shrink-0 ${
                activeTab === 'categories'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Categories</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'categories' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('testimonials')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer shrink-0 ${
                activeTab === 'testimonials'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquareQuote className="w-4 h-4" />
                <span>Testimonials</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'testimonials' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {testimonials.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer shrink-0 ${
                activeTab === 'inquiries'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4" />
                <span>Inquiries</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'inquiries' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}>
                {inquiries.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors cursor-pointer shrink-0 ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Site Settings</span>
            </button>
          </nav>

          <div className="hidden md:block pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            <p className="font-semibold text-emerald-400">Firebase Cloud Sync</p>
            <p className="mt-0.5">All updates save directly to Google Cloud Firestore and sync across all devices.</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto">
          {/* TAB 1: VEHICLES & EQUIPMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                    Vehicles & Heavy Equipment
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage vehicle cards, position numbering (defines display order on main page), gallery images, and 30-row Excel specification tables.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductModal(true);
                  }}
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by vehicle name, model, make, or specs..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#131D2F] border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#131D2F] border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="all">All Categories ({products.length})</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.title}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={loadData}
                    className="p-2 rounded-xl bg-[#131D2F] hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map((p) => {
                  const specsCount = (p.specifications || []).filter(
                    (s) => s && ((s.label && s.label.trim()) || (s.value && s.value.trim()))
                  ).length;

                  return (
                    <div
                      key={p._id || p.slug}
                      className="bg-[#131D2F] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors group"
                    >
                      <div>
                        {/* Image with badges */}
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

                        {/* Product Deck Position Numbering Bar */}
                        <div className="px-3.5 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                              Position #
                            </span>
                            <input
                              type="number"
                              min="1"
                              defaultValue={p.order ?? ''}
                              key={`p-order-${p._id}-${p.order}`}
                              onBlur={(e) => handleUpdateProductPosition(p._id, e.target.value)}
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
                              📊 {specsCount} Specifications
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
                            onClick={() => {
                              setEditingProduct(p);
                              setShowProductModal(true);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Specs</span>
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p._id, p.name)}
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

              {filteredProducts.length === 0 && (
                <div className="text-center py-16 bg-[#131D2F] rounded-2xl border border-slate-800">
                  <Truck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-base font-semibold text-slate-300">No vehicles found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try adjusting your search terms or add a new vehicle.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CATEGORIES (WITH FULL EDIT & CREATE MODAL) */}
          {activeTab === 'categories' && (
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
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCategoryModal(true);
                  }}
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
                            onClick={() => {
                              setEditingCategory(c);
                              setShowCategoryModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteCategory(c._id, c.title)}
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
          )}

          {/* TAB 3: TESTIMONIALS (WITH FULL EDIT & CREATE MODAL) */}
          {activeTab === 'testimonials' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                    Client Testimonials & Delivery Photos
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Testimonials rotate automatically on the homepage with alternating photos and quotes.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingTestimonial(null);
                    setShowTestimonialModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Testimonial</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {sortedTestimonials.map((t, idx) => (
                  <div
                    key={t._id || idx}
                    className="bg-[#131D2F] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      {/* Testimonial Position Numbering Bar */}
                      <div className="flex items-center justify-between gap-2 p-2.5 mb-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono">
                            Position #
                          </span>
                          <input
                            type="number"
                            min="1"
                            defaultValue={t.order ?? ''}
                            key={`t-order-${t._id}-${t.order}`}
                            onBlur={(e) => handleUpdateTestimonialPosition(t._id, e.target.value)}
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
                          onClick={() => {
                            setEditingTestimonial(t);
                            setShowTestimonialModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTestimonial(t._id, t.customerName)}
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
          )}

          {/* TAB 4: INQUIRIES / LEADS */}
          {activeTab === 'inquiries' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                    Client Inquiries & Quote Requests
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
                      className="bg-[#131D2F] border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-white text-sm">{inq.name}</h4>
                          {inq.product && (
                            <span className="mono-label text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              {inq.product}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap gap-3 font-mono">
                          <span>📧 {inq.email}</span>
                          {inq.phone && <span>📞 {inq.phone}</span>}
                          <span>📅 {new Date(inq.submittedAt).toLocaleString()}</span>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed mt-2">
                          {inq.message}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteInquiry(inq._id)}
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
          )}

          {/* TAB 5: SITE SETTINGS & HERO SLIDER */}
          {activeTab === 'settings' && siteSettings && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                  Website Settings & Hero Photography
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update hero slider slides, taglines, company contact details, and social links.
                </p>
              </div>

              <SiteSettingsEditor
                settings={siteSettings}
                onSave={(updated) => {
                  setSiteSettings(updated);
                  showToast('Site settings updated successfully!');
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Product Editor Modal */}
      {showProductModal && (
        <ProductEditorModal
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={handleSaveProduct}
        />
      )}

      {/* Category Editor Modal */}
      {showCategoryModal && (
        <CategoryEditorModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
        />
      )}

      {/* Testimonial Editor Modal */}
      {showTestimonialModal && (
        <TestimonialEditorModal
          testimonial={editingTestimonial}
          onClose={() => {
            setShowTestimonialModal(false);
            setEditingTestimonial(null);
          }}
          onSave={handleSaveTestimonial}
        />
      )}
    </div>
  );
}
