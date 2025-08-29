import useSWR from "swr";
import { Stock } from "@/types";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch stock data");
  }
  return response.json();
};

export function useStockData(symbol: string, enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? `/api/stocks?symbolsOnly=false` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  const stockData = data?.data?.find((stock: Stock) => stock.symbol === symbol);

  return {
    data: stockData,
    error,
    isLoading,
    mutate,
  };
}

export function useStocksList() {
  const { data, error, isLoading, mutate } = useSWR(
    `/api/stocks?symbolsOnly=true`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    symbols: data?.data?.map((stock: any) => stock.symbol) || [],
    error,
    isLoading,
    mutate,
  };
}
