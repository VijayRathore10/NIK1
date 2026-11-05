'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: 'Which country do you export to?',
    answer:
      'We export to over 100 countries around the world, primarily Africa, South America, and Asia.',
  },
  {
    question: 'What are the products you have in stock?',
    answer:
      'We stock a wide variety of trucks, buses, heavy equipments, and agricultural equipment. New models are frequently added to our regular stock and can be sourced on demand.',
  },
  {
    question: 'How can I buy from SSG Motors?',
    answer:
      'You can request a quote directly via our website, and one of our specialists will promptly get in touch with you. Alternatively, you can get directly contact our specialist through the contact section of our webpage.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleItem = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-[#F8FAFC] border-t border-line relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-5 md:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-18">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#E5A91A]/15 text-[#996D0B] mono-label text-xs uppercase font-bold tracking-widest mb-3 rounded-full border border-[#E5A91A]/30">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#102035] uppercase tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-[#3E4C59] text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
            Everything you need to know about our global commercial export services, inventory availability, and order process.
          </p>
        </div>

        {/* Accordion Questions List */}
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-[#E5A91A] shadow-lg shadow-[#102035]/5'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] shadow-sm'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  aria-expanded={isOpen}
                  className="w-full px-6 sm:px-8 py-5 sm:py-6 text-left flex items-center justify-between gap-4 cursor-pointer select-none group"
                >
                  <span className="font-display text-lg sm:text-xl font-bold text-[#102035] group-hover:text-[#996D0B] transition-colors pr-2">
                    {item.question}
                  </span>
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen
                        ? 'bg-[#E5A91A] text-[#102035] rotate-180'
                        : 'bg-[#F0F5FA] text-[#102035] group-hover:bg-[#E5A91A]/20'
                    }`}
                  >
                    <ChevronDown className="w-5 h-5 transition-transform duration-300" />
                  </div>
                </button>

                {/* Collapsible Answer */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 sm:px-8 pb-6 sm:pb-7 pt-1 border-t border-dashed border-[#E2E8F0]/80">
                    <p className="text-[#3E4C59] text-base sm:text-lg leading-relaxed font-normal">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
