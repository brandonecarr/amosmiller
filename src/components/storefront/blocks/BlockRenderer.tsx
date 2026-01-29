import type { ContentBlock } from "@/types/cms";
import { HeroBlock } from "./HeroBlock";
import { RichTextBlock } from "./RichTextBlock";
import { ImageBlock } from "./ImageBlock";
import { ProductsBlock } from "./ProductsBlock";
import { FaqBlock } from "./FaqBlock";
import { TestimonialsBlock } from "./TestimonialsBlock";
import { HtmlBlock } from "./HtmlBlock";
import { BannerBlock } from "./BannerBlock";

interface BlockRendererProps {
  block: ContentBlock;
}

export function BlockRenderer({ block }: BlockRendererProps) {
  const renderBlock = () => {
    switch (block.type) {
      case "hero":
        return <HeroBlock block={block} />;
      case "richtext":
        return <RichTextBlock block={block} />;
      case "image":
        return <ImageBlock block={block} />;
      case "products":
        return <ProductsBlock block={block} />;
      case "faq":
        return <FaqBlock block={block} />;
      case "testimonials":
        return <TestimonialsBlock block={block} />;
      case "html":
        return <HtmlBlock block={block} />;
      case "banner":
        return <BannerBlock block={block} />;
      default:
        return null;
    }
  };

  return (
    <section className={block.type === "hero" || block.type === "banner" ? "py-0" : "py-8 md:py-12"}>
      {renderBlock()}
    </section>
  );
}
