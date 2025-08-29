"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PortfolioSummary } from "@/types";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Coins,
  Wallet,
  PiggyBank,
} from "lucide-react";

interface PortfolioOverviewProps {
  summary?: PortfolioSummary;
}

export function PortfolioOverview({ summary }: PortfolioOverviewProps) {
  if (!summary) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-24"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      title: "Total Investment",
      value: summary.total_investment,
      format: "currency",
      icon: PiggyBank,
      description: "Total amount invested",
      color: "blue",
    },
    {
      title: "Market Value",
      value: summary.total_market_value,
      format: "currency",
      icon: Wallet,
      description: "Current portfolio value",
      color: "purple",
    },
    {
      title: "Unrealized P/L",
      value: summary.total_unrealized_pl,
      format: "currency",
      icon: summary.total_unrealized_pl >= 0 ? TrendingUp : TrendingDown,
      description: "Paper profit/loss",
      trend: summary.total_unrealized_pl >= 0 ? "positive" : "negative",
      color: summary.total_unrealized_pl >= 0 ? "green" : "red",
    },
    {
      title: "Realized Profit",
      value: summary.realized_profit,
      format: "currency",
      icon: Coins,
      description: "Actual profit from sales",
      trend: summary.realized_profit >= 0 ? "positive" : "negative",
      color: summary.realized_profit >= 0 ? "green" : "red",
    },
    {
      title: "% Change",
      value: summary.total_percent_updown,
      format: "percentage",
      icon: summary.total_percent_updown >= 0 ? TrendingUp : TrendingDown,
      description: "Overall portfolio performance",
      trend: summary.total_percent_updown >= 0 ? "positive" : "negative",
      color: summary.total_percent_updown >= 0 ? "green" : "red",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Portfolio Overview
          </h2>
          <p className="text-muted-foreground">
            Your investment summary and performance metrics
          </p>
        </div>
        {summary.total_percent_updown !== 0 && (
          <Badge
            variant={
              summary.total_percent_updown >= 0 ? "success" : "destructive"
            }
            className="text-sm px-3 py-1"
          >
            {summary.total_percent_updown >= 0 ? "+" : ""}
            {summary.total_percent_updown.toFixed(2)}% Overall
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {metrics.map((metric, index) => (
          <Card key={index} className="group hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <div
                className={`p-2 rounded-lg ${
                  metric.color === "blue"
                    ? "bg-blue-500/10"
                    : metric.color === "purple"
                    ? "bg-purple-500/10"
                    : metric.color === "green"
                    ? "bg-green-500/10"
                    : metric.color === "red"
                    ? "bg-red-500/10"
                    : "bg-muted"
                }`}
              >
                <metric.icon
                  className={`h-4 w-4 ${
                    metric.color === "blue"
                      ? "text-blue-500"
                      : metric.color === "purple"
                      ? "text-purple-500"
                      : metric.color === "green"
                      ? "text-green-500"
                      : metric.color === "red"
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.format === "currency"
                  ? formatCurrency(metric.value)
                  : formatPercentage(metric.value)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
