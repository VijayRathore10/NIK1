import HeroSlider from '@/components/HeroSlider';
import CategoryTabsSection from '@/components/CategoryTabsSection';
import TestimonialCarousel from '@/components/TestimonialCarousel';
import AboutSection from '@/components/AboutSection';
import FaqSection from '@/components/FaqSection';
import { getCategories, getProducts, getTestimonials, getSiteSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const [categories, products, testimonials, settings] = await Promise.all([
    getCategories(),
    getProducts(),
    getTestimonials(),
    getSiteSettings(),
  ]);

  return (
    <>
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
