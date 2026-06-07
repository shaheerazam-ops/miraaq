import { HeroSection } from "@/components/home/hero-section";
import { ProductSection } from "@/components/home/product-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { TestimonialsSection } from "@/components/home/testimonials-section";
import { InstagramGallery } from "@/components/home/instagram-gallery";
import {
  TrustIndicators,
  BrandStorySection,
  VideoSection,
} from "@/components/home/brand-sections";
import { NewsletterForm } from "@/components/forms/newsletter-form";
import {
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getComboOffers,
  getCategories,
} from "@/services/product.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, bestSellers, newArrivals, comboOffers, categories] = await Promise.all([
    getFeaturedProducts(4).catch(() => ({ products: [], meta: { page: 1, limit: 4, total: 0, totalPages: 0 } })),
    getBestSellers(4).catch(() => ({ products: [], meta: { page: 1, limit: 4, total: 0, totalPages: 0 } })),
    getNewArrivals(4).catch(() => ({ products: [], meta: { page: 1, limit: 4, total: 0, totalPages: 0 } })),
    getComboOffers(4).catch(() => ({ products: [], meta: { page: 1, limit: 4, total: 0, totalPages: 0 } })),
    getCategories().catch(() => []),
  ]);

  return (
    <>
      <HeroSection />
      <TrustIndicators />
      <ProductSection
        title="Featured Collection"
        subtitle="Handpicked masterpieces from our atelier"
        products={featured.products}
        viewAllHref="/shop?featured=true"
        id="featured"
      />
      <CategoriesSection categories={categories} />
      <ProductSection
        title="Best Sellers"
        subtitle="Beloved by our discerning clientele"
        products={bestSellers.products}
        viewAllHref="/shop?bestSeller=true"
      />
      <BrandStorySection />
      <ProductSection
        title="New Arrivals"
        subtitle="The latest creations from our perfumers"
        products={newArrivals.products}
        viewAllHref="/shop?newArrival=true"
      />
      <VideoSection />
      {comboOffers.products.length > 0 && (
        <ProductSection
          title="Gift Sets & Combos"
          subtitle="Perfect for gifting or discovering new favorites"
          products={comboOffers.products}
          viewAllHref="/shop?comboOffer=true"
        />
      )}
      <TestimonialsSection />
      <InstagramGallery />
      <section className="section-padding bg-obsidian-900/50">
        <div className="container-luxury text-center max-w-xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl tracking-widest text-ivory-50 uppercase mb-3">
            Join the Miraaq Circle
          </h2>
          <p className="text-obsidian-300 mb-6">
            Be the first to discover new releases and exclusive offers.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
