import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronRight, Truck, Shield, Leaf } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatCurrency, formatWeightPrice } from "@/lib/utils";
import { ProductCard } from "@/components/storefront/ProductCard";
import { AddToCartSection } from "./AddToCartSection";
import { getProductBySlug, getRelatedProducts } from "@/lib/actions/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = (await getProductBySlug(slug)) as any;
  if (result.error || !result.data) return {};
  const product = result.data;
  return {
    title: product.name,
    description:
      product.description?.slice(0, 160) ||
      `Buy ${product.name} from Amos Miller Farm`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160) || undefined,
      images: product.featured_image_url
        ? [product.featured_image_url]
        : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await getProductBySlug(slug) as any;

  if (result.error || !result.data) {
    return notFound();
  }

  const product = result.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let relatedProducts: any[] = [];
  if (product.category_id) {
    const relatedResult = await getRelatedProducts(product.category_id, product.id, 4);
    if (relatedResult.data) {
      relatedProducts = relatedResult.data;
    }
  }

  const isOnSale = product.sale_price && product.sale_price < product.base_price;
  const displayPrice = isOnSale ? product.sale_price! : product.base_price;
  const categoryName = product.categories?.name || "Products";
  const categorySlug = product.categories?.slug || "";

  const images = product.images?.length > 0
    ? product.images.map((img: string | { url: string; alt?: string }, index: number) => ({
        url: typeof img === "string" ? img : img.url,
        alt: typeof img === "string" ? `${product.name} image ${index + 1}` : img.alt || product.name,
      }))
    : product.featured_image_url
      ? [{ url: product.featured_image_url, alt: product.name }]
      : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-8">
        <Link href="/" className="text-slate-500 hover:text-orange-500 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <Link href="/shop" className="text-slate-500 hover:text-orange-500 transition-colors">
          Shop
        </Link>
        {categorySlug && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <Link
              href={`/shop?category=${categorySlug}`}
              className="text-slate-500 hover:text-orange-500 transition-colors"
            >
              {categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-900 font-medium">{product.name}</span>
      </nav>

      {/* Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
        {/* Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-slate-50 rounded-3xl overflow-hidden relative">
            {images[0]?.url ? (
              <Image
                src={images[0].url}
                alt={images[0].alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                Product Image
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {isOnSale && <Badge variant="error">Sale</Badge>}
              {product.is_featured && <Badge variant="accent">Featured</Badge>}
            </div>
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((image: { url: string; alt: string }, index: number) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden border-2 border-slate-200 hover:border-orange-500 transition-colors"
                >
                  {image.url ? (
                    <Image
                      src={image.url}
                      alt={image.alt}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                      {index + 1}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              {categorySlug && (
                <>
                  <Link
                    href={`/shop?category=${categorySlug}`}
                    className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    {categoryName}
                  </Link>
                  <span className="text-slate-300">·</span>
                </>
              )}
              {product.sku && (
                <span className="text-sm text-slate-400">SKU: {product.sku}</span>
              )}
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4 font-heading">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-4">
              {product.pricing_type === "weight" ? (
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatWeightPrice(displayPrice, product.weight_unit || "lb")}
                  </p>
                  {product.min_weight && product.max_weight && product.estimated_weight && (
                    <p className="text-slate-500 text-sm">
                      Estimated: {formatCurrency(displayPrice * product.estimated_weight)} (
                      ~{product.estimated_weight} {product.weight_unit || "lb"})
                    </p>
                  )}
                  {isOnSale && (
                    <p className="text-slate-400 line-through text-sm">
                      {formatWeightPrice(product.base_price, product.weight_unit || "lb")}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(displayPrice)}
                  </p>
                  {isOnSale && (
                    <p className="text-slate-400 line-through text-sm">
                      {formatCurrency(product.base_price)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {product.short_description && (
              <p className="text-slate-500 leading-relaxed">
                {product.short_description}
              </p>
            )}
          </div>

          {/* Add to Cart */}
          <AddToCartSection product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            pricing_type: product.pricing_type as "fixed" | "weight",
            base_price: product.base_price,
            sale_price: product.sale_price,
            weight_unit: product.weight_unit as "lb" | "oz" | "kg" | "g" || "lb",
            estimated_weight: product.estimated_weight,
            stock_quantity: product.stock_quantity,
            featured_image_url: product.featured_image_url,
            is_subscribable: product.is_subscribable,
            subscription_frequencies: product.subscription_frequencies,
            min_subscription_quantity: product.min_subscription_quantity,
            max_subscription_quantity: product.max_subscription_quantity,
          }} />

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 py-6 border-t border-slate-200">
            <div className="text-center">
              <Truck className="w-5 h-5 text-slate-900 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Local Delivery</p>
            </div>
            <div className="text-center">
              <Shield className="w-5 h-5 text-slate-900 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Quality Guaranteed</p>
            </div>
            <div className="text-center">
              <Leaf className="w-5 h-5 text-slate-900 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Sustainably Raised</p>
            </div>
          </div>

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag: string) => (
                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mb-16">
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-6 font-heading">
            About This Product
          </h2>
          <div className="prose prose-lg max-w-none text-slate-600 prose-headings:text-slate-900 prose-headings:font-heading">
            {product.description.split("\n\n").map((paragraph: string, index: number) => {
              if (paragraph.startsWith("**") && paragraph.endsWith("**")) {
                return (
                  <h3 key={index} className="text-lg font-semibold text-slate-900 mt-6 mb-3 font-heading">
                    {paragraph.replace(/\*\*/g, "")}
                  </h3>
                );
              }
              if (paragraph.startsWith("- ")) {
                const items = paragraph.split("\n");
                return (
                  <ul key={index} className="list-disc pl-6 space-y-1">
                    {items.map((item, i) => (
                      <li key={i}>{item.replace("- ", "")}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={index}>{paragraph}</p>;
            })}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900 mb-6 font-heading">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={{
                  id: relatedProduct.id,
                  name: relatedProduct.name,
                  slug: relatedProduct.slug,
                  category: categoryName,
                  pricing_type: relatedProduct.pricing_type as "fixed" | "weight",
                  base_price: relatedProduct.base_price,
                  sale_price: relatedProduct.sale_price,
                  weight_unit: (relatedProduct.weight_unit as "lb" | "oz" | "kg" | "g") || "lb",
                  estimated_weight: relatedProduct.estimated_weight,
                  min_weight: relatedProduct.min_weight,
                  max_weight: relatedProduct.max_weight,
                  stock_quantity: relatedProduct.stock_quantity,
                  is_featured: relatedProduct.is_featured,
                  featured_image_url: relatedProduct.featured_image_url,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
