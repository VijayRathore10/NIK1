import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'a3wpvljs';
const DATASET = 'production';

// Sanity image asset ID to direct URL
function refToUrl(ref) {
  if (!ref || typeof ref !== 'string') return '';
  // format: image-420e1a6fe1449cdb6097e8ed4e0eb35eeac92372-2624x1632-png
  const match = ref.match(/^image-([a-f0-9]+)-(\d+x\d+)-([a-z0-9]+)$/);
  if (match) {
    const [, id, dimensions, ext] = match;
    return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${id}-${dimensions}.${ext}`;
  }
  return '';
}

function resolveImg(img) {
  if (!img) return '';
  if (typeof img === 'string') {
    if (img.startsWith('http://') || img.startsWith('https://')) return img;
    if (img.startsWith('image-')) return refToUrl(img);
  }
  if (img.asset?.url) return img.asset.url;
  if (img.asset?._ref) return refToUrl(img.asset._ref);
  if (img.url) return img.url;
  return '';
}

async function sync() {
  const query = `{
    "products": *[_type == "product" && !(_id in path("drafts.**"))] | order(order asc, _createdAt desc) {
      _id,
      name,
      "slug": coalesce(slug.current, _id),
      "cardImage": cardImage {
        ...,
        "asset": asset-> { _id, url }
      },
      "gallery": gallery[] {
        ...,
        "asset": asset-> { _id, url }
      },
      highlights,
      specifications,
      description,
      featured,
      availability,
      "category": category->{ _id, title, "slug": slug.current },
      order,
      _createdAt,
      _updatedAt
    },
    "categories": *[_type == "category" && !(_id in path("drafts.**"))] | order(order asc, _createdAt asc) {
      _id,
      title,
      "slug": slug.current,
      "image": image {
        ...,
        "asset": asset-> { _id, url }
      },
      order
    },
    "testimonials": *[_type in ["testimonial", "testimonials"] && !(_id in path("drafts.**"))] | order(order asc, _createdAt desc) {
      _id,
      customerName,
      customerDetail,
      "photos": photos[] {
        ...,
        "asset": asset-> { _id, url }
      },
      quote,
      order
    },
    "siteSettings": *[_type in ["siteSettings", "settings"] && !(_id in path("drafts.**"))][0] {
      tagline,
      heroImages[] {
        ...,
        "asset": asset-> { _id, url, originalFilename }
      },
      contactEmail,
      contactPhone,
      address,
      aboutText,
      socialLinks
    },
    "inquiries": *[_type == "inquiry" && !(_id in path("drafts.**"))] | order(submittedAt desc) {
      _id,
      name,
      email,
      phone,
      message,
      submittedAt
    }
  }`;

  const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${DATASET}?query=${encodeURIComponent(query)}`;
  console.log('Fetching live data from Sanity Project', PROJECT_ID, '...');
  const res = await fetch(url);
  const data = await res.json();

  if (!data.result) {
    throw new Error('Failed to fetch from Sanity: ' + JSON.stringify(data));
  }

  const { products, categories, testimonials, siteSettings, inquiries } = data.result;

  console.log(`Fetched from Sanity:
  - ${products?.length} products
  - ${categories?.length} categories
  - ${testimonials?.length} testimonials
  - SiteSettings: ${Boolean(siteSettings)}
  - ${inquiries?.length} inquiries`);

  // Transform Categories
  const cleanCategories = (categories || []).map((c, idx) => ({
    _id: c._id || `cat-${idx + 1}`,
    title: c.title,
    slug: c.slug || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    image: resolveImg(c.image) || 'https://picsum.photos/seed/category/800/600',
    order: c.order !== undefined ? c.order : idx,
  }));

  // Transform Products
  const cleanProducts = (products || []).map((p, idx) => {
    const cardImgUrl = resolveImg(p.cardImage);
    const galleryUrls = (p.gallery || [])
      .map(resolveImg)
      .filter(Boolean);

    const specs = (p.specifications || [])
      .filter((s) => s && ((s.label && s.label.trim()) || (s.value && s.value.trim())))
      .map((s) => ({
        label: (s.label || '').trim(),
        value: (s.value || '').trim(),
      }));

    return {
      _id: p._id || `prod-${idx + 1}`,
      name: p.name || 'Unnamed Vehicle',
      slug: p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `vehicle-${idx + 1}`,
      cardImage: cardImgUrl || galleryUrls[0] || 'https://picsum.photos/seed/truck/800/600',
      gallery: galleryUrls.length > 0 ? galleryUrls : [cardImgUrl].filter(Boolean),
      highlights: (p.highlights || []).filter(Boolean),
      specifications: specs,
      description: p.description || '',
      category: p.category ? {
        _id: p.category._id,
        title: p.category.title,
        slug: p.category.slug,
      } : cleanCategories[0],
      availability: p.availability === 'in_stock' ? 'In Stock' : (p.availability || 'Ready for Export'),
      featured: p.featured !== undefined ? p.featured : true,
      order: p.order !== undefined ? p.order : idx,
      updatedAt: p._updatedAt || new Date().toISOString(),
    };
  });

  // Transform Testimonials
  const cleanTestimonials = (testimonials || []).map((t, idx) => {
    const photoUrls = (t.photos || [])
      .map(resolveImg)
      .filter(Boolean);

    return {
      _id: t._id || `testi-${idx + 1}`,
      customerName: t.customerName || 'Verified Client',
      customerDetail: t.customerDetail || 'Commercial Fleet Client',
      quote: t.quote || '',
      photos: photoUrls.slice(0, 4),
      order: t.order !== undefined ? t.order : idx,
    };
  });

  // Transform SiteSettings
  const heroSlideUrls = (siteSettings?.heroImages || [])
    .map(resolveImg)
    .filter(Boolean);

  const cleanSiteSettings = {
    tagline: siteSettings?.tagline || 'COMMERCIAL VEHICLES & FLEET EXPORT',
    aboutText: siteSettings?.aboutText || '',
    contactEmail: siteSettings?.contactEmail || 'export@nikexports.com',
    contactPhone: siteSettings?.contactPhone || '+971 50 698 8527',
    address: siteSettings?.address || 'SevenSeas Global Trading FZ LLC, Compass Building, Al Shohada Road, Ras Al Khaimah, UAE',
    socialLinks: siteSettings?.socialLinks || {
      whatsapp: 'https://wa.me/971506988527',
      facebook: 'https://www.facebook.com/profile.php?id=61592216920291',
      instagram: 'https://www.instagram.com/motorsssg?igsi=MXU2cm8yZG1rbTdiNg==',
      linkedin: '',
    },
    heroImages: heroSlideUrls.length > 0 ? heroSlideUrls : [
      'https://picsum.photos/seed/ssg-heavy-haulage-1610/1920/1200',
      'https://picsum.photos/seed/ssg-machinery-1610/1920/1200',
      'https://picsum.photos/seed/ssg-transit-1610/1920/1200',
      'https://picsum.photos/seed/ssg-agricultural-1610/1920/1200',
    ],
  };

  // Transform Inquiries
  const cleanInquiries = (inquiries || []).map((inq, idx) => ({
    _id: inq._id || `inq-${idx + 1}`,
    name: inq.name || 'Anonymous',
    email: inq.email || '',
    phone: inq.phone || '',
    message: inq.message || '',
    submittedAt: inq.submittedAt || new Date().toISOString(),
  }));

  const finalDatabase = {
    categories: cleanCategories,
    products: cleanProducts,
    testimonials: cleanTestimonials,
    siteSettings: cleanSiteSettings,
    inquiries: cleanInquiries,
  };

  const dataDir = path.join(process.cwd(), 'data');
  const storeFile = path.join(dataDir, 'store.json');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(storeFile, JSON.stringify(finalDatabase, null, 2), 'utf-8');
  console.log('✓ Successfully replaced store.json with all existing real Sanity data!');
  console.log(`Saved:
  - ${cleanProducts.length} real products
  - ${cleanCategories.length} real categories
  - ${cleanTestimonials.length} real testimonials
  - Complete real site settings & real image CDN assets`);
}

sync().catch(console.error);
