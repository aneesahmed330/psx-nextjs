export interface Price {
  _id?: string;
  symbol: string;
  price: number;
  change_value: number | null;
  percentage: string | null;
  direction: string;
  fetched_at: string;
}

export interface Trade {
  _id?: string;
  symbol: string;
  trade_type: "Buy" | "Sell";
  quantity: number;
  price: number;
  trade_date: string;
  notes?: string;
  percentage_change?: string;
  pl_amount?: string;
}

export interface Alert {
  _id?: string;
  symbol: string;
  min_price: number;
  max_price: number;
  enabled: boolean;
  trigger: boolean;
  trade_type?: "Buy" | "Sell";
  quantity?: number;
  notes?: string;
}

export interface Stock {
  _id?: string;
  symbol: string;
  payouts: Payout[];
  financials: {
    annual: FinancialData[];
    quarterly: FinancialData[];
  };
  ratios: RatioData[];
}

export interface Payout {
  "Financial Results": string;
  Details: string;
  "Entitlement Date": string;
  "Payment Date": string;
}

export interface FinancialData {
  period: string;
  "Mark-up Earned": string;
  "Total Income": string;
  "Profit after Taxation": string;
  EPS: string;
}

export interface RatioData {
  period: string;
  "EPS Growth (%)": string;
  "Net Profit Margin (%)": string;
  PEG: string;
}

export interface Portfolio {
  symbol: string;
  shares_held: number;
  avg_buy_price: number;
  latest_price: number | null;
  change_percentage: string | null;
  market_value: number;
  investment: number;
  percent_updown: number;
  unrealized_pl: number;
  last_update: string | null;
}

export interface PortfolioSummary {
  total_investment: number;
  total_market_value: number;
  total_unrealized_pl: number;
  total_percent_updown: number;
  realized_profit: number;
}

export interface User {
  _id?: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
