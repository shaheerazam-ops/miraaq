"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Truck, Award, HeadphonesIcon } from "lucide-react";

const trustItems = [
  {
    icon: Shield,
    title: "Authenticity Guaranteed",
    description: "100% genuine ingredients sourced from trusted suppliers",
  },
  {
    icon: Truck,
    title: "Worldwide Shipping",
    description: "Complimentary shipping on orders over $150",
  },
  {
    icon: Award,
    title: "Award Winning",
    description: "Recognized by Fragrance Foundation Awards 2024",
  },
  {
    icon: HeadphonesIcon,
    title: "Concierge Service",
    description: "Personal fragrance consultation via WhatsApp",
  },
];

export function TrustIndicators() {
  return (
    <section className="py-12 border-y border-obsidian-800/50">
      <div className="container-luxury">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {trustItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-full border border-gold-500/30 flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-5 w-5 text-gold-400" />
              </div>
              <h3 className="font-heading text-sm text-ivory-100 mb-1">{item.title}</h3>
              <p className="text-xs text-obsidian-400 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BrandStorySection() {
  return (
    <section className="section-padding">
      <div className="container-luxury">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-xs tracking-[0.3em] uppercase text-gold-400">Our Heritage</span>
            <h2 className="font-display text-3xl md:text-4xl tracking-wider text-ivory-50 mt-3 mb-6">
              A Legacy Written in Miraaq
            </h2>
            <p className="text-obsidian-300 leading-relaxed mb-4">
              Born in the heart of the Arabian Peninsula, Miraaq carries forward a tradition
              spanning over three centuries. Our master perfumers blend rare Cambodian oud with
              precious amber, rose de mai, and saffron from the fields of Khorasan.
            </p>
            <p className="text-obsidian-300 leading-relaxed mb-8">
              Each creation is a testament to patience — some of our oud oils are aged for up to
              ten years before they find their way into our bottles. This is not merely perfume;
              it is liquid gold, captured for those who understand true luxury.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center text-sm text-gold-400 hover:text-gold-300 tracking-wider uppercase transition-colors"
            >
              Discover Our Story →
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative aspect-[4/5] rounded-lg overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 via-obsidian-800 to-emerald-900/30" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="font-arabic text-6xl text-emerald-500/50 mb-4">عود</p>
                <p className="font-display text-2xl tracking-[0.3em] text-gold-400/60">STARTING 2026</p>
              </div>
            </div>
            <div className="absolute inset-0 border border-gold-500/20 rounded-lg m-4" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export function VideoSection() {
  return (
    <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
      <div className="absolute inset-0 bg-obsidian-900">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1618886616188-8f8c789921e1?w=1920&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian-950 via-obsidian-950/70 to-transparent" />
      </div>
      <div className="relative z-10 container-luxury h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg"
        >
          <span className="text-xs tracking-[0.3em] uppercase text-gold-400">Craftsmanship</span>
          <h2 className="font-display text-3xl md:text-4xl tracking-wider text-ivory-50 mt-3 mb-4">
            The Art of Perfumery
          </h2>
          <p className="text-obsidian-300 leading-relaxed">
            Watch our master perfumers at work in our atelier, where tradition meets innovation
            in every drop.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
