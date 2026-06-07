"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCartStore, useWishlistStore } from "@/lib/store/cart-store";
import { formatPrice, cn } from "@/lib/utils";
import type { ProductWithDetails } from "@/types";
import { toast } from "sonner";

interface ProductCardProps {
  product: ProductWithDetails;
  index?: number;
  className?: string;
}

export function ProductCard({ product, index = 0, className }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { toggleItem, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);
  const outOfStock = (product.inventory?.quantity ?? 0) <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (outOfStock) {
      toast.error("This fragrance is currently out of stock");
      return;
    }
    addItem(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product.id);
    toast.success(inWishlist ? "Removed from wishlist" : "Added to wishlist");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn("group luxury-card overflow-hidden", className)}
    >
      <Link href={`/shop/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-obsidian-800">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.newArrival && <Badge variant="emerald">New</Badge>}
            {product.bestSeller && <Badge>Best Seller</Badge>}
            {product.comboOffer && <Badge variant="secondary">Gift Set</Badge>}
          </div>

          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={handleWishlist}
              className={cn(
                "w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors",
                inWishlist
                  ? "bg-gold-500/20 text-gold-400 border border-gold-500/50"
                  : "bg-obsidian-950/60 text-ivory-100 hover:text-gold-400 border border-obsidian-600"
              )}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />
            </button>
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="w-9 h-9 rounded-full bg-obsidian-950/60 backdrop-blur-sm flex items-center justify-center text-ivory-100 hover:text-gold-400 border border-obsidian-600 transition-colors disabled:opacity-50"
              aria-label="Add to cart"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          </div>

          {outOfStock && (
            <div className="absolute inset-0 bg-obsidian-950/60 flex items-center justify-center">
              <Badge variant="destructive">Out of Stock</Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <p className="text-xs text-obsidian-400 uppercase tracking-wider mb-1">
            {product.category.name}
          </p>
          <h3 className="font-heading text-lg text-ivory-100 group-hover:text-gold-400 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-obsidian-400 mt-1">{product.volume}</p>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-gold-400 font-medium">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="text-xs text-obsidian-500 line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>
            {product.averageRating && product.averageRating > 0 && (
              <div className="flex items-center gap-1 text-xs text-obsidian-400">
                <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
                {product.averageRating}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
