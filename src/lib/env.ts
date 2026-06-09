import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().min(1),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  TAX_RATE: z.string().default("0.08"),
  FREE_SHIPPING_THRESHOLD: z.string().default("150"),
  SHIPPING_FLAT_RATE: z.string().default("9.99"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Safe runtime env getter (prevents build-time crashes)
 */
export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ ENV ERROR:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/**
 * App config (safe for import in all Next.js files)
 * Uses process.env directly to avoid build-time validation crashes
 */
const e = process.env;

export const appConfig = {
  name: "Miraaq",
  tagline: "Modern Luxury Fragrance House",
  description:
    "Discover Miraaq — a modern luxury fragrance house inspired by timeless elegance, crafted with premium oud, amber, and oriental accords.",

  url: e.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  taxRate: parseFloat(e.TAX_RATE || "0.08"),
  freeShippingThreshold: parseFloat(e.FREE_SHIPPING_THRESHOLD || "150"),
  shippingFlatRate: parseFloat(e.SHIPPING_FLAT_RATE || "9.99"),

  currency: "PKR",
  currencySymbol: "Rs",

  supportEmail: "support@miraaq.com",
  whatsappNumber: "+971501234567",

  social: {
    instagram: "https://instagram.com/miraaq",
    facebook: "https://facebook.com/miraaq",
    twitter: "https://twitter.com/miraaq",
    youtube: "https://youtube.com/miraaq",
  },
};