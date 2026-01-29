import { clsx, type ClassValue } from "clsx";

// Combine class names with clsx
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format currency
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

// Format weight with unit
export function formatWeight(
  weight: number,
  unit: "lb" | "oz" | "kg" | "g" = "lb"
): string {
  const formatted = weight.toFixed(2).replace(/\.?0+$/, "");
  return `${formatted} ${unit}`;
}

// Format weight-based price
export function formatWeightPrice(
  pricePerUnit: number,
  unit: "lb" | "oz" | "kg" | "g" = "lb"
): string {
  return `${formatCurrency(pricePerUnit)}/${unit}`;
}

// Calculate estimated price range for weight-based items
export function calculatePriceRange(
  pricePerUnit: number,
  minWeight: number,
  maxWeight: number
): { min: number; max: number } {
  return {
    min: pricePerUnit * minWeight,
    max: pricePerUnit * maxWeight,
  };
}

// Generate slug from string
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

// Generate random string (for gift card codes, etc.)
export function generateRandomCode(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Format order number with padding
export function formatOrderNumber(orderNumber: number): string {
  return `#${orderNumber.toString().padStart(6, "0")}`;
}

// Format date for display
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  return new Date(date).toLocaleDateString("en-US", options || defaultOptions);
}

// Format date and time
export function formatDateTime(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return new Date(date).toLocaleString("en-US", options || defaultOptions);
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return formatDate(date);
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number (basic US format)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?1?\d{10,14}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ""));
}

// Format phone number
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === "1") {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

// Check if zip code is in a list
export function isZipInZone(zipCode: string, zoneZipCodes: string[]): boolean {
  return zoneZipCodes.some((z) => {
    // Exact match
    if (z === zipCode) return true;
    // Prefix match (e.g., "190" matches "19001")
    if (z.endsWith("*") && zipCode.startsWith(z.slice(0, -1))) return true;
    // Range match (e.g., "19000-19999")
    if (z.includes("-")) {
      const [start, end] = z.split("-").map(Number);
      const zip = Number(zipCode);
      return zip >= start && zip <= end;
    }
    return false;
  });
}

// Check if state is in a list
export function isStateInZone(
  state: string,
  zoneStates: string[]
): boolean {
  const normalized = state.toUpperCase();
  return zoneStates.some(
    (s) => s.toUpperCase() === normalized
  );
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

// Parse JSON safely
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Calculate percentage
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

// Order status display helpers
export const orderStatusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const paymentStatusLabels: Record<string, string> = {
  pending: "Pending",
  authorized: "Authorized",
  paid: "Paid",
  partially_refunded: "Partially Refunded",
  refunded: "Refunded",
  failed: "Failed",
};

export const orderStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  packed: "bg-indigo-100 text-indigo-800",
  shipped: "bg-cyan-100 text-cyan-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// Calculate subscription total
export function calculateSubscriptionTotal(
  items: Array<{
    quantity: number;
    product: {
      base_price: number;
      sale_price: number | null;
      pricing_type: string;
      estimated_weight?: number | null;
    };
    variant?: { price_modifier: number } | null;
  }>,
  shippingFee: number = 0
): number {
  const subtotal = items.reduce((sum, item) => {
    const basePrice = item.product.sale_price ?? item.product.base_price;
    const variantMod = item.variant?.price_modifier || 0;
    const price = basePrice + variantMod;

    if (item.product.pricing_type === "weight") {
      return sum + price * (item.product.estimated_weight || 1) * item.quantity;
    }
    return sum + price * item.quantity;
  }, 0);

  return subtotal + shippingFee;
}
