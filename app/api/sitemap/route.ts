import { db } from "@/lib/db";
import { appConfig } from "@/lib/env";

export async function GET() {
  try {
    const [products, categories] = await Promise.all([
      db.product.findMany({
        where: { active: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      db.category.findMany({
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const staticPages = [
      { path: "", priority: "1.0", changefreq: "daily" },
      { path: "/shop", priority: "0.9", changefreq: "daily" },
      { path: "/about", priority: "0.7", changefreq: "monthly" },
      { path: "/contact", priority: "0.6", changefreq: "monthly" },
      { path: "/faq", priority: "0.5", changefreq: "monthly" },
    ];

    const urls = [
      ...staticPages.map((page) => ({
        loc: `${appConfig.url}${page.path}`,
        lastmod: new Date().toISOString().split("T")[0],
        changefreq: page.changefreq,
        priority: page.priority,
      })),
      ...categories.map((cat) => ({
        loc: `${appConfig.url}/shop?category=${cat.slug}`,
        lastmod: cat.updatedAt.toISOString().split("T")[0],
        changefreq: "weekly",
        priority: "0.8",
      })),
      ...products.map((product) => ({
        loc: `${appConfig.url}/products/${product.slug}`,
        lastmod: product.updatedAt.toISOString().split("T")[0],
        changefreq: "weekly",
        priority: "0.8",
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
