"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  _count?: { products: number };
}

const categoryImages: Record<string, string> = {
  "oud-collection":
    "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80",
  "amber-collection":
    "https://images.unsplash.com/photo-1594035910387-825c468a785f?w=600&q=80",
  "floral-collection":
    "https://images.unsplash.com/photo-1595425970387-0ce577a8d7c2?w=600&q=80",
  "gift-sets":
    "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=600&q=80",
};

export function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="section-padding bg-obsidian-900/30">
      <div className="container-luxury">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-2xl md:text-4xl tracking-widest text-ivory-50 uppercase">
            Collections
          </h2>
          <p className="font-heading text-lg text-obsidian-300 mt-3">
            Curated fragrance families for every discerning taste
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((category, i) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={`/shop?category=${category.slug}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-lg"
              >
                <Image
                  src={category.image || categoryImages[category.slug] || categoryImages["oud-collection"]}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-heading text-xl text-ivory-50 group-hover:text-gold-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-obsidian-300 mt-1">
                    {category._count?.products ?? 0} fragrances
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-gold-400 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
