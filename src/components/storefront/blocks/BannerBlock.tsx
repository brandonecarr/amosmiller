import Link from "next/link";
import type { BannerBlock as BannerBlockType } from "@/types/cms";

interface BannerBlockProps {
  block: BannerBlockType;
}

export function BannerBlock({ block }: BannerBlockProps) {
  const { text, backgroundColor, textColor, linkUrl, linkText } = block.data;

  if (!text) return null;

  const bannerStyle: React.CSSProperties = {
    backgroundColor: backgroundColor || "#0f172a",
    color: textColor || "#ffffff",
  };

  const content = (
    <div
      className="w-full py-4 px-6 text-center font-medium rounded-2xl"
      style={bannerStyle}
    >
      <span>{text}</span>
      {linkUrl && linkText && (
        <>
          {" "}
          <span className="inline-block ml-2 px-4 py-1 rounded-full bg-white/20 text-sm font-semibold hover:bg-white/30 transition-colors">
            {linkText}
          </span>
        </>
      )}
    </div>
  );

  if (linkUrl) {
    return (
      <Link href={linkUrl} className="block hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
