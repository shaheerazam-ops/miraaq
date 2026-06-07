import Link from "next/link";
import { Instagram, Facebook, Twitter, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { appConfig } from "@/lib/env";
import { NewsletterForm } from "@/components/forms/newsletter-form";

const footerLinks = {
  shop: [
    { href: "/shop", label: "All Fragrances" },
    { href: "/shop?category=oud-collection", label: "Oud Collection" },
    { href: "/shop?bestSeller=true", label: "Best Sellers" },
    { href: "/shop?newArrival=true", label: "New Arrivals" },
    { href: "/shop?comboOffer=true", label: "Gift Sets" },
  ],
  company: [
    { href: "/about", label: "Our Story" },
    { href: "/contact", label: "Contact Us" },
    { href: "/faq", label: "FAQ" },
    { href: "/about#team", label: "Our Team" },
  ],
  support: [
    { href: "/shipping-policy", label: "Shipping Policy" },
    { href: "/return-policy", label: "Returns & Exchanges" },
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-of-service", label: "Terms of Service" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-obsidian-950 border-t border-obsidian-800/50 mt-auto">
      <div className="container-luxury py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="font-display text-2xl tracking-[0.2em] text-gold-400">MIRAAQ</span>
              <span className="font-arabic text-lg text-emerald-500 ml-1">عود</span>
            </Link>
            <p className="text-obsidian-300 text-sm leading-relaxed mb-6 max-w-sm">
              {appConfig.description}
            </p>
            <div className="flex gap-4">
              {[
                { icon: Instagram, href: appConfig.social.instagram, label: "Instagram" },
                { icon: Facebook, href: appConfig.social.facebook, label: "Facebook" },
                { icon: Twitter, href: appConfig.social.twitter, label: "Twitter" },
                { icon: Youtube, href: appConfig.social.youtube, label: "YouTube" },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-obsidian-700 flex items-center justify-center text-obsidian-400 hover:text-gold-400 hover:border-gold-500/50 transition-all"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-heading text-gold-400 text-sm tracking-widest uppercase mb-4">
                {title}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-obsidian-300 hover:text-ivory-100 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-obsidian-800/50">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-heading text-lg text-gold-400 mb-2">Join the Miraaq Circle</h3>
              <p className="text-sm text-obsidian-300 mb-4">
                Exclusive offers, new releases, and fragrance insights.
              </p>
              <NewsletterForm />
            </div>
            <div className="space-y-3 text-sm text-obsidian-300">
              <a
                href={`mailto:${appConfig.supportEmail}`}
                className="flex items-center gap-2 hover:text-gold-400 transition-colors"
              >
                <Mail className="h-4 w-4 text-gold-500" />
                {appConfig.supportEmail}
              </a>
              <a
                href={`https://wa.me/${appConfig.whatsappNumber.replace("+", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-gold-400 transition-colors"
              >
                <Phone className="h-4 w-4 text-gold-500" />
                WhatsApp Concierge
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold-500" />
                Karachi · arfat bakery · johar town
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-obsidian-800/30 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-obsidian-500">
          <p>© {new Date().getFullYear()} {appConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Apple Pay</span>
            <span>Google Pay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
