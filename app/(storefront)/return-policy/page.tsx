import type { Metadata } from "next";
import PolicyPage from "@/components/policy/PolicyPage";

export const metadata: Metadata = { title: "Return Policy" };

export default function ReturnPolicyPage() {
  return (
    <PolicyPage title="Return & Exchange Policy" lastUpdated="June 1, 2026">
      <section>
        <h2>30-Day Returns</h2>
        <p>Unopened products in original packaging may be returned within 30 days for a full refund. Opened fragrances may be exchanged within 14 days if unsatisfied.</p>
      </section>
      <section>
        <h2>How to Return</h2>
        <p>Contact concierge@miraaq.com with your order number. We will provide a prepaid return label for domestic orders. Refunds are processed within 5-7 business days of receiving the return.</p>
      </section>
      <section>
        <h2>Non-Returnable Items</h2>
        <p>Gift cards, personalized items, and products marked as final sale cannot be returned.</p>
      </section>
    </PolicyPage>
  );
}
