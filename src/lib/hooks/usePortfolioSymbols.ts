import useSWR from "swr";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch portfolio data");
  }
  return response.json();
};

export function usePortfolioSymbols() {
  const { data, error, isLoading } = useSWR(`/api/portfolio`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000, // 5 minutes
  });

  const portfolioSymbols =
    data?.data?.portfolio?.map((item: any) => item.symbol) || [];

  return {
    symbols: portfolioSymbols,
    error,
    isLoading,
  };
}
