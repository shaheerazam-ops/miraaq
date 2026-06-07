import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    stripeInstance = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return stripeInstance;
}

export async function createCheckoutSession({
  orderId,
  orderNumber,
  items,
  customerEmail,
  successUrl,
  cancelUrl,
}: {
  orderId: string;
  orderNumber: string;
  items: { name: string; price: number; quantity: number; image?: string }[];
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    payment_method_options: {
      card: {
        request_three_d_secure: "automatic",
      },
    },
    customer_email: customerEmail,
    line_items: items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    })),
    metadata: {
      orderId,
      orderNumber,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    automatic_tax: { enabled: false },
  });

  return session;
}

export async function constructWebhookEvent(body: string, signature: string) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
