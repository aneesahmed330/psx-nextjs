"use client";

import useSWR from "swr";
import {
  Portfolio,
  PortfolioSummary,
  Trade,
  Price,
  Alert,
  Stock,
} from "@/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePortfolio() {
  const { data, error, mutate } = useSWR("/api/portfolio", fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes
    revalidateOnFocus: false,
  });

  return {
    portfolio: data?.data?.portfolio as Portfolio[] | undefined,
    summary: data?.data?.summary as PortfolioSummary | undefined,
    loading: !error && !data,
    error,
    mutate,
  };
}

export function useTrades(
  symbol?: string,
  startDate?: string,
  endDate?: string
) {
  const params = new URLSearchParams();
  if (symbol && symbol !== "All") params.append("symbol", symbol);
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const url = `/api/trades?${params.toString()}`;

  const { data, error, mutate } = useSWR(url, fetcher, {
    refreshInterval: 60000, // Refresh every minute
  });

  return {
    trades: data?.data as Trade[] | undefined,
    loading: !error && !data,
    error,
    mutate,
  };
}

export function usePrices(symbols?: string[], latest = true) {
  const params = new URLSearchParams();
  if (symbols && symbols.length > 0)
    params.append("symbols", symbols.join(","));
  if (latest) params.append("latest", "true");

  const url = `/api/prices?${params.toString()}`;

  const { data, error, mutate } = useSWR(url, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: false,
  });

  return {
    prices: data?.data as Price[] | undefined,
    loading: !error && !data,
    error,
    mutate,
  };
}

export function useAlerts() {
  const { data, error, mutate } = useSWR("/api/alerts", fetcher, {
    refreshInterval: 60000, // Refresh every minute
  });

  return {
    alerts: data?.data as Alert[] | undefined,
    loading: !error && !data,
    error,
    mutate,
  };
}

export function useStocks(symbolsOnly = false) {
  const params = new URLSearchParams();
  if (symbolsOnly) params.append("symbolsOnly", "true");

  const url = `/api/stocks?${params.toString()}`;

  const { data, error, mutate } = useSWR(url, fetcher, {
    refreshInterval: 300000, // Refresh every 5 minutes
    revalidateOnFocus: false,
  });

  return {
    stocks: data?.data as Stock[] | undefined,
    loading: !error && !data,
    error,
    mutate,
  };
}

// API helper functions for mutations
export const api = {
  async addTrade(trade: Omit<Trade, "_id">) {
    const response = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trade),
    });
    return response.json();
  },

  async deleteTrade(id: string) {
    const response = await fetch(`/api/trades?id=${id}`, {
      method: "DELETE",
    });
    return response.json();
  },

  async addAlert(alert: Omit<Alert, "_id">) {
    const response = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alert),
    });
    return response.json();
  },

  async updateAlert(alert: Partial<Alert>, action: "toggle" | "trigger") {
    const response = await fetch(`/api/alerts?action=${action}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alert),
    });
    return response.json();
  },

  async deleteAlert(alert: Pick<Alert, "symbol" | "min_price" | "max_price">) {
    const response = await fetch("/api/alerts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alert),
    });
    return response.json();
  },

  async addStock(symbol: string) {
    const response = await fetch("/api/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    return response.json();
  },

  async deleteStock(symbol: string) {
    const response = await fetch("/api/stocks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    return response.json();
  },

  async addPrice(price: Omit<Price, "_id">) {
    const response = await fetch("/api/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(price),
    });
    return response.json();
  },
};


