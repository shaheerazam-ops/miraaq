import type { Metadata } from "next";

function PolicyPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-20 md:pt-24">
      <div className="container-luxury py-12 max-w-3xl prose prose-invert">
        <h1 className="font-display text-4xl tracking-widest text-ivory-50 uppercase mb-2">
          {title}
        </h1>
        <p className="text-sm text-obsidian-500 mb-12">
          Last updated: {lastUpdated}
        </p>

        <div className="space-y-8 text-obsidian-300 [&_h2]:font-heading [&_h2]:text-gold-400 [&_h2]:text-xl [&_h2]:mb-3 [&_p]:leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage title="Privacy Policy" lastUpdated="June 1, 2026">
      <section>
        <h2>Information We Collect</h2>
        <p>
          We collect information you provide directly, including name, email,
          shipping address, and payment details when you create an account or
          place an order. We also collect usage data through cookies and
          analytics.
        </p>
      </section>

      <section>
        <h2>How We Use Your Information</h2>
        <p>
          Your information is used to process orders, provide customer support,
          send marketing communications (with consent), and improve our
          services. We never sell your personal data to third parties.
        </p>
      </section>

      <section>
        <h2>Data Security</h2>
        <p>
          We implement industry-standard security measures including SSL
          encryption, secure payment processing, and regular security audits.
          Passwords are hashed using bcrypt.
        </p>
      </section>

      <section>
        <h2>Your Rights</h2>
        <p>
          You may request access, correction, or deletion of your personal data
          at any time by contacting concierge@miraaq.com.
        </p>
      </section>
    </PolicyPage>
  );
}