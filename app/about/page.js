import AboutSection from '@/components/AboutSection';
import FaqSection from '@/components/FaqSection';
import Link from 'next/link';
import { ArrowRight, PhoneCall } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'About Us | NIK EXPORTS',
  description:
    'NIK EXPORTS is India’s leading Export house specializing in commercial vehicles, agricultural machinery, and heavy equipment.',
};

export default function AboutPage() {
  return (
    <div className="pt-24 md:pt-32 pb-16">
      <AboutSection />

      {/* FAQ Section */}
      <FaqSection />

      {/* Call to Action Bar */}
      <section className="mx-auto max-w-7xl px-5 md:px-8 mt-10">
        <div className="bg-[#102035] text-white rounded-3xl p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#B69255]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl">
            <span className="mono-label text-xs uppercase font-bold text-[#E5A91A] tracking-widest mb-3 block">
              Partner With Us
            </span>
            <h3 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight mb-4">
              Ready to Expand Your Global Fleet?
            </h3>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed font-light">
              Get in touch with our export specialists for vehicle availability, custom fabrication, and international CIF / FOB logistics solutions.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
            <Link
              href="/contact"
              className="mono-label text-xs uppercase font-bold bg-[#E5A91A] hover:bg-[#D49912] text-[#102035] px-8 py-4 text-center rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Request a Quote</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
