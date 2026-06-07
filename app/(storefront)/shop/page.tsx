import { Suspense } from "react";
import { getProducts, getCategories } from "@/services/product.service";
import { ShopFilters } from "@/components/shop/shop-filters";
import { ShopToolbar } from "@/components/shop/shop-toolbar";
import { ProductCard } from "@/components/products/product-card";
import { ShopPagination } from "@/components/shop/pagination";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
  description: "Explore our complete collection of luxury Middle Eastern fragrances.",
};

interface ShopPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    gender?: string;
    fragranceFamily?: string;
    volume?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
    featured?: string;
    bestSeller?: string;
    newArrival?: string;
    comboOffer?: string;
  }>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const filters = {
    search: params.search,
    category: params.category,
    gender: params.gender,
    fragranceFamily: params.fragranceFamily,
    volume: params.volume,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
    sort: params.sort || "newest",
    page: params.page ? parseInt(params.page) : 1,
    limit: 12,
    featured: params.featured === "true" || undefined,
    bestSeller: params.bestSeller === "true" || undefined,
    newArrival: params.newArrival === "true" || undefined,
    comboOffer: params.comboOffer === "true" || undefined,
  };

  const [{ products, meta }, categories] = await Promise.all([
    getProducts(filters).catch(() => ({ products: [], meta: { page: 1, limit: 12, total: 0, totalPages: 0 } })),
    getCategories().catch(() => []),
  ]);

  return (
    <div className="pt-20 md:pt-24">
      <div className="container-luxury py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <h1 className="font-display text-3xl md:text-5xl tracking-widest text-ivory-50 uppercase">
            Shop
          </h1>
          <p className="font-heading text-lg text-obsidian-300 mt-2">
            {meta.total} fragrances in our collection
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <Suspense fallback={<div className="h-96 animate-pulse bg-obsidian-800 rounded-lg" />}>
              <ShopFilters categories={categories} currentFilters={params} />
            </Suspense>
          </aside>

          <div className="flex-1">
            <ShopToolbar
              total={meta.total}
              currentSort={filters.sort}
              currentPage={meta.page}
              totalPages={meta.totalPages}
            />

            {products.length === 0 ? (
              <div className="text-center py-20">
                <p className="font-heading text-xl text-obsidian-400">No fragrances found</p>
                <p className="text-sm text-obsidian-500 mt-2">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            )}

            {meta.totalPages > 1 && (
              <ShopPagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                searchParams={params}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
