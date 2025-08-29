"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Portfolio, PortfolioSummary } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Trophy, Target } from "lucide-react";
import { NormalizedPriceTrend } from "./normalized-price-trend";

interface PerformanceAnalyticsProps {
  portfolio?: Portfolio[];
  summary?: PortfolioSummary;
}

const COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#EC4899", // Pink
  "#84CC16", // Lime
  "#6366F1", // Indigo
  "#F43F5E", // Rose
  "#14B8A6", // Teal
];

export function PerformanceAnalytics({
  portfolio,
  summary,
}: PerformanceAnalyticsProps) {
  if (!portfolio || !summary) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted animate-pulse rounded"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted animate-pulse rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics</CardTitle>
          <CardDescription>No data available for analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Add some trades to see performance analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for pie chart (portfolio allocation)
  const allocationData = portfolio
    .filter((holding) => holding.market_value > 0)
    .map((holding) => ({
      name: holding.symbol,
      value: holding.market_value,
      percentage: (
        (holding.market_value / summary.total_market_value) *
        100
      ).toFixed(1),
    }));

  // Prepare data for performance bar chart
  const performanceData = portfolio.map((holding) => ({
    symbol: holding.symbol,
    "P/L %": holding.percent_updown,
    "P/L Amount": holding.unrealized_pl,
  }));

  // Performance metrics
  const bestPerformer = portfolio.reduce((prev, current) =>
    prev.percent_updown > current.percent_updown ? prev : current
  );

  const worstPerformer = portfolio.reduce((prev, current) =>
    prev.percent_updown < current.percent_updown ? prev : current
  );

  const largestHolding = portfolio.reduce((prev, current) =>
    prev.market_value > current.market_value ? prev : current
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((pld: any, index: number) => (
            <p key={index} style={{ color: pld.color }}>
              {`${pld.dataKey}: ${
                pld.dataKey.includes("%")
                  ? pld.value.toFixed(2) + "%"
                  : formatCurrency(pld.value)
              }`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Best Performer
            </CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestPerformer.symbol}</div>
            <p className="text-sm text-green-600 font-semibold">
              +{bestPerformer.percent_updown.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Worst Performer
            </CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <TrendingDown className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{worstPerformer.symbol}</div>
            <p className="text-sm text-red-600 font-semibold">
              {worstPerformer.percent_updown.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Largest Holding
            </CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <Trophy className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{largestHolding.symbol}</div>
            <p className="text-sm text-muted-foreground font-semibold">
              {formatCurrency(largestHolding.market_value)}
            </p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Gain/Loss
            </CardTitle>
            <div className="p-2 bg-muted rounded-lg">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.total_unrealized_pl >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(summary.total_unrealized_pl)}
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {summary.total_unrealized_pl >= 0 ? "Profit" : "Loss"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Portfolio Allocation Pie Chart */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              Portfolio Allocation
            </CardTitle>
            <CardDescription>
              Distribution of investments by market value
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#1e293b"
                  strokeWidth={2}
                  className="hover:scale-105 transition-transform duration-200"
                >
                  {allocationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const symbolName = label || payload[0].name || "Unknown";
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                          <div className="font-semibold text-sm mb-2 text-gray-800">
                            Symbol: {symbolName}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 text-xs">
                                Market Value:
                              </span>
                              <span className="font-medium text-xs text-gray-800">
                                {typeof payload[0].value === "number"
                                  ? formatCurrency(payload[0].value)
                                  : "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600 text-xs">
                                Percentage:
                              </span>
                              <span className="font-medium text-xs text-blue-600">
                                {payload[0].payload.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  formatter={(value, entry: any) => (
                    <span className="text-sm font-medium text-muted-foreground">
                      {value} ({entry.payload.percentage}%)
                    </span>
                  )}
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: "20px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Overview Bar Chart */}
        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Performance Overview
            </CardTitle>
            <CardDescription>Profit/Loss percentage by symbol</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={performanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                  opacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="symbol"
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={{ stroke: "#374151", strokeWidth: 1 }}
                  tickLine={{ stroke: "#374151" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9CA3AF" }}
                  axisLine={{ stroke: "#374151", strokeWidth: 1 }}
                  tickLine={{ stroke: "#374151" }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0].value;
                      if (typeof value === "number") {
                        const isPositive = value >= 0;
                        const symbolName =
                          label || payload[0].name || "Unknown";
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                            <div className="font-semibold text-sm mb-2 text-gray-800">
                              Symbol: {symbolName}
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs font-medium ${
                                  isPositive ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {isPositive ? "+" : ""}
                                {value.toFixed(2)}%
                              </span>
                              {isPositive ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                          </div>
                        );
                      }
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="P/L %"
                  radius={[4, 4, 0, 0]}
                  className="hover:opacity-80 transition-opacity duration-200"
                >
                  {performanceData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry["P/L %"] >= 0 ? "#10B981" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Normalized Price Trend */}
      <NormalizedPriceTrend portfolio={portfolio} />
    </div>
  );
}
