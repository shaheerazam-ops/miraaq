"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appConfig } from "@/lib/env";
import { toast } from "sonner";

const locations = [
  { city: "Dubai", address: "The Dubai Mall, Fashion Avenue, Level 2", phone: "+971 4 123 4567" },
  { city: "Riyadh", address: "Kingdom Centre, Al Urubah Road", phone: "+966 11 123 4567" },
  { city: "London", address: "Harrods, Knightsbridge, SW1X 7XL", phone: "+44 20 1234 5678" },
];

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Message sent! Our concierge will respond within 24 hours.");
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 md:pt-24">
      <div className="container-luxury py-12 md:py-16">
        <h1 className="font-display text-4xl tracking-widest text-ivory-50 uppercase mb-4">Contact</h1>
        <p className="text-obsidian-300 mb-12">Our concierge team is here to assist you.</p>

        <div className="grid lg:grid-cols-2 gap-12">
          <form onSubmit={handleSubmit} className="luxury-card p-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                required
                minLength={10}
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="flex w-full rounded-md border border-obsidian-700 bg-obsidian-900 px-3 py-2 text-sm text-ivory-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50"
              />
            </div>
            <Button type="submit" variant="luxury" disabled={loading}>Send Message</Button>
          </form>

          <div className="space-y-8">
            <div className="space-y-4">
              <a href={`mailto:${appConfig.supportEmail}`} className="flex items-center gap-3 text-obsidian-300 hover:text-gold-400 transition-colors">
                <Mail className="h-5 w-5 text-gold-500" />
                {appConfig.supportEmail}
              </a>
              <a
                href={`https://wa.me/${appConfig.whatsappNumber.replace("+", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-obsidian-300 hover:text-gold-400 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-gold-500" />
                WhatsApp Concierge
              </a>
            </div>

            <div>
              <h2 className="font-heading text-xl text-gold-400 mb-6">Boutique Locations</h2>
              <div className="space-y-4">
                {locations.map((loc) => (
                  <div key={loc.city} className="luxury-card p-5">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gold-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-ivory-100">{loc.city}</h3>
                        <p className="text-sm text-obsidian-400 mt-1">{loc.address}</p>
                        <a href={`tel:${loc.phone}`} className="flex items-center gap-1 text-sm text-gold-400 mt-2">
                          <Phone className="h-3 w-3" /> {loc.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="luxury-card p-5 h-48 flex items-center justify-center bg-obsidian-800/50">
              <p className="text-obsidian-500 text-sm">Google Maps integration — configure with your API key</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
