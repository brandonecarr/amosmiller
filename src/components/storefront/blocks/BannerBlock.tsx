import Link from "next/link";
import type { BannerBlock as BannerBlockType } from "@/types/cms";

interface BannerBlockProps {
  block: BannerBlockType;
}

export function BannerBlock({ block }: BannerBlockProps) {
  const { text, backgroundColor, textColor, linkUrl, linkText } = block.data;

  if (!text) return null;

  const bannerStyle: React.CSSProperties = {
    backgroundColor: backgroundColor || "var(--color-primary-500)",
    color: textColor || "#ffffff",
  };

  const content = (
    <div
      className="w-full py-4 px-6 text-center font-medium"
      style={bannerStyle}
    >
      <span>{text}</span>
      {linkUrl && linkText && (
        <>
          {" "}
          <span className="underline underline-offset-2 font-semibold">
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
