export const DEFAULT_SITE_SETTINGS = {
  companyName: 'NIK EXPORTS',
  tagline: 'COMMERCIAL VEHICLES & FLEET EXPORT',
  aboutText:
    'Headquartered in India, NIK EXPORTS is a premier export house delivering world-class commercial vehicles and automotive solutions to global markets. Leveraging deep-rooted partnerships with India’s leading OEMs and specialized fabricators, we streamline international sourcing with precision, transparency, and operational excellence. Partner with NIK EXPORTS for uncompromising quality, tailored vehicle configurations, and reliable global delivery you can trust.',
  contactEmail: 'info@nikexports.com',
  contactPhone: '+91-9216915159',
  address: 'NIK EXPORTS INDIA, New Delhi, India',
  socialLinks: {
    whatsapp: 'https://wa.me/919216915159',
    facebook: 'https://www.facebook.com/profile.php?id=61592216920291',
    instagram: 'https://www.instagram.com/nikexports',
    linkedin: '',
  },
};

export function getSiteBaseUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://nikexports.com';
  try {
    return new URL(raw).origin;
  } catch {
    return 'https://nikexports.com';
  }
}

export function sanitizeString(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length < 3 || trimmed.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function sanitizeUrl(value, { allowRelative = true } = {}) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return '';

  // Allow safe relative paths (block protocol-relative //evil.com)
  if (allowRelative && trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }

  return '';
}

export function formatWhatsAppUrl(rawValue, message = '') {
  const fallback = DEFAULT_SITE_SETTINGS.socialLinks.whatsapp;
  let baseUrl = fallback;

  if (typeof rawValue === 'string' && rawValue.trim()) {
    const trimmed = rawValue.trim();
    const safeUrl = sanitizeUrl(trimmed, { allowRelative: false });
    if (safeUrl) {
      baseUrl = safeUrl;
    } else {
      const digits = trimmed.replace(/[^0-9]/g, '');
      if (digits.length >= 7) {
        baseUrl = `https://wa.me/${digits}`;
      }
    }
  }

  if (!message) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
}

export function sanitizeSlug(value, fallback = '') {
  const source = typeof value === 'string' && value.trim() ? value : fallback;
  return String(source || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120);
}

export function sanitizeDocId(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 128) return '';
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return '';
  return trimmed;
}

export function sanitizeOrder(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100000) return null;
  return Math.floor(parsed);
}

export function sanitizeProductPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Invalid product payload' };
  }

  const name = sanitizeString(raw.name, 160);
  if (!name) {
    return { error: 'Product name is required' };
  }

  const slug = sanitizeSlug(raw.slug, name) || `vehicle-${Date.now()}`;
  const id = sanitizeDocId(raw._id) || `prod-${Date.now()}`;

  const rawCategory = raw.category && typeof raw.category === 'object' ? raw.category : {};
  const catSlug = sanitizeSlug(
    typeof raw.category === 'string' ? raw.category : rawCategory.slug,
    'trucks'
  );
  const catTitle =
    sanitizeString(rawCategory.title, 100) ||
    catSlug.charAt(0).toUpperCase() + catSlug.slice(1);
  const category = {
    ...(sanitizeDocId(rawCategory._id) ? { _id: sanitizeDocId(rawCategory._id) } : {}),
    title: catTitle,
    slug: catSlug || 'trucks',
  };

  const cardImage =
    sanitizeUrl(raw.cardImage) || 'https://picsum.photos/seed/vehicle/800/600';

  const gallery = Array.isArray(raw.gallery)
    ? raw.gallery
        .map((item) => {
          if (typeof item === 'string') return sanitizeUrl(item);
          if (item && typeof item === 'object') {
            return sanitizeUrl(item.url || item.asset?.url || '');
          }
          return '';
        })
        .filter(Boolean)
        .slice(0, 25)
    : [];

  const highlights = Array.isArray(raw.highlights)
    ? raw.highlights
        .map((h) => sanitizeString(String(h || ''), 120))
        .filter(Boolean)
        .slice(0, 20)
    : [];

  const specifications = Array.isArray(raw.specifications)
    ? raw.specifications
        .filter((s) => s && typeof s === 'object')
        .map((s) => ({
          label: sanitizeString(String(s.label || ''), 160),
          value: sanitizeString(String(s.value || ''), 500),
        }))
        .filter((s) => s.label || s.value)
        .slice(0, 30)
    : [];

  return {
    data: {
      _id: id,
      name,
      slug,
      category,
      cardImage,
      gallery: gallery.length > 0 ? gallery : [cardImage],
      highlights,
      specifications,
      description: sanitizeString(raw.description, 5000),
      availability: sanitizeString(raw.availability, 80) || 'Ready for Export',
      order: sanitizeOrder(raw.order),
      featured: Boolean(raw.featured),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function sanitizeCategoryPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Invalid category payload' };
  }

  const title = sanitizeString(raw.title, 100);
  if (!title) {
    return { error: 'Category title is required' };
  }

  const slug = sanitizeSlug(raw.slug, title) || `cat-${Date.now()}`;
  const id = sanitizeDocId(raw._id) || `cat-${Date.now()}`;
  const image =
    sanitizeUrl(raw.image) || 'https://picsum.photos/seed/category/800/600';
  const order = sanitizeOrder(raw.order);

  return {
    data: {
      _id: id,
      title,
      slug,
      image,
      order: order !== null ? order : 0,
    },
  };
}

export function sanitizeTestimonialPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Invalid testimonial payload' };
  }

  const customerName = sanitizeString(raw.customerName, 120);
  const quote = sanitizeString(raw.quote, 2000);
  if (!customerName || !quote) {
    return { error: 'Customer name and quote are required' };
  }

  const id = sanitizeDocId(raw._id) || `testi-${Date.now()}`;
  const photos = Array.isArray(raw.photos)
    ? raw.photos
        .map((item) => {
          if (typeof item === 'string') return sanitizeUrl(item);
          if (item && typeof item === 'object') {
            return sanitizeUrl(item.url || item.asset?.url || '');
          }
          return '';
        })
        .filter(Boolean)
        .slice(0, 4)
    : [];

  return {
    data: {
      _id: id,
      customerName,
      customerDetail: sanitizeString(raw.customerDetail, 160),
      quote,
      photos,
      order: sanitizeOrder(raw.order),
    },
  };
}

export function sanitizeSiteSettingsPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Invalid site settings payload' };
  }

  const contactEmail = sanitizeString(raw.contactEmail, 254);
  if (contactEmail && !isValidEmail(contactEmail)) {
    return { error: 'Invalid contact email format' };
  }

  const rawSocial = raw.socialLinks && typeof raw.socialLinks === 'object' ? raw.socialLinks : {};
  const socialLinks = {
    whatsapp: sanitizeUrl(rawSocial.whatsapp, { allowRelative: false }),
    facebook: sanitizeUrl(rawSocial.facebook, { allowRelative: false }),
    instagram: sanitizeUrl(rawSocial.instagram, { allowRelative: false }),
    linkedin: sanitizeUrl(rawSocial.linkedin, { allowRelative: false }),
  };

  const heroImages = Array.isArray(raw.heroImages)
    ? raw.heroImages
        .map((item) => {
          if (typeof item === 'string') return sanitizeUrl(item);
          if (item && typeof item === 'object') {
            return sanitizeUrl(item.url || item.asset?.url || '');
          }
          return '';
        })
        .filter(Boolean)
        .slice(0, 10)
    : [];

  return {
    data: {
      tagline: sanitizeString(raw.tagline, 200),
      aboutText: sanitizeString(raw.aboutText, 2500),
      contactEmail,
      contactPhone: sanitizeString(raw.contactPhone, 40),
      address: sanitizeString(raw.address, 400),
      socialLinks,
      heroImages,
    },
  };
}

export function sanitizeInquiryPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return { error: 'Invalid inquiry payload' };
  }

  const name = sanitizeString(raw.name, 120);
  const email = sanitizeString(raw.email, 254);
  const phone = sanitizeString(raw.phone, 40);
  const message = sanitizeString(raw.message, 3000);
  const product = sanitizeString(raw.product, 200);

  if (!name || !email || !message) {
    return { error: 'Name, email, and message are required.' };
  }

  if (!isValidEmail(email)) {
    return { error: 'Please provide a valid email address.' };
  }

  return {
    data: {
      name,
      email,
      phone,
      message,
      product,
    },
  };
}
