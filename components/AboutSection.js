'use client';

import { Award, Globe2, Truck } from 'lucide-react';

export default function AboutSection() {
  const cards = [
    {
      icon: Award,
      title: 'Extensive Expertise',
      description:
        'With years of experience in the field, we possess comprehensive knowledge and expertise in Automotive sector, ensuring that our clients receive the best value.',
    },
    {
      icon: Globe2,
      title: 'Global Reach',
      description:
        'Operating on a global scale, we have developed a robust network that enables us to deliver efficiently and promptly to clients worldwide.',
    },
    {
      icon: Truck,
      title: 'Wider Portfolio',
      description:
        'From transportation and agriculture to construction and specialized applications, we offer a diverse range of solutions tailored to meet specific business needs.',
    },
  ];

  return (
    <section id="about" className="w-full bg-white py-20 md:py-28 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Section Header - Matching "EXPLORE OUR CATALOGUE HERE" styling & positioning */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <h2 className="font-display text-3xl md:text-5xl font-bold uppercase tracking-tight text-[#e8a23d]">
              WHY NIK EXPORTS?
            </h2>
          </div>
        </div>

        {/* Description from the bottom-most / footer section */}
        <div className="mb-14 max-w-4xl">
          <p className="text-base sm:text-lg text-[#3E4C59] leading-relaxed font-normal">
            Headquartered in Delhi, NIK Exports is your reliable gateway to the global automotive market. As premier exporters and traders, we supply worldwide clients with top-tier automotive products across all categories. Partner with us for consistent, hassle-free deliveries you can always depend on.
          </p>
        </div>

        {/* 3 Core Pillar Feature Cards with Golden Hover transition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-8 sm:p-9 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1.5 border border-line hover:border-amber hover:bg-gradient-to-b hover:from-[#FFFBF2] hover:to-[#FFF5DF] group cursor-pointer"
              >
                <div>
                  {/* Icon */}
                  <div className="text-steel group-hover:text-amber mb-7 group-hover:scale-110 transition-all duration-300 origin-left">
                    <Icon className="w-11 h-11 stroke-[1.8]" />
                  </div>

                  {/* Title */}
                  <h4 className="font-display text-2xl sm:text-3xl font-bold text-steel group-hover:text-steel tracking-tight mb-4 transition-colors duration-200">
                    {card.title}
                  </h4>

                  {/* Horizontal Divider Line */}
                  <div className="w-full h-[1.5px] bg-line group-hover:bg-amber/60 mb-5 transition-colors duration-200" />

                  {/* Description */}
                  <p className="text-graphite group-hover:text-[#4A3D24] text-sm sm:text-base leading-relaxed font-normal transition-colors duration-200">
                    {card.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

