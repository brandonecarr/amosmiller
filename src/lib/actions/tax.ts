"use server";

import { createClient } from "@/lib/supabase/server";

interface TaxRate {
  state: string;
  rate: number; // As decimal (0.06 = 6%)
  name: string;
}

interface TaxCalculationResult {
  taxAmount: number;
  taxRate: number;
  taxDescription: string;
  error: string | null;
}

// Default tax configuration - can be overridden by settings
const DEFAULT_TAX_CONFIG = {
  enabled: true,
  defaultRate: 0, // 0% - most farm products are tax exempt
  collectTaxInStates: [] as string[], // Empty = no tax collected
  exemptCategories: ["food", "groceries", "farm-products"], // Categories exempt from tax
};

// Get tax settings from database
export async function getTaxSettings() {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("settings")
    .select("value")
    .eq("key", "tax_settings")
    .single();

  if (error || !data) {
    // Return default config if no settings found
    return { data: DEFAULT_TAX_CONFIG, error: null };
  }

  return { data: data.value, error: null };
}

// Save tax settings
export async function saveTaxSettings(settings: typeof DEFAULT_TAX_CONFIG) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("settings")
    .upsert({
      key: "tax_settings",
      value: settings,
    });

  if (error) {
    console.error("Error saving tax settings:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Get state tax rates
export async function getStateTaxRates(): Promise<{ data: TaxRate[] | null; error: string | null }> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("settings")
    .select("value")
    .eq("key", "state_tax_rates")
    .single();

  if (error || !data) {
    // Return empty array if no rates configured
    return { data: [], error: null };
  }

  return { data: data.value as TaxRate[], error: null };
}

// Save state tax rates
export async function saveStateTaxRates(rates: TaxRate[]) {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("settings")
    .upsert({
      key: "state_tax_rates",
      value: rates,
    });

  if (error) {
    console.error("Error saving state tax rates:", error);
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

// Calculate tax for an order
export async function calculateTax({
  subtotal,
  shippingState,
  categoryIds = [],
}: {
  subtotal: number;
  shippingState?: string;
  categoryIds?: string[];
}): Promise<TaxCalculationResult> {
  // Get tax settings
  const { data: settings } = await getTaxSettings();

  // If tax is disabled, return 0
  if (!settings?.enabled) {
    return {
      taxAmount: 0,
      taxRate: 0,
      taxDescription: "Tax exempt",
      error: null,
    };
  }

  // If no shipping state provided (pickup), check if local tax applies
  if (!shippingState) {
    return {
      taxAmount: 0,
      taxRate: 0,
      taxDescription: "No tax on pickup orders",
      error: null,
    };
  }

  // Check if we collect tax in this state
  const collectTaxStates = settings.collectTaxInStates || [];
  if (collectTaxStates.length > 0 && !collectTaxStates.includes(shippingState)) {
    return {
      taxAmount: 0,
      taxRate: 0,
      taxDescription: `No tax collected in ${shippingState}`,
      error: null,
    };
  }

  // Get state-specific tax rate
  const { data: taxRates } = await getStateTaxRates();
  const stateRate = taxRates?.find((r) => r.state === shippingState);

  // Use state rate or default rate
  const taxRate = stateRate?.rate ?? settings.defaultRate ?? 0;

  if (taxRate === 0) {
    return {
      taxAmount: 0,
      taxRate: 0,
      taxDescription: "Tax exempt",
      error: null,
    };
  }

  // Calculate tax amount
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;

  return {
    taxAmount,
    taxRate,
    taxDescription: stateRate?.name || `${(taxRate * 100).toFixed(2)}% tax`,
    error: null,
  };
}

// Check if a product category is tax exempt
export async function isCategoryTaxExempt(categoryId: string): Promise<boolean> {
  const { data: settings } = await getTaxSettings();
  const exemptCategories = settings?.exemptCategories || [];

  // Would need to look up category slug and check against exempt list
  // For now, return false - implement full logic when categories have slugs
  return exemptCategories.length > 0 && exemptCategories.includes(categoryId);
}
