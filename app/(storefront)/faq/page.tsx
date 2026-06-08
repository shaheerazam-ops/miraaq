"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "What makes Miraaq fragrances unique?", a: "Our fragrances use rare, aged oud oils sourced directly from Cambodia, India, and Laos. Each composition is hand-blended in small batches by our master perfumers, following recipes passed down through four generations." },
  { q: "How long does shipping take?", a: "Standard shipping takes 5-7 business days domestically and 10-14 days internationally. Express shipping (2-3 days) is available at checkout. Orders over 1500 PKR qualify for complimentary standard shipping." },
  { q: "What is your return policy?", a: "We offer a 30-day satisfaction guarantee on unopened products in original packaging. Opened fragrances may be exchanged within 14 days if you're not satisfied. See our Return Policy for full details." },
  { q: "Are your products authentic?", a: "Absolutely. Every Miraaq product comes with a certificate of authenticity and batch number. We source directly from certified suppliers and never use synthetic oud substitutes." },
  { q: "Do you offer gift wrapping?", a: "Yes, complimentary luxury gift wrapping is available on all orders. You may also add a personalized message at checkout." },
  { q: "How should I store my fragrance?", a: "Store in a cool, dark place away from direct sunlight and temperature fluctuations. Avoid bathroom storage due to humidity. Properly stored, our fragrances maintain their quality for 3-5 years." },
  { q: "Can I get a fragrance consultation?", a: "Our WhatsApp concierge offers complimentary fragrance consultations. Contact us to schedule a virtual or in-boutique session with our experts." },
  { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, jazzcash, and easypaisa through secure payment partners." },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="pt-20 md:pt-24">
      <div className="container-luxury py-12 md:py-16 max-w-3xl">
        <h1 className="font-display text-4xl tracking-widest text-ivory-50 uppercase mb-4">FAQ</h1>
        <p className="text-obsidian-300 mb-12">Frequently asked questions about Miraaq.</p>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="luxury-card overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-heading text-ivory-100 pr-4">{faq.q}</span>
                <ChevronDown className={cn("h-5 w-5 text-gold-400 flex-shrink-0 transition-transform", open === i && "rotate-180")} />
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-obsidian-300 leading-relaxed border-t border-obsidian-800 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
