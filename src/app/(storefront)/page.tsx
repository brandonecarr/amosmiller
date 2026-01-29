import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Truck,
  Leaf,
  ShieldCheck,
  Heart,
  CheckCircle2,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui";

const featuredProducts = [
  {
    id: 1,
    name: "Grass-Fed Ground Beef",
    price: 8.99,
    unit: "lb",
    image: "/images/products/ground-beef.jpg",
    category: "Beef",
  },
  {
    id: 2,
    name: "Free-Range Whole Chicken",
    price: 5.49,
    unit: "lb",
    image: "/images/products/whole-chicken.jpg",
    category: "Chicken",
  },
  {
    id: 3,
    name: "Farm Fresh Eggs",
    price: 6.99,
    unit: "dozen",
    image: "/images/products/eggs.jpg",
    category: "Dairy",
  },
  {
    id: 4,
    name: "Raw Milk",
    price: 9.99,
    unit: "gallon",
    image: "/images/products/milk.jpg",
    category: "Dairy",
  },
];

const categories = [
  { name: "Beef", href: "/shop/meat/beef", count: 24, emoji: "🥩" },
  { name: "Pork", href: "/shop/meat/pork", count: 18, emoji: "🥓" },
  { name: "Chicken", href: "/shop/meat/chicken", count: 12, emoji: "🍗" },
  { name: "Dairy", href: "/shop/dairy", count: 15, emoji: "🥛" },
  { name: "Produce", href: "/shop/produce", count: 32, emoji: "🥬" },
  { name: "Pantry", href: "/shop/pantry", count: 28, emoji: "🫙" },
];

const features = [
  {
    icon: Truck,
    title: "Local Delivery",
    description: "Fresh products delivered right to your door",
  },
  {
    icon: Leaf,
    title: "Sustainably Raised",
    description: "Pasture-raised animals, organic practices",
  },
  {
    icon: ShieldCheck,
    title: "Quality Guaranteed",
    description: "100% satisfaction or your money back",
  },
  {
    icon: Heart,
    title: "Family Farm",
    description: "Three generations of farming excellence",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Column */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full mb-6">
                <Leaf className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-medium text-orange-700">
                  Fresh Harvest Daily
                </span>
              </div>

              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-[1.1] mb-6 font-heading">
                Farm Fresh,{" "}
                <span className="gradient-text">Delivered to You</span>
              </h1>

              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Experience the difference of truly fresh, sustainably raised
                meats and dairy products. From our family farm to your table.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/shop">
                  <Button size="lg">
                    Shop Now
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="secondary" size="lg">
                    Learn Our Story
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-8 pt-6 border-t border-slate-200">
                <div>
                  <p className="text-2xl font-bold text-slate-900 font-heading">
                    2,500+
                  </p>
                  <p className="text-sm text-slate-500">Orders Delivered</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div>
                  <p className="text-2xl font-bold text-slate-900 font-heading">
                    1,200+
                  </p>
                  <p className="text-sm text-slate-500">Happy Customers</p>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
                  <p className="text-2xl font-bold text-slate-900 font-heading">
                    4.9
                  </p>
                  <p className="text-sm text-slate-500">Rating</p>
                </div>
              </div>
            </div>

            {/* Right Column — Hero Image */}
            <div className="relative">
              <div className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1610832958506-aa56368176cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
                  alt="Fresh farm produce"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Floating Verification Card */}
              <div className="absolute -bottom-4 -left-4 lg:-left-8 bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-4 max-w-[220px]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Verified Farm
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      USDA certified organic practices
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 font-heading">
                Shop by Category
              </h2>
              <p className="text-slate-500">
                Browse our selection of farm-fresh products
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden lg:flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-orange-500 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group relative bg-white rounded-2xl border border-slate-200 p-6 text-center hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all"
              >
                <div className="text-3xl mb-3">{category.emoji}</div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1 font-heading">
                  {category.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {category.count} products
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2 font-heading">
                Featured Products
              </h2>
              <p className="text-slate-500">
                Our most popular farm-fresh items
              </p>
            </div>
            <Link
              href="/shop"
              className="hidden lg:flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-orange-500 transition-colors"
            >
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-slate-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all"
              >
                <div className="aspect-[4/3] bg-slate-50 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                    <span className="text-sm">Product Image</span>
                  </div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-medium rounded-full">
                    {product.category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-slate-900 text-sm mb-1.5 group-hover:text-orange-500 transition-colors font-heading">
                    {product.name}
                  </h3>
                  <p className="text-slate-900 font-semibold">
                    ${product.price.toFixed(2)}
                    <span className="text-slate-400 font-normal text-sm">
                      /{product.unit}
                    </span>
                  </p>
                </div>
                <div className="px-4 pb-4 pt-0">
                  <Button variant="secondary" className="w-full" size="sm">
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 font-heading">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="bg-slate-900 rounded-3xl px-8 py-12 lg:px-16 lg:py-16 text-center">
            <h2 className="text-2xl lg:text-4xl font-bold text-white mb-4 font-heading">
              Ready to Taste the Difference?
            </h2>
            <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
              Join thousands of families who trust Amos Miller Farm for their
              weekly groceries. Fresh, sustainable, and delicious.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/shop">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-slate-100 shadow-none"
                >
                  Start Shopping
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/delivery">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-slate-300 hover:text-white hover:bg-white/10"
                >
                  Check Delivery Areas
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 font-heading">
              Stay Updated
            </h2>
            <p className="text-slate-500 mb-6">
              Subscribe to our newsletter for farm updates, new products, and
              exclusive offers.
            </p>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-2.5 border border-slate-200 rounded-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-slate-300 transition-colors"
              />
              <Button type="submit">Subscribe</Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
