'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import AdminLogin from '@/components/admin/AdminLogin';
import VehiclesTab from '@/components/admin/VehiclesTab';
import CategoriesTab from '@/components/admin/CategoriesTab';
import TestimonialsTab from '@/components/admin/TestimonialsTab';
import InquiriesTab from '@/components/admin/InquiriesTab';
import SiteSettingsEditor from '@/components/admin/SiteSettingsEditor';
import ProductEditorModal from '@/components/admin/ProductEditorModal';
import CategoryEditorModal from '@/components/admin/CategoryEditorModal';
import TestimonialEditorModal from '@/components/admin/TestimonialEditorModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import {
  Truck,
  Layers,
  MessageSquareQuote,
  Settings,
  Mail,
  Download,
  Upload,
  ExternalLink,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState('products');

  // Data States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Toast ({ type: 'success' | 'error', message: string } | null)
  const [toast, setToast] = useState(null);
  const toastTimeoutRef = useRef(null);

  // Confirm Dialog state
  const [confirmState, setConfirmState] = useState(null);

  // Editor Modals
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

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const verifyAuth = useCallback(async () => {
    setCheckingAuth(true);
    try {
      const res = await fetch('/api/admin/auth', { credentials: 'include' });
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

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const responses = await Promise.all([
        fetch('/api/admin/products', { credentials: 'include' }),
        fetch('/api/admin/categories', { credentials: 'include' }),
        fetch('/api/admin/testimonials', { credentials: 'include' }),
        fetch('/api/admin/settings', { credentials: 'include' }),
        fetch('/api/admin/inquiries', { credentials: 'include' }),
      ]);

      if (responses.some((r) => r.status === 401)) {
        setIsAuthenticated(false);
        return;
      }

      const [prodsRes, catsRes, testiRes, setsRes, inqsRes] = await Promise.all(
        responses.map((r) => r.json())
      );

      setProducts(Array.isArray(prodsRes) ? prodsRes : []);
      setCategories(Array.isArray(catsRes) ? catsRes : []);
      setTestimonials(Array.isArray(testiRes) ? testiRes : []);
      setSiteSettings(setsRes || {});
      setInquiries(Array.isArray(inqsRes) ? inqsRes : []);
    } catch {
      showToast('Failed to load dashboard data. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', {
      method: 'DELETE',
      credentials: 'include',
    });
    setIsAuthenticated(false);
  };

  // Product Actions
  const handleDeleteProduct = (id, name) => {
    setConfirmState({
      title: 'Delete Vehicle',
      message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (res.status === 401) {
            setIsAuthenticated(false);
            return;
          }
          if (!res.ok) {
            showToast('Failed to delete vehicle.', 'error');
            return;
          }
          setProducts((prev) => prev.filter((p) => p._id !== id));
          showToast(`Deleted "${name}"`);
        } catch {
          showToast('Failed to delete vehicle.', 'error');
        }
      },
    });
  };

  const handleSaveProduct = (saved) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p._id === saved._id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    showToast(`Saved "${saved.name}"`);
  };

  // Category Actions
  const handleDeleteCategory = (id, title) => {
    setConfirmState({
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${title}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (res.status === 401) {
            setIsAuthenticated(false);
            return;
          }
          if (!res.ok) {
            showToast('Failed to delete category.', 'error');
            return;
          }
          setCategories((prev) => prev.filter((c) => c._id !== id && c.slug !== id));
          showToast(`Deleted category "${title}"`);
        } catch {
          showToast('Failed to delete category.', 'error');
        }
      },
    });
  };

  const handleSaveCategory = (saved) => {
    setCategories((prev) => {
      const idx = prev.findIndex((c) => c._id === saved._id || c.slug === saved.slug);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    showToast(`Saved category "${saved.title}"`);
  };

  // Testimonial Actions
  const handleDeleteTestimonial = (id, name) => {
    setConfirmState({
      title: 'Delete Testimonial',
      message: `Are you sure you want to delete the testimonial from "${name}"?`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const res = await fetch(`/api/admin/testimonials?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (res.status === 401) {
            setIsAuthenticated(false);
            return;
          }
          if (!res.ok) {
            showToast('Failed to delete testimonial.', 'error');
            return;
          }
          setTestimonials((prev) => prev.filter((t) => t._id !== id));
          showToast(`Deleted testimonial from "${name}"`);
        } catch {
          showToast('Failed to delete testimonial.', 'error');
        }
      },
    });
  };

  const handleSaveTestimonial = (saved) => {
    setTestimonials((prev) => {
      const idx = prev.findIndex((t) => t._id === saved._id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    showToast(`Saved testimonial from "${saved.customerName}"`);
  };

  // Quick Position Update Handlers
  const handleUpdateProductPosition = async (id, newPosition) => {
    const target = products.find((p) => p._id === id);
    if (!target) return;
    const parsedOrder =
      newPosition === '' || newPosition === null ? null : Number(newPosition);
    const updated = { ...target, order: parsedOrder };

    setProducts((prev) => prev.map((p) => (p._id === id ? updated : p)));

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (res.ok) {
        showToast(
          `Updated position for "${target.name}" to ${
            parsedOrder !== null ? '#' + parsedOrder : 'Default'
          }`
        );
      } else {
        showToast('Failed to update position.', 'error');
        loadData();
      }
    } catch {
      showToast('Failed to update position.', 'error');
      loadData();
    }
  };

  const handleUpdateTestimonialPosition = async (id, newPosition) => {
    const target = testimonials.find((t) => t._id === id);
    if (!target) return;
    const parsedOrder =
      newPosition === '' || newPosition === null ? null : Number(newPosition);
    const updated = { ...target, order: parsedOrder };

    setTestimonials((prev) => prev.map((t) => (t._id === id ? updated : t)));

    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (res.ok) {
        showToast(
          `Updated position for "${target.customerName}" to ${
            parsedOrder !== null ? '#' + parsedOrder : 'Default'
          }`
        );
      } else {
        showToast('Failed to update slide position.', 'error');
        loadData();
      }
    } catch {
      showToast('Failed to update slide position.', 'error');
      loadData();
    }
  };

  // Inquiry Actions
  const handleDeleteInquiry = (id) => {
    setConfirmState({
      title: 'Delete Inquiry',
      message: 'Are you sure you want to permanently remove this inquiry record?',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const res = await fetch(`/api/admin/inquiries?id=${encodeURIComponent(id)}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (res.status === 401) {
            setIsAuthenticated(false);
            return;
          }
          if (!res.ok) {
            showToast('Failed to delete inquiry.', 'error');
            return;
          }
          setInquiries((prev) => prev.filter((inq) => inq._id !== id));
          showToast('Inquiry removed');
        } catch {
          showToast('Failed to delete inquiry.', 'error');
        }
      },
    });
  };

  // Download Database Backup
  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup', { credentials: 'include' });
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      if (!res.ok) {
        showToast('Failed to download backup.', 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nikexports-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Database backup downloaded.');
    } catch {
      showToast('Failed to download backup.', 'error');
    }
  };

  // Restore Database Backup
  const handleRestoreFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const resetInput = () => {
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    setConfirmState({
      title: 'Restore Database Backup',
      message: `Restore database from "${file.name}"? This will update all vehicles, categories, testimonials, and site settings.`,
      confirmLabel: 'Restore Now',
      variant: 'warning',
      onCancel: () => {
        setConfirmState(null);
        resetInput();
      },
      onConfirm: async () => {
        setConfirmState(null);
        try {
          const text = await file.text();
          const parsed = JSON.parse(text);

          const res = await fetch('/api/admin/backup', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed),
          });

          if (res.status === 401) {
            setIsAuthenticated(false);
            return;
          }

          if (res.ok) {
            showToast('Database successfully restored!');
            loadData();
          } else {
            const data = await res.json().catch(() => ({}));
            showToast(data.error || 'Failed to restore database from backup file.', 'error');
          }
        } catch {
          showToast('Invalid JSON backup file. Please select a valid Nik Exports backup.', 'error');
        } finally {
          resetInput();
        }
      },
    });
  };

  const filteredProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const hasA = a.order !== undefined && a.order !== null && a.order !== '';
      const hasB = b.order !== undefined && b.order !== null && b.order !== '';
      const orderA = hasA ? Number(a.order) : Infinity;
      const orderB = hasB ? Number(b.order) : Infinity;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    const query = searchQuery.toLowerCase();
    return sorted.filter((p) => {
      const matchesQuery =
        !query ||
        (p.name || '').toLowerCase().includes(query) ||
        (p.description || '').toLowerCase().includes(query);
      const matchesCat = categoryFilter === 'all' || p.category?.slug === categoryFilter;
      return matchesQuery && matchesCat;
    });
  }, [products, searchQuery, categoryFilter]);

  const sortedTestimonials = useMemo(() => {
    return [...testimonials].sort((a, b) => {
      const hasA = a.order !== undefined && a.order !== null && a.order !== '';
      const hasB = b.order !== undefined && b.order !== null && b.order !== '';
      const orderA = hasA ? Number(a.order) : Infinity;
      const orderB = hasB ? Number(b.order) : Infinity;
      return orderA - orderB;
    });
  }, [testimonials]);

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

  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const navItems = [
    { id: 'products', label: 'Vehicles', icon: Truck, count: products.length },
    { id: 'categories', label: 'Categories', icon: Layers, count: categories.length },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote, count: testimonials.length },
    { id: 'inquiries', label: 'Inquiries', icon: Mail, count: inquiries.length },
    { id: 'settings', label: 'Site Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0A101D] text-slate-100 flex flex-col font-sans">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleRestoreFileChange}
        accept=".json"
        className="hidden"
      />

      {/* Inline Toast Notification */}
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2.5 max-w-md ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-emerald-500 text-slate-950'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="ml-1 opacity-75 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Admin Bar */}
      <header className="bg-[#131D2F] border-b border-slate-800 px-5 md:px-8 py-3.5 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center font-display text-lg">
            N
          </div>
          <div>
            <span className="font-display font-bold text-base tracking-tight text-white uppercase block leading-none">
              Nik Exports
            </span>
            <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">
              Catalog Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="Download full JSON backup"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Backup</span>
            </button>

            <button
              type="button"
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
            type="button"
            onClick={handleLogout}
            aria-label="Sign out"
            className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <aside className="w-full md:w-64 bg-[#0E1626] border-b md:border-b-0 md:border-r border-slate-800 p-4 shrink-0 flex md:flex-col justify-between overflow-x-auto">
          <nav aria-label="Admin navigation" className="flex md:flex-col gap-1.5 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-5 md:p-8 overflow-y-auto">
          {activeTab === 'products' && (
            <VehiclesTab
              products={filteredProducts}
              totalCount={products.length}
              categories={categories}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              loading={loading}
              onRefresh={loadData}
              onAddNew={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              onEdit={(p) => {
                setEditingProduct(p);
                setShowProductModal(true);
              }}
              onDelete={handleDeleteProduct}
              onUpdatePosition={handleUpdateProductPosition}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesTab
              categories={categories}
              products={products}
              onAddNew={() => {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }}
              onEdit={(c) => {
                setEditingCategory(c);
                setShowCategoryModal(true);
              }}
              onDelete={handleDeleteCategory}
            />
          )}

          {activeTab === 'testimonials' && (
            <TestimonialsTab
              testimonials={sortedTestimonials}
              onAddNew={() => {
                setEditingTestimonial(null);
                setShowTestimonialModal(true);
              }}
              onEdit={(t) => {
                setEditingTestimonial(t);
                setShowTestimonialModal(true);
              }}
              onDelete={handleDeleteTestimonial}
              onUpdatePosition={handleUpdateTestimonialPosition}
            />
          )}

          {activeTab === 'inquiries' && (
            <InquiriesTab inquiries={inquiries} onDelete={handleDeleteInquiry} />
          )}

          {activeTab === 'settings' && siteSettings && (
            <div className="space-y-6">
              <div className="pb-4 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white uppercase tracking-tight">
                  Website Settings &amp; Hero Photography
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

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        variant={confirmState?.variant}
        onConfirm={confirmState?.onConfirm}
        onCancel={confirmState?.onCancel || (() => setConfirmState(null))}
      />

      {/* Editor Modals */}
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
