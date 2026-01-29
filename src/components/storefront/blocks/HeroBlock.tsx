import Link from "next/link";
import type { HeroBlock as HeroBlockType } from "@/types/cms";

interface HeroBlockProps {
  block: HeroBlockType;
}

export function HeroBlock({ block }: HeroBlockProps) {
  const { title, subtitle, imageUrl, ctaText, ctaLink } = block.data;

  const backgroundStyle: React.CSSProperties = imageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.55)), url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      };

  return (
    <section
      className="relative w-full min-h-[420px] flex items-center justify-center px-6 py-20 rounded-3xl overflow-hidden"
      style={backgroundStyle}
    >
      <div className="max-w-3xl mx-auto text-center">
        {title && (
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-white mb-4 leading-tight bg-gradient-to-r from-white to-white/80 bg-clip-text">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            {subtitle}
          </p>
        )}
        {ctaText && ctaLink && (
          <Link
            href={ctaLink}
            className="inline-block px-8 py-3 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}
