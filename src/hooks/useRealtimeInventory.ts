"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface InventoryUpdate {
  productId: string;
  stockQuantity: number;
  updatedAt: string;
}

interface UseRealtimeInventoryOptions {
  onUpdate?: (update: InventoryUpdate) => void;
  onError?: (error: Error) => void;
}

export function useRealtimeInventory(options: UseRealtimeInventoryOptions = {}) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const subscribe = useCallback(() => {
    if (channelRef.current) {
      return; // Already subscribed
    }

    const supabase = createClient();
    supabaseRef.current = supabase;

    const channel = supabase
      .channel("inventory-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: "track_inventory=eq.true",
        },
        (payload) => {
          const update: InventoryUpdate = {
            productId: payload.new.id as string,
            stockQuantity: payload.new.stock_quantity as number,
            updatedAt: payload.new.updated_at as string,
          };
          options.onUpdate?.(update);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to inventory updates");
        } else if (status === "CHANNEL_ERROR") {
          options.onError?.(new Error("Failed to subscribe to inventory updates"));
        }
      });

    channelRef.current = channel;
  }, [options]);

  const unsubscribe = useCallback(async () => {
    if (channelRef.current && supabaseRef.current) {
      await supabaseRef.current.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  // Auto-subscribe on mount
  useEffect(() => {
    subscribe();
    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return {
    subscribe,
    unsubscribe,
  };
}

// Hook to sync POS products with real-time updates
export function usePOSInventorySync<T extends { id: string; stock_quantity: number }>(
  products: T[],
  setProducts: React.Dispatch<React.SetStateAction<T[]>>
) {
  useRealtimeInventory({
    onUpdate: (update) => {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === update.productId
            ? { ...product, stock_quantity: update.stockQuantity }
            : product
        )
      );
    },
    onError: (error) => {
      console.error("Inventory sync error:", error);
    },
  });
}
