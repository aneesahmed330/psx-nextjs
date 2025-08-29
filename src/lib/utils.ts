import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "Rs.") {
  return `${currency} ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(n: number): string {
  const abs_n = Math.abs(n);
  if (abs_n >= 1_000_000_000_000) {
    return `${(n / 1_000_000_000_000).toFixed(2)}T`;
  } else if (abs_n >= 1_000_000_000) {
    return `${(n / 1_000_000_000).toFixed(2)}B`;
  } else if (abs_n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2)}M`;
  } else if (abs_n >= 1_000) {
    return `${(n / 1_000).toFixed(2)}K`;
  } else {
    return n.toFixed(2);
  }
}

export function formatPercentage(value: number | string): string {
  if (typeof value === "string") {
    return value.endsWith("%") ? value : `${value}%`;
  }
  return `${value.toFixed(2)}%`;
}


