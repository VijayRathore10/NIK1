import InquiryForm from '@/components/InquiryForm';
import { getSiteSettings } from '@/lib/data';
import { Mail, Phone, MapPin, Clock, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {

  title: 'Request a Quote | SSG MOTORS',
  description: 'Request a customized FOB/CIF export quotation for commercial vehicles and machinery.',
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <section className="mx-auto max-w-7xl px-5 md:px-8 pt-28 md:pt-32 pb-20">
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#B69255]/15 text-[#8E6F3A] mono-label text-xs uppercase font-bold tracking-widest mb-3 rounded">
        <span>●</span> Direct Export Desk
      </div>
      <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase text-[#102035] mb-4 border-b border-line pb-6">
        Request a Quote &amp; Contact
      </h1>

      <div className="grid lg:grid-cols-12 gap-12 mt-8">
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <p className="text-[#102035]/80 text-base md:text-lg leading-relaxed mb-8">
              Have a fleet requirement for heavy commercial trucks, transit buses, construction machinery, or agricultural equipment? Send us your specifications to receive availability schedules, technical spec sheets, and competitive FOB/CIF seaport quotations.
            </p>

            <div className="space-y-6 bg-white p-6 md:p-8 rounded-lg border border-line shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded bg-[#B69255]/15 text-[#8E6F3A]">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-graphite uppercase text-[11px] mono-label font-bold block">
                    Export Sales Desk
                  </span>
                  <a
                    href={`mailto:${settings?.contactEmail || 'info@ssgmotors.com'}`}
                    className="font-medium text-[#102035] hover:text-[#B69255] transition-colors"
                  >
                    {settings?.contactEmail || 'info@ssgmotors.com'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded bg-[#B69255]/15 text-[#8E6F3A]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-graphite uppercase text-[11px] mono-label font-bold block">
                    Phone / WhatsApp Direct
                  </span>
                  <a
                    href={`tel:${settings?.contactPhone || '+971506988527'}`}
                    className="font-medium text-[#102035] hover:text-[#B69255] transition-colors"
                  >
                    {settings?.contactPhone || '+971 50 698 8527'}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded bg-[#B69255]/15 text-[#8E6F3A]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-graphite uppercase text-[11px] mono-label font-bold block">
                    Headquarters &amp; Export Office
                  </span>
                  <p className="font-medium text-[#102035] text-sm leading-relaxed">
                    {settings?.address ||
                      'SevenSeas Global Trading FZ LLC, Compass Building, Al Shohada Road, AL Hamra Industrial Zone-FZ, Ras Al Khaimah, United Arab Emirates'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 p-4 bg-[#102035] text-white rounded-lg">
            <ShieldCheck className="w-6 h-6 text-[#D5B57A] shrink-0" />
            <p className="text-xs text-white/90 leading-snug">
              All commercial shipments include verified Pre-Shipment Inspection (PSI) certificates and sea freight documentation.
            </p>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-6 md:p-10 rounded-lg border border-line shadow-lg">
          <InquiryForm productName="" />
        </div>
      </div>
    </section>
  );
}
