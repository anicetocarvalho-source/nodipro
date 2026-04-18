import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  is_active: boolean;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
  source: string | null;
}

export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: async (): Promise<Currency[]> => {
      const { data, error } = await supabase
        .from("currencies")
        .select("*")
        .eq("is_active", true)
        .order("code");
      if (error) throw error;
      return (data ?? []) as Currency[];
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useExchangeRates() {
  return useQuery({
    queryKey: ["exchange_rates"],
    queryFn: async (): Promise<ExchangeRate[]> => {
      const { data, error } = await supabase
        .from("exchange_rates")
        .select("*")
        .order("effective_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExchangeRate[];
    },
    staleTime: 1000 * 60 * 30,
  });
}

/** Convert amount from one currency to another using latest rate available */
export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: ExchangeRate[]
): number {
  if (from === to) return amount;
  const direct = rates.find((r) => r.from_currency === from && r.to_currency === to);
  if (direct) return amount * Number(direct.rate);
  // Try reverse
  const reverse = rates.find((r) => r.from_currency === to && r.to_currency === from);
  if (reverse) return amount / Number(reverse.rate);
  // Try via AOA pivot
  const fromToAOA = rates.find((r) => r.from_currency === from && r.to_currency === "AOA");
  const aoaToTo = rates.find((r) => r.from_currency === "AOA" && r.to_currency === to);
  if (fromToAOA && aoaToTo) return amount * Number(fromToAOA.rate) * Number(aoaToTo.rate);
  return amount;
}

export function formatCurrency(amount: number, currency: Currency | string): string {
  const code = typeof currency === "string" ? currency : currency.code;
  const symbol = typeof currency === "string" ? code : currency.symbol;
  const decimals = typeof currency === "string" ? 2 : currency.decimals;
  return `${symbol} ${amount.toLocaleString("pt-PT", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
