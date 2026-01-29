"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  User,
  ShoppingCart,
  CreditCard,
  Banknote,
  X,
  Plus,
  Minus,
  Trash2,
  Scale,
  RefreshCw,
  Settings,
  LogOut,
  Barcode,
  Wifi,
  WifiOff,
  Printer,
  DollarSign,
  TrendingUp,
  Split,
  Check,
} from "lucide-react";
import Image from "next/image";
import { Button, Input } from "@/components/ui";
import { getProducts } from "@/lib/actions/products";
import { searchCustomers, createPOSOrder, createPOSCustomer, getPOSStats, openCashDrawer, printReceipt } from "@/lib/actions/pos";
import { formatCurrency } from "@/lib/utils";
import { usePOSInventorySync } from "@/hooks/useRealtimeInventory";
import { useStripeTerminal } from "@/hooks/useStripeTerminal";
import { Reader } from "@stripe/terminal-js";

interface Product {
  id: string;
  name: string;
  sku: string | null;
  base_price: number;
  sale_price: number | null;
  pricing_type: "fixed" | "weight";
  weight_unit: string | null;
  estimated_weight: number | null;
  stock_quantity: number;
  featured_image_url: string | null;
  categories?: { name: string } | null;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  pricingType: "fixed" | "weight";
  unitPrice: number;
  quantity: number;
  weight?: number;
  weightUnit?: string;
  subtotal: number;
}

interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
}

interface POSStats {
  transactionCount: number;
  totalSales: number;
  averageOrder: number;
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showWeightEntry, setShowWeightEntry] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<POSStats | null>(null);

  // Stripe Terminal
  const {
    connectedReader,
    connectionStatus,
    isProcessingPayment,
    error: terminalError,
    discoverReaders,
    connectReader,
    disconnectReader,
    collectPayment,
    cancelPayment,
  } = useStripeTerminal({
    onConnectionStatusChange: (status) => {
      console.log("Terminal connection status:", status);
    },
    onPaymentStatusChange: (status) => {
      console.log("Payment status:", status);
    },
  });

  // Load products and stats
  useEffect(() => {
    loadProducts();
    loadStats();
  }, []);

  // Real-time inventory sync
  usePOSInventorySync(products, setProducts);

  const loadStats = async () => {
    const result = await getPOSStats();
    if (result.data) {
      setStats(result.data);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    const result = await getProducts({ is_active: true });
    if (result.data) {
      setProducts(result.data as Product[]);
      setFilteredProducts(result.data as Product[]);
    }
    setLoading(false);
  };

  // Filter products based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.categories?.name.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  // Add product to cart
  const addToCart = useCallback((product: Product) => {
    if (product.pricing_type === "weight") {
      setShowWeightEntry(product.id);
      setWeightInput(product.estimated_weight?.toString() || "1");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      const price = product.sale_price ?? product.base_price;

      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      }

      return [
        ...prev,
        {
          id: `${product.id}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          sku: product.sku,
          pricingType: product.pricing_type,
          unitPrice: price,
          quantity: 1,
          subtotal: price,
        },
      ];
    });
  }, []);

  // Add weight-based item to cart
  const addWeightItemToCart = (product: Product, weight: number) => {
    const price = product.sale_price ?? product.base_price;
    const subtotal = price * weight;

    setCart((prev) => [
      ...prev,
      {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        sku: product.sku,
        pricingType: "weight",
        unitPrice: price,
        quantity: 1,
        weight,
        weightUnit: product.weight_unit || "lb",
        subtotal,
      },
    ]);

    setShowWeightEntry(null);
    setWeightInput("");
  };

  // Update cart item quantity
  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== itemId) return item;
          const newQty = Math.max(0, item.quantity + delta);
          if (newQty === 0) return null;
          return {
            ...item,
            quantity: newQty,
            subtotal: item.pricingType === "weight"
              ? item.unitPrice * (item.weight || 1)
              : item.unitPrice * newQty,
          };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Update weight for weight-based item
  const updateWeight = (itemId: string, newWeight: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        return {
          ...item,
          weight: newWeight,
          subtotal: item.unitPrice * newWeight,
        };
      })
    );
  };

  // Remove item from cart
  const removeItem = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setCustomer(null);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = 0; // Tax calculation would go here
  const total = subtotal + tax;

  // Handle barcode scan (keyboard input)
  useEffect(() => {
    let barcode = "";
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Enter" && barcode.length > 0) {
        // Find product by SKU
        const product = products.find(
          (p) => p.sku?.toLowerCase() === barcode.toLowerCase()
        );
        if (product) {
          addToCart(product);
        }
        barcode = "";
        return;
      }

      // Only accept alphanumeric characters
      if (e.key.length === 1 && /[a-zA-Z0-9-]/.test(e.key)) {
        barcode += e.key;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          barcode = "";
        }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeout);
    };
  }, [products, addToCart]);

  const selectedWeightProduct = showWeightEntry
    ? products.find((p) => p.id === showWeightEntry)
    : null;

  return (
    <div className="h-screen flex">
      {/* Main Area - Product Grid */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-[var(--color-border)] px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[var(--color-primary-500)]" />
            <span className="text-xl font-bold text-[var(--color-charcoal)]">
              Amos Miller POS
            </span>
          </div>

          {/* Daily Stats */}
          {stats && (
            <div className="flex items-center gap-4 px-4 py-1.5 bg-[var(--color-slate-50)] rounded-lg">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[var(--color-primary-500)]" />
                <span className="text-sm font-medium">{formatCurrency(stats.totalSales)}</span>
                <span className="text-xs text-[var(--color-muted)]">today</span>
              </div>
              <div className="w-px h-4 bg-[var(--color-border)]" />
              <div className="text-sm">
                <span className="font-medium">{stats.transactionCount}</span>
                <span className="text-[var(--color-muted)]"> orders</span>
              </div>
            </div>
          )}

          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
            <input
              type="text"
              placeholder="Search products or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-[var(--color-muted)]" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Terminal Connection Status */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${
                connectedReader
                  ? "bg-green-50 text-green-700"
                  : "bg-yellow-50 text-yellow-700"
              }`}
            >
              {connectedReader ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="hidden lg:inline">Reader Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="hidden lg:inline">No Reader</span>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                loadProducts();
                loadStats();
              }}
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await openCashDrawer();
              }}
              title="Open Cash Drawer"
            >
              <DollarSign className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" title="Logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Product Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 animate-spin text-[var(--color-primary-500)]" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted)]">
              <Barcode className="w-16 h-16 mb-4" />
              <p className="text-lg">No products found</p>
              <p className="text-sm">Try a different search or scan a barcode</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredProducts.map((product) => {
                const price = product.sale_price ?? product.base_price;
                const isOutOfStock = product.stock_quantity === 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    className={`bg-white rounded-xl p-3 text-left border transition-all ${
                      isOutOfStock
                        ? "opacity-50 cursor-not-allowed border-[var(--color-border)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-primary-500)] hover:shadow-md active:scale-95"
                    }`}
                  >
                    <div className="aspect-square bg-[var(--color-cream-100)] rounded-lg mb-2 overflow-hidden relative">
                      {product.featured_image_url ? (
                        <Image
                          src={product.featured_image_url}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 20vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)] text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <p className="font-medium text-sm text-[var(--color-charcoal)] line-clamp-2 mb-1">
                      {product.name}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[var(--color-primary-500)]">
                        {formatCurrency(price)}
                        {product.pricing_type === "weight" && `/${product.weight_unit || "lb"}`}
                      </p>
                      {product.pricing_type === "weight" && (
                        <Scale className="w-4 h-4 text-[var(--color-muted)]" />
                      )}
                    </div>
                    {product.sku && (
                      <p className="text-xs text-[var(--color-muted)] mt-1">
                        {product.sku}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-96 bg-white border-l border-[var(--color-border)] flex flex-col">
        {/* Customer Section */}
        <div className="p-4 border-b border-[var(--color-border)]">
          {customer ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center">
                  <User className="w-5 h-5 text-[var(--color-primary-600)]" />
                </div>
                <div>
                  <p className="font-medium text-[var(--color-charcoal)]">
                    {customer.full_name || customer.email}
                  </p>
                  {customer.phone && (
                    <p className="text-xs text-[var(--color-muted)]">{customer.phone}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCustomer(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowCustomerSearch(true)}
            >
              <User className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted)]">
              <ShoppingCart className="w-12 h-12 mb-2" />
              <p>Cart is empty</p>
              <p className="text-sm">Add products to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-[var(--color-slate-50)] rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[var(--color-charcoal)] truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-[var(--color-muted)]">
                        {formatCurrency(item.unitPrice)}
                        {item.pricingType === "weight" && `/${item.weightUnit}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.pricingType === "weight" ? (
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[var(--color-muted)]" />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.weight || 1}
                        onChange={(e) =>
                          updateWeight(item.id, parseFloat(e.target.value) || 0.01)
                        }
                        className="w-20 px-2 py-1 text-sm border border-[var(--color-border)] rounded"
                      />
                      <span className="text-sm text-[var(--color-muted)]">
                        {item.weightUnit}
                      </span>
                      <span className="ml-auto font-medium">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-slate-100)]"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-lg border border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-slate-100)]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Totals */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-slate-50)]">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-[var(--color-primary-500)]">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              Clear
            </Button>
            <Button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay
            </Button>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowPayment(true)}
            disabled={cart.length === 0}
          >
            <Banknote className="w-4 h-4 mr-2" />
            Cash Payment
          </Button>
        </div>
      </div>

      {/* Weight Entry Modal */}
      {showWeightEntry && selectedWeightProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Enter Weight</h3>
              <button
                onClick={() => {
                  setShowWeightEntry(null);
                  setWeightInput("");
                }}
                className="text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[var(--color-muted)] mb-4">
              {selectedWeightProduct.name}
            </p>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="text-2xl text-center"
                  autoFocus
                />
              </div>
              <span className="text-lg text-[var(--color-muted)]">
                {selectedWeightProduct.weight_unit || "lb"}
              </span>
            </div>

            <p className="text-center text-lg font-medium mb-4">
              {formatCurrency(
                (selectedWeightProduct.sale_price ?? selectedWeightProduct.base_price) *
                  (parseFloat(weightInput) || 0)
              )}
            </p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[0.5, 1, 1.5, 2, 2.5, 3].map((w) => (
                <button
                  key={w}
                  onClick={() => setWeightInput(w.toString())}
                  className="py-2 px-3 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-slate-50)]"
                >
                  {w} {selectedWeightProduct.weight_unit || "lb"}
                </button>
              ))}
            </div>

            <Button
              className="w-full"
              onClick={() =>
                addWeightItemToCart(selectedWeightProduct, parseFloat(weightInput) || 1)
              }
            >
              Add to Cart
            </Button>
          </div>
        </div>
      )}

      {/* Customer Search Modal */}
      {showCustomerSearch && (
        <CustomerSearchModal
          onSelect={(c) => {
            setCustomer(c);
            setShowCustomerSearch(false);
          }}
          onClose={() => setShowCustomerSearch(false)}
        />
      )}

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          total={total}
          subtotal={subtotal}
          tax={tax}
          customer={customer}
          cart={cart}
          connectedReader={connectedReader}
          collectPayment={collectPayment}
          cancelPayment={cancelPayment}
          isProcessingPayment={isProcessingPayment}
          onClose={() => setShowPayment(false)}
          onComplete={() => {
            setShowPayment(false);
            clearCart();
            loadStats();
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          connectedReader={connectedReader}
          connectionStatus={connectionStatus}
          terminalError={terminalError}
          onDiscoverReaders={discoverReaders}
          onConnectReader={connectReader}
          onDisconnectReader={disconnectReader}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// Customer Search Modal Component
function CustomerSearchModal({
  onSelect,
  onClose,
}: {
  onSelect: (customer: Customer) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", fullName: "", phone: "" });
  const [creating, setCreating] = useState(false);

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const result = await searchCustomers(q);
    if (result.data) {
      setResults(result.data as Customer[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleCreateCustomer = async () => {
    if (!createForm.email) return;

    setCreating(true);
    const result = await createPOSCustomer({
      email: createForm.email,
      fullName: createForm.fullName || undefined,
      phone: createForm.phone || undefined,
    });

    if (result.data) {
      onSelect(result.data as Customer);
    } else if (result.error) {
      alert(result.error);
    }
    setCreating(false);
  };

  if (showCreate) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create Customer</h3>
            <button
              onClick={() => setShowCreate(false)}
              className="text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="customer@example.com"
              required
            />
            <Input
              label="Full Name"
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              placeholder="John Doe"
            />
            <Input
              label="Phone"
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateCustomer}
              isLoading={creating}
              disabled={!createForm.email}
            >
              Create
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Find Customer</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
            autoFocus
          />
        </div>

        <div className="max-h-64 overflow-auto">
          {loading ? (
            <div className="text-center py-8 text-[var(--color-muted)]">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted)]">
              {query ? "No customers found" : "Enter a search term"}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => onSelect(customer)}
                  className="w-full p-3 text-left rounded-lg hover:bg-[var(--color-slate-50)] border border-[var(--color-border)]"
                >
                  <p className="font-medium">{customer.full_name || customer.email}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {customer.email}
                    {customer.phone && ` • ${customer.phone}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <Button variant="outline" className="w-full" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Customer
          </Button>
        </div>
      </div>
    </div>
  );
}

// Payment Modal Component
function PaymentModal({
  total,
  subtotal,
  tax,
  customer,
  cart,
  connectedReader,
  collectPayment,
  cancelPayment,
  isProcessingPayment,
  onClose,
  onComplete,
}: {
  total: number;
  subtotal: number;
  tax: number;
  customer: Customer | null;
  cart: CartItem[];
  connectedReader: Reader | null;
  collectPayment: (amount: number, metadata?: Record<string, string>) => Promise<{ success: boolean; paymentIntentId: string }>;
  cancelPayment: () => Promise<void>;
  isProcessingPayment: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "split">("card");
  const [cashReceived, setCashReceived] = useState("");
  const [splitCardAmount, setSplitCardAmount] = useState("");
  const [splitCashAmount, setSplitCashAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [cardPaymentStatus, setCardPaymentStatus] = useState<string | null>(null);
  const [receiptInfo, setReceiptInfo] = useState<{
    orderId: string;
    orderNumber: number;
    change: number;
    paymentMethod: string;
  } | null>(null);

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = Math.max(0, cashAmount - total);

  // Split payment amounts
  const splitCard = parseFloat(splitCardAmount) || 0;
  const splitCash = parseFloat(splitCashAmount) || 0;
  const splitTotal = splitCard + splitCash;
  const splitChange = Math.max(0, splitCash - (total - splitCard));

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Handle card payment via Stripe Terminal
      if (paymentMethod === "card" && connectedReader) {
        setCardPaymentStatus("Waiting for card...");
        const cardResult = await collectPayment(total, {
          customer_id: customer?.id || "",
        });

        if (!cardResult.success) {
          throw new Error("Card payment failed");
        }
      }

      // Handle split payment
      if (paymentMethod === "split" && connectedReader && splitCard > 0) {
        setCardPaymentStatus("Processing card portion...");
        const cardResult = await collectPayment(splitCard, {
          customer_id: customer?.id || "",
          split_payment: "true",
        });

        if (!cardResult.success) {
          throw new Error("Card portion of split payment failed");
        }
      }

      // Create the order
      const result = await createPOSOrder({
        customerId: customer?.id,
        items: cart.map((item) => ({
          productId: item.productId,
          name: item.name,
          sku: item.sku,
          pricingType: item.pricingType,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          weight: item.weight,
          weightUnit: item.weightUnit,
          subtotal: item.subtotal,
        })),
        subtotal,
        tax,
        total,
        paymentMethod: paymentMethod === "split" ? "card" : paymentMethod,
        cashReceived: paymentMethod === "cash" ? cashAmount : paymentMethod === "split" ? splitCash : undefined,
        notes: paymentMethod === "split" ? `Split payment: $${splitCard.toFixed(2)} card, $${splitCash.toFixed(2)} cash` : undefined,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setReceiptInfo({
          orderId: result.data.orderId,
          orderNumber: result.data.orderNumber,
          change: paymentMethod === "split" ? splitChange : result.data.change,
          paymentMethod,
        });
      }
    } catch (error) {
      alert(`Payment failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setProcessing(false);
      setCardPaymentStatus(null);
    }
  };

  const handleCancelCardPayment = async () => {
    await cancelPayment();
    setCardPaymentStatus(null);
    setProcessing(false);
  };

  const handlePrintReceipt = async () => {
    if (receiptInfo?.orderId) {
      await printReceipt(receiptInfo.orderId);
    }
  };

  // Show receipt/completion screen
  if (receiptInfo) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          <h3 className="text-2xl font-bold text-[var(--color-charcoal)] mb-2">
            Payment Complete!
          </h3>

          <p className="text-[var(--color-muted)] mb-4">
            Order #{receiptInfo.orderNumber}
          </p>

          {(paymentMethod === "cash" || paymentMethod === "split") && receiptInfo.change > 0 && (
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-600">Change Due</p>
              <p className="text-3xl font-bold text-green-700">
                {formatCurrency(receiptInfo.change)}
              </p>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handlePrintReceipt}
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Receipt
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={async () => {
                await openCashDrawer();
              }}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Open Drawer
            </Button>
          </div>

          <Button className="w-full" size="lg" onClick={onComplete}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  // Show card processing screen
  if (cardPaymentStatus) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CreditCard className="w-8 h-8 text-blue-600" />
          </div>

          <h3 className="text-xl font-bold text-[var(--color-charcoal)] mb-2">
            {cardPaymentStatus}
          </h3>

          <p className="text-[var(--color-muted)] mb-6">
            Present card to the reader
          </p>

          <Button variant="outline" onClick={handleCancelCardPayment}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Payment</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total */}
        <div className="text-center mb-6">
          <p className="text-sm text-[var(--color-muted)] mb-1">Total Amount</p>
          <p className="text-4xl font-bold text-[var(--color-primary-500)]">
            {formatCurrency(total)}
          </p>
        </div>

        {/* Payment Method Toggle */}
        <div className="flex rounded-lg border border-[var(--color-border)] p-1 mb-6">
          <button
            onClick={() => setPaymentMethod("card")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              paymentMethod === "card"
                ? "bg-[var(--color-primary-500)] text-white"
                : "text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Card
          </button>
          <button
            onClick={() => setPaymentMethod("cash")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              paymentMethod === "cash"
                ? "bg-[var(--color-primary-500)] text-white"
                : "text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
            }`}
          >
            <Banknote className="w-4 h-4" />
            Cash
          </button>
          <button
            onClick={() => setPaymentMethod("split")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
              paymentMethod === "split"
                ? "bg-[var(--color-primary-500)] text-white"
                : "text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
            }`}
          >
            <Split className="w-4 h-4" />
            Split
          </button>
        </div>

        {paymentMethod === "cash" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
              Cash Received
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              className="text-2xl text-center"
              placeholder="0.00"
            />

            {/* Quick amount buttons */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {[20, 50, 100, Math.ceil(total)].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setCashReceived(amount.toString())}
                  className="py-2 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-slate-50)] text-sm"
                >
                  ${amount}
                </button>
              ))}
            </div>

            {cashAmount >= total && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-green-600">Change Due</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(change)}
                </p>
              </div>
            )}
          </div>
        )}

        {paymentMethod === "card" && (
          <div className="mb-6 p-4 bg-[var(--color-slate-50)] rounded-lg text-center">
            {connectedReader ? (
              <>
                <Wifi className="w-12 h-12 mx-auto mb-2 text-green-600" />
                <p className="text-green-700 font-medium">Reader Connected</p>
                <p className="text-sm text-[var(--color-muted)]">
                  Ready to accept card payment
                </p>
              </>
            ) : (
              <>
                <WifiOff className="w-12 h-12 mx-auto mb-2 text-yellow-600" />
                <p className="text-yellow-700 font-medium">No Reader Connected</p>
                <p className="text-sm text-[var(--color-muted)]">
                  Connect a reader in Settings or use Cash payment
                </p>
              </>
            )}
          </div>
        )}

        {paymentMethod === "split" && (
          <div className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
                <CreditCard className="w-4 h-4 inline mr-1" />
                Card Amount
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={total}
                value={splitCardAmount}
                onChange={(e) => {
                  setSplitCardAmount(e.target.value);
                  const cardVal = parseFloat(e.target.value) || 0;
                  setSplitCashAmount((total - cardVal).toFixed(2));
                }}
                className="text-xl text-center"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-charcoal)] mb-2">
                <Banknote className="w-4 h-4 inline mr-1" />
                Cash Amount
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={splitCashAmount}
                onChange={(e) => setSplitCashAmount(e.target.value)}
                className="text-xl text-center"
                placeholder="0.00"
              />
            </div>

            {splitTotal >= total && (
              <div className={`p-3 rounded-lg text-center ${splitTotal === total ? "bg-green-50" : "bg-yellow-50"}`}>
                {splitTotal === total ? (
                  <p className="text-green-700 font-medium">
                    <Check className="w-4 h-4 inline mr-1" />
                    Payment amounts match total
                  </p>
                ) : splitTotal > total ? (
                  <>
                    <p className="text-yellow-700 font-medium">Change Due</p>
                    <p className="text-xl font-bold text-yellow-800">
                      {formatCurrency(splitChange)}
                    </p>
                  </>
                ) : null}
              </div>
            )}

            {!connectedReader && splitCard > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-yellow-700 text-sm">
                  <WifiOff className="w-4 h-4 inline mr-1" />
                  No reader connected for card portion
                </p>
              </div>
            )}
          </div>
        )}

        <Button
          className="w-full"
          size="lg"
          onClick={handlePayment}
          isLoading={processing || isProcessingPayment}
          disabled={
            (paymentMethod === "cash" && cashAmount < total) ||
            (paymentMethod === "card" && !connectedReader) ||
            (paymentMethod === "split" && (splitTotal < total || (splitCard > 0 && !connectedReader)))
          }
        >
          {paymentMethod === "card"
            ? "Process Card Payment"
            : paymentMethod === "cash"
            ? "Complete Cash Payment"
            : "Process Split Payment"}
        </Button>
      </div>
    </div>
  );
}

// Settings Modal Component (Reader Management)
function SettingsModal({
  connectedReader,
  connectionStatus,
  terminalError,
  onDiscoverReaders,
  onConnectReader,
  onDisconnectReader,
  onClose,
}: {
  connectedReader: Reader | null;
  connectionStatus: string;
  terminalError: string | null;
  onDiscoverReaders: () => Promise<Reader[]>;
  onConnectReader: (reader: Reader) => Promise<Reader>;
  onDisconnectReader: () => Promise<void>;
  onClose: () => void;
}) {
  const [discoveredReaders, setDiscoveredReaders] = useState<Reader[]>([]);
  const [discovering, setDiscovering] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleDiscoverReaders = async () => {
    setDiscovering(true);
    try {
      const readers = await onDiscoverReaders();
      setDiscoveredReaders(readers);
    } catch (error) {
      console.error("Failed to discover readers:", error);
    } finally {
      setDiscovering(false);
    }
  };

  const handleConnectReader = async (reader: Reader) => {
    setConnecting(true);
    try {
      await onConnectReader(reader);
    } catch (error) {
      console.error("Failed to connect reader:", error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">POS Settings</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-muted)] hover:text-[var(--color-charcoal)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Reader Section */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-[var(--color-charcoal)] mb-3 flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Card Reader
          </h4>

          {/* Connection Status */}
          <div
            className={`p-4 rounded-lg mb-4 ${
              connectedReader
                ? "bg-green-50 border border-green-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {connectedReader ? (
                <>
                  <Wifi className="w-6 h-6 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">Connected</p>
                    <p className="text-sm text-green-700">
                      {connectedReader.label || connectedReader.id}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDisconnectReader}
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <>
                  <WifiOff className="w-6 h-6 text-yellow-600" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-800">Not Connected</p>
                    <p className="text-sm text-yellow-700">
                      {connectionStatus === "discovering"
                        ? "Searching for readers..."
                        : connectionStatus === "connecting"
                        ? "Connecting..."
                        : "No reader connected"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {terminalError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
              <p className="text-sm text-red-700">{terminalError}</p>
            </div>
          )}

          {/* Discover Readers */}
          {!connectedReader && (
            <>
              <Button
                variant="outline"
                className="w-full mb-4"
                onClick={handleDiscoverReaders}
                isLoading={discovering}
              >
                <Search className="w-4 h-4 mr-2" />
                Discover Readers
              </Button>

              {/* Discovered Readers List */}
              {discoveredReaders.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-[var(--color-muted)]">
                    Found {discoveredReaders.length} reader(s):
                  </p>
                  {discoveredReaders.map((reader) => (
                    <div
                      key={reader.id}
                      className="flex items-center justify-between p-3 border border-[var(--color-border)] rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{reader.label || "Unnamed Reader"}</p>
                        <p className="text-xs text-[var(--color-muted)]">
                          {reader.device_type} • {reader.serial_number || reader.id}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleConnectReader(reader)}
                        isLoading={connecting}
                      >
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {discoveredReaders.length === 0 && !discovering && (
                <p className="text-sm text-[var(--color-muted)] text-center py-4">
                  Click "Discover Readers" to find available card readers
                </p>
              )}
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="border-t border-[var(--color-border)] pt-4">
          <h4 className="text-sm font-semibold text-[var(--color-charcoal)] mb-3">
            Quick Actions
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                await openCashDrawer();
              }}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Open Drawer
            </Button>
            <Button variant="outline" onClick={onClose}>
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
