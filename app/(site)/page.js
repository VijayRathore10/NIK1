import HeroSlider from '@/components/HeroSlider';
import CategoryTabsSection from '@/components/CategoryTabsSection';
import TestimonialCarousel from '@/components/TestimonialCarousel';
import AboutSection from '@/components/AboutSection';
import FaqSection from '@/components/FaqSection';
import { getCategories, getProducts, getTestimonials, getSiteSettings } from '@/lib/data';
import { DEFAULT_SITE_SETTINGS, getSiteBaseUrl } from '@/lib/validation';

export const revalidate = 300;

export default async function HomePage() {
  const [categories, products, testimonials, settings] = await Promise.all([
    getCategories(),
    getProducts(),
    getTestimonials(),
    getSiteSettings(),
  ]);

  const baseUrl = getSiteBaseUrl();
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NIK EXPORTS',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      settings?.aboutText?.replace(/SSG Motors/g, 'Nik Exports') ||
      DEFAULT_SITE_SETTINGS.aboutText,
    email: settings?.contactEmail || DEFAULT_SITE_SETTINGS.contactEmail,
    telephone: settings?.contactPhone || DEFAULT_SITE_SETTINGS.contactPhone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings?.address || DEFAULT_SITE_SETTINGS.address,
      addressCountry: 'IN',
    },
    sameAs: [
      settings?.socialLinks?.facebook,
      settings?.socialLinks?.instagram,
      settings?.socialLinks?.linkedin,
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c'),
        }}
      />

      {/* 16:10 Hero Slider Section with Transparent Navbar Overlay */}
      <HeroSlider images={settings?.heroImages} tagline={settings?.tagline} />

      {/* Category Tabs & Filtered Product Showcase */}
      <CategoryTabsSection categories={categories} products={products} />

      {/* About NIK EXPORTS Section */}
      <AboutSection />

      {/* Frequently Asked Questions Section */}
      <FaqSection />

      {/* Global Trust & Testimonials */}
      <TestimonialCarousel testimonials={testimonials} />
    </>
  );
}
