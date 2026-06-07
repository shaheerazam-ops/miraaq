import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  return (
    <div className="pt-20 min-h-[70vh] flex items-center justify-center container-luxury">
      <div className="text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="font-display text-3xl tracking-widest text-ivory-50 uppercase mb-4">
          Order Confirmed
        </h1>
        <p className="text-obsidian-300 mb-8 leading-relaxed">
          Thank you for your purchase. A confirmation email will be sent shortly.
          Our concierge team will prepare your order with the utmost care.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="luxury" asChild>
            <Link href="/dashboard/orders">View Orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
