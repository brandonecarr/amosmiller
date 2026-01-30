"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { saveCart, getSavedCart, mergeCartWithSaved, clearSavedCart, validateCartInventory } from "@/lib/actions/cart";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  pricingType: "fixed" | "weight";
  basePrice: number;
  salePrice: number | null;
  weightUnit: "lb" | "oz" | "kg" | "g";
  estimatedWeight: number | null;
  quantity: number;
  imageUrl: string | null;
  // Bundle support
  isBundle?: boolean;
  bundleItems?: Array<{
    productId: string;
    quantity: number;
  }>;
  // Co-op detection
  isCoopItem?: boolean;
}

export interface FulfillmentSelection {
  type: "pickup" | "delivery" | "shipping" | null;
  locationId: string | null;
  zoneId: string | null;
  scheduledDate: string | null;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
}

interface InventoryWarning {
  productId: string;
  name: string;
  requested: number;
  available: number;
  removed: boolean;
}

interface CartContextType {
  items: CartItem[];
  fulfillment: FulfillmentSelection;
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setFulfillment: (fulfillment: Partial<FulfillmentSelection>) => void;
  itemCount: number;
  subtotal: number;
  // Database sync
  userId: string | null;
  setUserId: (userId: string | null) => void;
  isSyncing: boolean;
  syncError: string | null;
  // Co-op detection
  hasCoopItems: boolean;
  // Inventory validation
  inventoryWarnings: InventoryWarning[];
  validateInventory: () => Promise<void>;
  clearInventoryWarnings: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "amos-miller-farm-cart";
const FULFILLMENT_STORAGE_KEY = "amos-miller-farm-fulfillment";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [fulfillment, setFulfillmentState] = useState<FulfillmentSelection>({
    type: null,
    locationId: null,
    zoneId: null,
    scheduledDate: null,
    address: null,
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const [userId, setUserIdState] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [inventoryWarnings, setInventoryWarnings] = useState<InventoryWarning[]>([]);

  // Track if we need to sync to DB
  const pendingSync = useRef(false);
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    const storedFulfillment = localStorage.getItem(FULFILLMENT_STORAGE_KEY);

    if (storedCart) {
      try {
        setItems(JSON.parse(storedCart));
      } catch (e) {
        console.error("Failed to parse cart:", e);
      }
    }

    if (storedFulfillment) {
      try {
        setFulfillmentState(JSON.parse(storedFulfillment));
      } catch (e) {
        console.error("Failed to parse fulfillment:", e);
      }
    }

    setIsHydrated(true);
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);

  // Save fulfillment to localStorage when it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(FULFILLMENT_STORAGE_KEY, JSON.stringify(fulfillment));
    }
  }, [fulfillment, isHydrated]);

  // Debounced database sync
  const syncToDatabase = useCallback(async () => {
    if (!userId || !isHydrated) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const result = await saveCart(userId, items, fulfillment);
      if (result.error) {
        setSyncError(result.error);
      }
    } catch (error) {
      console.error("Failed to sync cart to database:", error);
      setSyncError("Failed to sync cart");
    } finally {
      setIsSyncing(false);
      pendingSync.current = false;
    }
  }, [userId, items, fulfillment, isHydrated]);

  // Schedule sync when cart changes (debounced)
  useEffect(() => {
    if (!userId || !isHydrated) return;

    pendingSync.current = true;

    // Clear existing timeout
    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }

    // Schedule new sync after 1 second of inactivity
    syncTimeout.current = setTimeout(() => {
      if (pendingSync.current) {
        syncToDatabase();
      }
    }, 1000);

    return () => {
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
  }, [items, fulfillment, userId, isHydrated, syncToDatabase]);

  // Handle user login - merge carts
  const setUserId = useCallback(async (newUserId: string | null) => {
    setUserIdState(newUserId);

    if (newUserId && isHydrated) {
      setIsSyncing(true);
      setSyncError(null);

      try {
        const result = await mergeCartWithSaved(newUserId, items, fulfillment);

        if (result.data) {
          setItems(result.data.items);
          setFulfillmentState(result.data.fulfillment);
          // Update localStorage
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(result.data.items));
          localStorage.setItem(FULFILLMENT_STORAGE_KEY, JSON.stringify(result.data.fulfillment));
        }

        if (result.error) {
          setSyncError(result.error);
        }
      } catch (error) {
        console.error("Failed to merge carts:", error);
        setSyncError("Failed to sync cart with account");
      } finally {
        setIsSyncing(false);
      }
    } else if (!newUserId) {
      // User logged out - keep local cart, don't clear
      setSyncError(null);
    }
  }, [items, fulfillment, isHydrated]);

  // Load saved cart when user ID is set (for page refreshes)
  useEffect(() => {
    if (userId && isHydrated && items.length === 0) {
      const loadSavedCart = async () => {
        setIsSyncing(true);
        try {
          const result = await getSavedCart(userId);
          if (result.data && result.data.items.length > 0) {
            setItems(result.data.items);
            setFulfillmentState(result.data.fulfillment);
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(result.data.items));
            localStorage.setItem(FULFILLMENT_STORAGE_KEY, JSON.stringify(result.data.fulfillment));
          }
        } catch (error) {
          console.error("Failed to load saved cart:", error);
        } finally {
          setIsSyncing(false);
        }
      };
      loadSavedCart();
    }
  }, [userId, isHydrated, items.length]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      );

      if (existingIndex >= 0) {
        // Update quantity of existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + item.quantity,
        };
        return updated;
      }

      // Add new item
      return [...prev, { ...item, id: crypto.randomUUID() }];
    });

    // Clear any inventory warnings for this item
    setInventoryWarnings((prev) => prev.filter((w) => w.productId !== item.productId));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        // Clear any inventory warnings for this item
        setInventoryWarnings((warnings) =>
          warnings.filter((w) => w.productId !== item.productId)
        );
      }
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearCart = useCallback(async () => {
    setItems([]);
    setFulfillmentState({
      type: null,
      locationId: null,
      zoneId: null,
      scheduledDate: null,
      address: null,
    });
    setInventoryWarnings([]);

    // Clear from database if logged in
    if (userId) {
      try {
        await clearSavedCart(userId);
      } catch (error) {
        console.error("Failed to clear saved cart:", error);
      }
    }
  }, [userId]);

  const setFulfillment = useCallback((update: Partial<FulfillmentSelection>) => {
    setFulfillmentState((prev) => ({ ...prev, ...update }));
  }, []);

  // Validate inventory
  const validateInventory = useCallback(async () => {
    if (items.length === 0) {
      setInventoryWarnings([]);
      return;
    }

    try {
      const result = await validateCartInventory(items);
      if (result.invalidItems.length > 0) {
        setInventoryWarnings(result.invalidItems);

        // Auto-remove items that are completely unavailable
        const itemsToRemove = result.invalidItems.filter((w) => w.removed);
        if (itemsToRemove.length > 0) {
          setItems((prev) =>
            prev.filter((item) =>
              !itemsToRemove.some((w) => w.productId === item.productId)
            )
          );
        }

        // Auto-adjust quantities for items with insufficient stock
        const itemsToAdjust = result.invalidItems.filter((w) => !w.removed && w.available > 0);
        if (itemsToAdjust.length > 0) {
          setItems((prev) =>
            prev.map((item) => {
              const warning = itemsToAdjust.find((w) => w.productId === item.productId);
              if (warning) {
                return { ...item, quantity: warning.available };
              }
              return item;
            })
          );
        }
      } else {
        setInventoryWarnings([]);
      }
    } catch (error) {
      console.error("Failed to validate inventory:", error);
    }
  }, [items]);

  const clearInventoryWarnings = useCallback(() => {
    setInventoryWarnings([]);
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const hasCoopItems = items.some((item) => item.isCoopItem === true);

  const subtotal = items.reduce((sum, item) => {
    const price = item.salePrice ?? item.basePrice;
    if (item.pricingType === "weight" && item.estimatedWeight) {
      return sum + price * item.estimatedWeight * item.quantity;
    }
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        fulfillment,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        setFulfillment,
        itemCount,
        subtotal,
        userId,
        setUserId,
        isSyncing,
        syncError,
        hasCoopItems,
        inventoryWarnings,
        validateInventory,
        clearInventoryWarnings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
