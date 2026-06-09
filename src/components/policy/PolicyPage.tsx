import React from "react";

type PolicyProps = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export default function PolicyPage({
  title,
  lastUpdated,
  children,
}: PolicyProps) {
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