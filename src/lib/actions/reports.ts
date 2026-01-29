"use server";

import { createClient } from "@/lib/supabase/server";
import {
  startOfMonth,
  subMonths,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
  parseISO,
  differenceInDays,
} from "date-fns";

// ─── Dashboard Stats ───────────────────────────────────────────

export async function getDashboardStats() {
  const supabase = await createClient();
  const now = new Date();
  const thisMonthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const lastMonthEnd = format(
    startOfMonth(now),
    "yyyy-MM-dd"
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Fetch orders for this month and last month (paid only)
  const [thisMonthOrders, lastMonthOrders, products, customers, recentOrders] =
    await Promise.all([
      db
        .from("orders")
        .select("id, total")
        .eq("payment_status", "paid")
        .gte("created_at", thisMonthStart),
      db
        .from("orders")
        .select("id, total")
        .eq("payment_status", "paid")
        .gte("created_at", lastMonthStart)
        .lt("created_at", lastMonthEnd),
      db.from("products").select("id").eq("is_active", true),
      db.from("profiles").select("id, created_at").eq("role", "customer"),
      db
        .from("orders")
        .select("id, order_number, total, status, created_at, customer_first_name, customer_last_name")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const thisMonthData: { id: string; total: number }[] =
    thisMonthOrders.data || [];
  const lastMonthData: { id: string; total: number }[] =
    lastMonthOrders.data || [];
  const productData: { id: string }[] = products.data || [];
  const customerData: { id: string; created_at: string }[] =
    customers.data || [];

  const thisRevenue = thisMonthData.reduce((sum, o) => sum + (o.total || 0), 0);
  const lastRevenue = lastMonthData.reduce((sum, o) => sum + (o.total || 0), 0);
  const revenueChange =
    lastRevenue > 0
      ? ((thisRevenue - lastRevenue) / lastRevenue) * 100
      : thisRevenue > 0
        ? 100
        : 0;

  const thisOrderCount = thisMonthData.length;
  const lastOrderCount = lastMonthData.length;
  const orderCountChange =
    lastOrderCount > 0
      ? ((thisOrderCount - lastOrderCount) / lastOrderCount) * 100
      : thisOrderCount > 0
        ? 100
        : 0;

  const newCustomersThisMonth = customerData.filter(
    (c) => c.created_at >= thisMonthStart
  ).length;

  return {
    stats: {
      totalRevenue: thisRevenue,
      revenueChange: Math.round(revenueChange * 10) / 10,
      orderCount: thisOrderCount,
      orderCountChange: Math.round(orderCountChange * 10) / 10,
      productCount: productData.length,
      customerCount: customerData.length,
      newCustomerCount: newCustomersThisMonth,
    },
    recentOrders: (recentOrders.data || []).map(
      (o: {
        id: string;
        order_number: number;
        total: number;
        status: string;
        created_at: string;
        customer_first_name: string | null;
        customer_last_name: string | null;
      }) => ({
        id: o.id,
        orderNumber: o.order_number,
        customerName:
          [o.customer_first_name, o.customer_last_name]
            .filter(Boolean)
            .join(" ") || "Guest",
        total: o.total || 0,
        status: o.status,
        createdAt: o.created_at,
      })
    ),
  };
}

// ─── Sales Report ──────────────────────────────────────────────

export interface SalesReportData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalItemsSold: number;
  };
  revenueByDate: { date: string; revenue: number; orders: number }[];
  salesByCategory: { name: string; revenue: number; items: number }[];
  salesByFulfillment: { type: string; count: number; revenue: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
}

export async function getSalesReport(
  from: string,
  to: string
): Promise<SalesReportData> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [ordersRes, itemsRes] = await Promise.all([
    db
      .from("orders")
      .select("id, total, fulfillment_type, created_at")
      .eq("payment_status", "paid")
      .neq("status", "cancelled")
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`),
    db
      .from("order_items")
      .select(
        "order_id, product_name, quantity, final_price, unit_price, products(category_id, categories(name))"
      )
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`),
  ]);

  const orders: {
    id: string;
    total: number;
    fulfillment_type: string;
    created_at: string;
  }[] = ordersRes.data || [];
  const items: {
    order_id: string;
    product_name: string;
    quantity: number;
    final_price: number | null;
    unit_price: number;
    products: { category_id: string; categories: { name: string } | null } | null;
  }[] = itemsRes.data || [];

  // Filter items to only paid orders
  const paidOrderIds = new Set(orders.map((o) => o.id));
  const paidItems = items.filter((i) => paidOrderIds.has(i.order_id));

  // Summary
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalItemsSold = paidItems.reduce((sum, i) => sum + (i.quantity || 0), 0);

  // Revenue by date
  const rangeDays = differenceInDays(parseISO(to), parseISO(from));
  const useMonthly = rangeDays > 90;

  const dateIntervals = useMonthly
    ? eachMonthOfInterval({ start: parseISO(from), end: parseISO(to) })
    : eachDayOfInterval({ start: parseISO(from), end: parseISO(to) });

  const dateFormat = useMonthly ? "yyyy-MM" : "yyyy-MM-dd";

  const revenueMap = new Map<string, { revenue: number; orders: number }>();
  dateIntervals.forEach((d) => {
    revenueMap.set(format(d, dateFormat), { revenue: 0, orders: 0 });
  });

  orders.forEach((o) => {
    const key = format(parseISO(o.created_at), dateFormat);
    const entry = revenueMap.get(key);
    if (entry) {
      entry.revenue += o.total || 0;
      entry.orders += 1;
    }
  });

  const revenueByDate = Array.from(revenueMap.entries()).map(([date, data]) => ({
    date,
    revenue: Math.round(data.revenue * 100) / 100,
    orders: data.orders,
  }));

  // Sales by category
  const categoryMap = new Map<string, { revenue: number; items: number }>();
  paidItems.forEach((item) => {
    const catName = item.products?.categories?.name || "Uncategorized";
    const entry = categoryMap.get(catName) || { revenue: 0, items: 0 };
    entry.revenue += item.final_price || item.unit_price * item.quantity;
    entry.items += item.quantity;
    categoryMap.set(catName, entry);
  });

  const salesByCategory = Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      name,
      revenue: Math.round(data.revenue * 100) / 100,
      items: data.items,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Sales by fulfillment type
  const fulfillmentMap = new Map<string, { count: number; revenue: number }>();
  orders.forEach((o) => {
    const type = o.fulfillment_type || "unknown";
    const entry = fulfillmentMap.get(type) || { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += o.total || 0;
    fulfillmentMap.set(type, entry);
  });

  const salesByFulfillment = Array.from(fulfillmentMap.entries()).map(
    ([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count: data.count,
      revenue: Math.round(data.revenue * 100) / 100,
    })
  );

  // Top products
  const productMap = new Map<string, { revenue: number; quantity: number }>();
  paidItems.forEach((item) => {
    const name = item.product_name || "Unknown";
    const entry = productMap.get(name) || { revenue: 0, quantity: 0 };
    entry.revenue += item.final_price || item.unit_price * item.quantity;
    entry.quantity += item.quantity;
    productMap.set(name, entry);
  });

  const topProducts = Array.from(productMap.entries())
    .map(([name, data]) => ({
      name,
      revenue: Math.round(data.revenue * 100) / 100,
      quantity: data.quantity,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    summary: {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalItemsSold,
    },
    revenueByDate,
    salesByCategory,
    salesByFulfillment,
    topProducts,
  };
}

// ─── Inventory Report ──────────────────────────────────────────

export interface InventoryReportData {
  summary: {
    totalProducts: number;
    totalStock: number;
    lowStockCount: number;
    outOfStockCount: number;
    inventoryValue: number;
  };
  products: {
    id: string;
    name: string;
    sku: string | null;
    stockQuantity: number;
    lowStockThreshold: number;
    categoryName: string;
    basePrice: number;
    status: "ok" | "low" | "out";
  }[];
  stockByCategory: { name: string; totalStock: number; productCount: number }[];
}

export async function getInventoryReport(): Promise<InventoryReportData> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data } = await db
    .from("products")
    .select("id, name, sku, stock_quantity, low_stock_threshold, base_price, is_active, categories(name)")
    .eq("track_inventory", true)
    .eq("is_active", true)
    .order("stock_quantity", { ascending: true });

  const rawProducts: {
    id: string;
    name: string;
    sku: string | null;
    stock_quantity: number;
    low_stock_threshold: number;
    base_price: number;
    is_active: boolean;
    categories: { name: string } | null;
  }[] = data || [];

  const products = rawProducts.map((p) => {
    let status: "ok" | "low" | "out" = "ok";
    if (p.stock_quantity <= 0) status = "out";
    else if (p.stock_quantity <= (p.low_stock_threshold || 5)) status = "low";

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stock_quantity,
      lowStockThreshold: p.low_stock_threshold || 5,
      categoryName: p.categories?.name || "Uncategorized",
      basePrice: p.base_price,
      status,
    };
  });

  const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const lowStockCount = products.filter((p) => p.status === "low").length;
  const outOfStockCount = products.filter((p) => p.status === "out").length;
  const inventoryValue = products.reduce(
    (sum, p) => sum + p.stockQuantity * p.basePrice,
    0
  );

  // Stock by category
  const catMap = new Map<string, { totalStock: number; productCount: number }>();
  products.forEach((p) => {
    const entry = catMap.get(p.categoryName) || {
      totalStock: 0,
      productCount: 0,
    };
    entry.totalStock += p.stockQuantity;
    entry.productCount += 1;
    catMap.set(p.categoryName, entry);
  });

  const stockByCategory = Array.from(catMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalStock - a.totalStock);

  return {
    summary: {
      totalProducts: products.length,
      totalStock,
      lowStockCount,
      outOfStockCount,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
    },
    products,
    stockByCategory,
  };
}

// ─── Customer Report ───────────────────────────────────────────

export interface CustomerReportData {
  summary: {
    newCustomers: number;
    totalCustomers: number;
    repeatRate: number;
    avgOrdersPerCustomer: number;
  };
  acquisitionByDate: { date: string; count: number }[];
  topCustomers: {
    id: string;
    name: string;
    email: string;
    orderCount: number;
    totalSpent: number;
  }[];
}

export async function getCustomerReport(
  from: string,
  to: string
): Promise<CustomerReportData> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const [customersRes, ordersRes, allCustomersRes] = await Promise.all([
    db
      .from("profiles")
      .select("id, full_name, email, created_at")
      .eq("role", "customer")
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`),
    db
      .from("orders")
      .select("id, user_id, total, customer_first_name, customer_last_name, customer_email")
      .eq("payment_status", "paid")
      .gte("created_at", from)
      .lte("created_at", `${to}T23:59:59`),
    db
      .from("profiles")
      .select("id")
      .eq("role", "customer"),
  ]);

  const newCustomers: { id: string; full_name: string; email: string; created_at: string }[] =
    customersRes.data || [];
  const orders: {
    id: string;
    user_id: string | null;
    total: number;
    customer_first_name: string | null;
    customer_last_name: string | null;
    customer_email: string | null;
  }[] = ordersRes.data || [];
  const allCustomers: { id: string }[] = allCustomersRes.data || [];

  // Acquisition by date
  const rangeDays = differenceInDays(parseISO(to), parseISO(from));
  const useMonthly = rangeDays > 90;
  const dateFormat = useMonthly ? "yyyy-MM" : "yyyy-MM-dd";
  const dateIntervals = useMonthly
    ? eachMonthOfInterval({ start: parseISO(from), end: parseISO(to) })
    : eachDayOfInterval({ start: parseISO(from), end: parseISO(to) });

  const acquisitionMap = new Map<string, number>();
  dateIntervals.forEach((d) => acquisitionMap.set(format(d, dateFormat), 0));

  newCustomers.forEach((c) => {
    const key = format(parseISO(c.created_at), dateFormat);
    acquisitionMap.set(key, (acquisitionMap.get(key) || 0) + 1);
  });

  const acquisitionByDate = Array.from(acquisitionMap.entries()).map(
    ([date, count]) => ({ date, count })
  );

  // Top customers by spend
  const customerSpend = new Map<
    string,
    { name: string; email: string; orderCount: number; totalSpent: number }
  >();

  orders.forEach((o) => {
    const key = o.user_id || o.customer_email || "anonymous";
    const entry = customerSpend.get(key) || {
      name:
        [o.customer_first_name, o.customer_last_name].filter(Boolean).join(" ") ||
        "Guest",
      email: o.customer_email || "",
      orderCount: 0,
      totalSpent: 0,
    };
    entry.orderCount += 1;
    entry.totalSpent += o.total || 0;
    customerSpend.set(key, entry);
  });

  const topCustomers = Array.from(customerSpend.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      email: data.email,
      orderCount: data.orderCount,
      totalSpent: Math.round(data.totalSpent * 100) / 100,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Repeat rate
  const customersWithOrders = customerSpend.size;
  const repeatCustomers = Array.from(customerSpend.values()).filter(
    (c) => c.orderCount >= 2
  ).length;
  const repeatRate =
    customersWithOrders > 0
      ? Math.round((repeatCustomers / customersWithOrders) * 1000) / 10
      : 0;

  const avgOrdersPerCustomer =
    customersWithOrders > 0
      ? Math.round((orders.length / customersWithOrders) * 10) / 10
      : 0;

  return {
    summary: {
      newCustomers: newCustomers.length,
      totalCustomers: allCustomers.length,
      repeatRate,
      avgOrdersPerCustomer,
    },
    acquisitionByDate,
    topCustomers,
  };
}
