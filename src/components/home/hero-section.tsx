"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const Hero3D = dynamic(() => import("./hero-3d"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-radial from-gold-500/5 to-transparent animate-pulse" />
  ),
});

export function HeroSection() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -100]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-obsidian-950">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 grain-overlay opacity-30" />

        <Hero3D />
      </div>

      <motion.div
        style={{ opacity, y }}
        className="relative z-10 container-luxury text-center pt-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="h-4 w-4 text-gold-400" />
            <span className="font-body text-xs tracking-[0.4em] uppercase text-gold-400/80">
              Luxury Middle Eastern Fragrances
            </span>
            <Sparkles className="h-4 w-4 text-gold-400" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-wider text-ivory-50 mb-4">
            <span className="gold-text-gradient">MIRAAQ</span>

            <span className="block font-arabic text-3xl sm:text-4xl md:text-5xl text-emerald-500 mt-2">
              عود
            </span>
          </h1>

          <p className="font-heading text-lg md:text-xl text-ivory-200/70 max-w-xl mx-auto mb-10 leading-relaxed">
            Where ancient oud traditions meet modern luxury. Each bottle tells a story of
            craftsmanship passed through generations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="luxury" size="xl" asChild>
              <Link href="/shop">Explore Collection</Link>
            </Button>

            <Button variant="outline" size="xl" asChild>
              <Link href="/about">Our Story</Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="flex flex-col items-center gap-2 text-obsidian-400"
          >
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}