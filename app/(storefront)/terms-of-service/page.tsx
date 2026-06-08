import type { Metadata } from "next";
import { PolicyPage } from "../privacy-policy/page";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <PolicyPage title="Terms of Service" lastUpdated="June 1, 2026">
      <section>
        <h2>Acceptance of Terms</h2>
        <p>By accessing miraaq.com, you agree to these Terms of Service. If you disagree, please do not use our services.</p>
      </section>
      <section>
        <h2>Products & Pricing</h2>
        <p>All prices are in PKR and subject to change without notice. We reserve the right to limit quantities and refuse service. Product images are representative; actual packaging may vary slightly.</p>
      </section>
      <section>
        <h2>Orders & Payment</h2>
        <p>Orders are confirmed upon successful payment processing. We accept Visa, Mastercard, jazzcash, and easypaisa through secure payment partners. You are responsible for providing accurate shipping information.</p>
      </section>
      <section>
        <h2>Intellectual Property</h2>
        <p>All content, trademarks, and product designs are property of Miraaq. Unauthorized reproduction is prohibited.</p>
      </section>
    </PolicyPage>
  );
}
