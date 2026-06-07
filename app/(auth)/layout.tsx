import Link from "next/link";
import { Sparkles } from "lucide-react";
import { appConfig } from "@/lib/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-obsidian-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gold-500/5 blur-3xl" />
        <div className="grain-overlay absolute inset-0 opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 transition-opacity hover:opacity-80">
            <Sparkles className="h-6 w-6 text-gold-500" />
            <span className="font-display text-xl tracking-[0.25em] text-gold-400">
              {appConfig.name.toUpperCase()}
            </span>
          </Link>
          <p className="mt-2 font-body text-sm text-obsidian-400">{appConfig.tagline}</p>
        </div>

        <div className="rounded-lg border border-obsidian-700/50 bg-obsidian-900/60 p-8 shadow-card backdrop-blur-sm">
          {children}
        </div>

        <p className="mt-6 text-center font-body text-xs text-obsidian-500">
          &copy; {new Date().getFullYear()} {appConfig.name}. All rights reserved.
        </p>
      </div>
    </div>
  );
}
