import Link from "next/link";
import type { HeroBlock as HeroBlockType } from "@/types/cms";

interface HeroBlockProps {
  block: HeroBlockType;
}

export function HeroBlock({ block }: HeroBlockProps) {
  const { title, subtitle, imageUrl, ctaText, ctaLink } = block.data;

  const backgroundStyle: React.CSSProperties = imageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : {
        background:
          "linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-charcoal) 100%)",
      };

  return (
    <section
      className="relative w-full min-h-[420px] flex items-center justify-center px-6 py-20"
      style={backgroundStyle}
    >
      <div className="max-w-3xl mx-auto text-center">
        {title && (
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
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
            className="inline-block px-8 py-3 rounded-lg bg-[var(--color-primary-500)] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  );
}
