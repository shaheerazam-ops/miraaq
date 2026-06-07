import type { Metadata } from "next";
import { PolicyPage } from "../privacy-policy/page";

export const metadata: Metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return (
    <PolicyPage title="Shipping Policy" lastUpdated="June 1, 2026">
      <section>
        <h2>Domestic Shipping</h2>
        <p>Standard shipping (5-7 business days): $9.99. Express shipping (2-3 business days): $19.99. Free standard shipping on orders over $150.</p>
      </section>
      <section>
        <h2>International Shipping</h2>
        <p>We ship to over 50 countries. International delivery takes 10-14 business days. Customs duties and taxes are the responsibility of the recipient.</p>
      </section>
      <section>
        <h2>Order Processing</h2>
        <p>Orders are processed within 1-2 business days. You will receive a tracking number via email once shipped. Signature may be required for orders over $300.</p>
      </section>
    </PolicyPage>
  );
}
