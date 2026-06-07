import type { Metadata } from "next";
import { appConfig } from "@/lib/env";

export const metadata: Metadata = {
  title: "Our Story",
  description: "Discover the heritage and craftsmanship behind Miraaq luxury fragrances.",
};

const timeline = [
  { year: "1724", event: "The Al-Rashid family begins distilling oud in the Arabian Peninsula" },
  { year: "1892", event: "First international export to Ottoman courts and European nobility" },
  { year: "1967", event: "Master perfumer Khalid Al-Rashid develops the signature amber-oud blend" },
  { year: "2018", event: "Miraaq brand launched globally with flagship atelier in Dubai" },
  { year: "2024", event: "Fragrance Foundation Award for Royal Cambodian Oud" },
];

const team = [
  { name: "Khalid Al-Rashid", role: "Master Perfumer", desc: "Fourth-generation oud specialist with 40 years of experience" },
  { name: "Amira Hassan", role: "Creative Director", desc: "Former LVMH creative lead, shaping the Miraaq aesthetic" },
  { name: "James Whitfield", role: "Head of Operations", desc: "Luxury retail veteran ensuring world-class client experience" },
];

const values = [
  { title: "Authenticity", desc: "Every ingredient traceable to its source. No compromises." },
  { title: "Craftsmanship", desc: "Hand-blended in small batches by master perfumers." },
  { title: "Heritage", desc: "Three centuries of knowledge passed through generations." },
  { title: "Sustainability", desc: "Ethically sourced oud supporting local communities." },
];

export default function AboutPage() {
  return (
    <div className="pt-20 md:pt-24">
      <section className="container-luxury py-16 md:py-24 text-center">
        <span className="text-xs tracking-[0.4em] uppercase text-gold-400">Est. 1724</span>
        <h1 className="font-display text-4xl md:text-6xl tracking-widest text-ivory-50 uppercase mt-4 mb-6">
          Our Story
        </h1>
        <p className="font-heading text-xl text-obsidian-300 max-w-2xl mx-auto leading-relaxed">
          {appConfig.description}
        </p>
      </section>

      <section className="section-padding bg-obsidian-900/30">
        <div className="container-luxury max-w-3xl">
          <h2 className="font-display text-2xl tracking-widest text-ivory-50 uppercase mb-12 text-center">Timeline</h2>
          <div className="space-y-8">
            {timeline.map((item) => (
              <div key={item.year} className="flex gap-6 items-start">
                <span className="font-display text-gold-400 text-lg w-16 flex-shrink-0">{item.year}</span>
                <div className="flex-1 border-l border-gold-500/30 pl-6 pb-8">
                  <p className="text-ivory-200">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="team" className="section-padding">
        <div className="container-luxury">
          <h2 className="font-display text-2xl tracking-widest text-ivory-50 uppercase mb-12 text-center">Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member) => (
              <div key={member.name} className="luxury-card p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-500/20 to-emerald-800/20 mx-auto mb-4 flex items-center justify-center">
                  <span className="font-display text-2xl text-gold-400">{member.name[0]}</span>
                </div>
                <h3 className="font-heading text-xl text-ivory-100">{member.name}</h3>
                <p className="text-sm text-gold-400 mt-1">{member.role}</p>
                <p className="text-sm text-obsidian-400 mt-3">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-obsidian-900/30">
        <div className="container-luxury">
          <h2 className="font-display text-2xl tracking-widest text-ivory-50 uppercase mb-12 text-center">Brand Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => (
              <div key={v.title} className="text-center p-6">
                <h3 className="font-heading text-lg text-gold-400 mb-2">{v.title}</h3>
                <p className="text-sm text-obsidian-300">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
