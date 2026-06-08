"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Al-Rashid",
    location: "Karachi, Pakistan",
    rating: 5,
    text: "The Royal Oud is absolutely divine. It lasts all day and the compliments never stop. Miraaq has become my signature scent.",
  },
  {
    name: "James Whitmore",
    location: "London, UK",
    rating: 5,
    text: "I've tried niche fragrances from Paris to Grasse, but nothing compares to the depth and complexity of Miraaq's amber collection.",
  },
  {
    name: "Fatima Hassan",
    location: "Riyadh, KSA",
    rating: 5,
    text: "The packaging alone is a work of art. But the fragrance inside? Pure magic. A true luxury experience from unboxing to the last drop.",
  },
  {
    name: "Marcus Chen",
    location: "Singapore",
    rating: 5,
    text: "Ordered the gift set for my wife's birthday. The presentation was museum-quality. She was moved to tears. Exceptional in every way.",
  },
];

export function TestimonialsSection() {
  return (
    <section className="section-padding overflow-hidden">
      <div className="container-luxury">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-2xl md:text-4xl tracking-widest text-ivory-50 uppercase">
            Client Stories
          </h2>
          <p className="font-heading text-lg text-obsidian-300 mt-3">
            Trusted by fragrance connoisseurs worldwide
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="luxury-card p-6 md:p-8 relative"
            >
              <Quote className="h-8 w-8 text-gold-500/20 absolute top-6 right-6" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-gold-400 text-gold-400" />
                ))}
              </div>
              <p className="text-ivory-200/80 leading-relaxed mb-6 font-heading text-lg italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div>
                <p className="font-medium text-ivory-100">{t.name}</p>
                <p className="text-sm text-obsidian-400">{t.location}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
