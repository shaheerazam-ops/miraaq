"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { appConfig } from "@/lib/env";

const galleryImages = [
  "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&q=80",
  "https://images.unsplash.com/photo-1594035910387-825c468a785f?w=400&q=80",
  "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&q=80",
  "https://images.unsplash.com/photo-1595425970387-0ce577a8d7c2?w=400&q=80",
  "https://images.unsplash.com/photo-1587017539487-1eaad531765b?w=400&q=80",
  "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&q=80",
];

export function InstagramGallery() {
  return (
    <section className="section-padding bg-obsidian-900/30">
      <div className="container-luxury">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="font-display text-2xl md:text-4xl tracking-widest text-ivory-50 uppercase">
            @miraaq
          </h2>
          <Link
            href={appConfig.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 mt-3 transition-colors"
          >
            <Instagram className="h-4 w-4" />
            Follow on Instagram
          </Link>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {galleryImages.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="relative aspect-square overflow-hidden rounded-md group"
            >
              <Image
                src={src}
                alt={`Miraaq gallery ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="200px"
              />
              <div className="absolute inset-0 bg-obsidian-950/0 group-hover:bg-obsidian-950/40 transition-colors flex items-center justify-center">
                <Instagram className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
