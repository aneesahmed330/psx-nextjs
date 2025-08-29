import useSWR from "swr";

interface StockPerformanceData {
  Symbol: string;
  [key: string]: any; // For dynamic date columns and net change
}

interface UseStockPerformanceProps {
  symbols: string[];
  days: number;
  source: string;
  enabled: boolean;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch stock performance data");
  }
  return response.json();
};

export function useStockPerformance({
  symbols,
  days,
  source,
  enabled,
}: UseStockPerformanceProps) {
  const shouldFetch = enabled && symbols.length > 0;

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch
      ? `/api/stocks/performance?symbols=${symbols.join(
          ","
        )}&days=${days}&source=${source}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    data: data?.data || [],
    error,
    isLoading,
    mutate,
  };
}
