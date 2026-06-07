"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import type { ProductWithDetails } from "@/types";

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: ProductWithDetails[];
  viewAllHref?: string;
  id?: string;
}

export function ProductSection({
  title,
  subtitle,
  products,
  viewAllHref,
  id,
}: ProductSectionProps) {
  if (products.length === 0) return null;

  return (
    <section id={id} className="section-padding">
      <div className="container-luxury">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14 gap-4"
        >
          <div>
            <h2 className="font-display text-2xl md:text-4xl tracking-widest text-ivory-50 uppercase">
              {title}
            </h2>
            {subtitle && (
              <p className="font-heading text-lg text-obsidian-300 mt-2">{subtitle}</p>
            )}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-2 text-sm text-gold-400 hover:text-gold-300 transition-colors tracking-wider uppercase group"
            >
              View All
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
