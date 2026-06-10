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

  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),

  TAX_RATE: z.string().optional(),
  FREE_SHIPPING_THRESHOLD: z.string().optional(),
  SHIPPING_FLAT_RATE: z.string().optional(),

  // Payment gateways (optional so build never crashes)
  PAYMENT_PRIMARY_GATEWAY: z.string().optional(),
  PAYMENT_WALLET_ENABLED: z.string().optional(),

  PAYFAST_MODE: z.string().optional(),
  PAYFAST_MERCHANT_ID: z.string().optional(),
  PAYFAST_MERCHANT_KEY: z.string().optional(),
  PAYFAST_PASSPHRASE: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

/**
 * Strict runtime validation (ONLY use in server logic)
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
 * SAFE APP CONFIG (frontend-safe, never breaks build)
 */
const e = process.env;

export const appConfig = {
  name: "Miraaq",
  tagline: "Modern Luxury Fragrance House",
  description:
    "Discover Miraaq — a modern luxury fragrance house inspired by timeless elegance.",

  url: e.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  taxRate: Number(e.TAX_RATE ?? 0.08),
  freeShippingThreshold: Number(e.FREE_SHIPPING_THRESHOLD ?? 150),
  shippingFlatRate: Number(e.SHIPPING_FLAT_RATE ?? 9.99),

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

/**
 * Backwards compatibility (THIS FIXES YOUR ERROR)
 * If any file imports `appConfig` from env → it still works
 */
export { appConfig as default };