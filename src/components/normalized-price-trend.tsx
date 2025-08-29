"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { Portfolio } from "@/types";

interface Price {
  symbol: string;
  price: number;
  fetched_at: string;
}

interface NormalizedPricePoint {
  timestamp: string;
  slotIndex: number;
  [symbol: string]: number | string | null;
}

interface PriceAnalysis {
  symbol: string;
  minNormalized: number;
  maxNormalized: number;
  minPrice: number;
  maxPrice: number;
  minChange: number;
  maxChange: number;
  minTime: string;
  maxTime: string;
  rangeSpread: number;
}

interface NormalizedPriceTrendProps {
  portfolio?: Portfolio[];
}

export function NormalizedPriceTrend({ portfolio }: NormalizedPriceTrendProps) {
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [normalizedData, setNormalizedData] = useState<NormalizedPricePoint[]>(
    []
  );
  const [analysisData, setAnalysisData] = useState<PriceAnalysis[]>([]);
  const [dateRange, setDateRange] = useState<{
    start: Date | undefined;
    end: Date | undefined;
  }>({ start: undefined, end: undefined });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const portfolioSymbols = useMemo(
    () => portfolio?.map((p) => p.symbol) || [],
    [portfolio]
  );

  // Initialize selected symbols with all portfolio symbols
  useEffect(() => {
    if (portfolioSymbols.length > 0 && selectedSymbols.length === 0) {
      setSelectedSymbols(portfolioSymbols);
    }
  }, [portfolioSymbols, selectedSymbols.length]);

  // Fetch price history
  const fetchPriceHistory = async () => {
    if (selectedSymbols.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const symbolsParam = selectedSymbols.join(",");
      const response = await fetch(`/api/prices?symbols=${symbolsParam}`);
      const result = await response.json();

      if (result.success) {
        // Apply date range filter first, then trading hours filter (like Python)
        let filteredHistory = result.data;

        // Filter date range if specified
        if (dateRange.start && dateRange.end) {
          filteredHistory = filteredHistory.filter((price: Price) => {
            const date = new Date(price.fetched_at);
            const priceDate = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate()
            );
            const startDate = new Date(
              dateRange.start!.getFullYear(),
              dateRange.start!.getMonth(),
              dateRange.start!.getDate()
            );
            const endDate = new Date(
              dateRange.end!.getFullYear(),
              dateRange.end!.getMonth(),
              dateRange.end!.getDate()
            );
            return priceDate >= startDate && priceDate <= endDate;
          });
        }

        // Filter for trading hours (8:00 to 16:00 PKT) like Python
        filteredHistory = filteredHistory.filter((price: Price) => {
          const date = new Date(price.fetched_at);
          const hour = date.getHours();
          return hour >= 8 && hour <= 16;
        });

        normalizeData(filteredHistory);
      } else {
        setError("Failed to fetch price history");
      }
    } catch (err) {
      setError("Error fetching price history");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Normalize price data - EXACTLY like Python approach
  const normalizeData = (history: Price[]) => {
    if (history.length === 0) {
      setNormalizedData([]);
      setAnalysisData([]);
      return;
    }

    // Group by symbol and sort by time (like Python)
    const symbolGroups: { [symbol: string]: Price[] } = {};
    history.forEach((price) => {
      if (!symbolGroups[price.symbol]) {
        symbolGroups[price.symbol] = [];
      }
      symbolGroups[price.symbol].push(price);
    });

    // Sort each symbol's prices by time (like Python)
    Object.keys(symbolGroups).forEach((symbol) => {
      symbolGroups[symbol].sort(
        (a, b) =>
          new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
      );
    });

    // Apply normalization by symbol (like Python normalize_group function)
    const normalizedGroups: {
      [symbol: string]: Array<{
        timestamp: string;
        normalizedPrice: number;
        actualPrice: number;
        slotIndex: number; // Individual slot index per symbol
      }>;
    } = {};
    const analysis: PriceAnalysis[] = [];

    Object.entries(symbolGroups).forEach(([symbol, prices]) => {
      if (prices.length === 0) return;

      const firstPrice = prices[0].price;

      // Create normalized data with individual slot indices (like Python)
      const normalized = prices.map((price, index) => ({
        timestamp: price.fetched_at,
        normalizedPrice: firstPrice > 0 ? price.price / firstPrice : 1,
        actualPrice: price.price,
        slotIndex: index, // Individual slot index per symbol like Python: range(len(sym_df))
      }));

      normalizedGroups[symbol] = normalized;

      // Calculate analysis data
      if (normalized.length > 0) {
        const minPoint = normalized.reduce((min, curr) =>
          curr.normalizedPrice < min.normalizedPrice ? curr : min
        );
        const maxPoint = normalized.reduce((max, curr) =>
          curr.normalizedPrice > max.normalizedPrice ? curr : max
        );

        analysis.push({
          symbol,
          minNormalized: minPoint.normalizedPrice,
          maxNormalized: maxPoint.normalizedPrice,
          minPrice: minPoint.actualPrice,
          maxPrice: maxPoint.actualPrice,
          minChange: (minPoint.normalizedPrice - 1) * 100,
          maxChange: (maxPoint.normalizedPrice - 1) * 100,
          minTime: format(new Date(minPoint.timestamp), "MMM dd HH:mm"),
          maxTime: format(new Date(maxPoint.timestamp), "MMM dd HH:mm"),
          rangeSpread:
            (maxPoint.normalizedPrice - minPoint.normalizedPrice) * 100,
        });
      }
    });

    // Create unified time slots for X-axis labels (like Python all_slots approach)
    const allTimestamps = Array.from(
      new Set(history.map((p) => p.fetched_at))
    ).sort();

    // Create unified chart data structure (like Python)
    const chartData: NormalizedPricePoint[] = [];

    // Create data points for each timestamp
    allTimestamps.forEach((timestamp, globalIndex) => {
      const point: NormalizedPricePoint = {
        timestamp,
        slotIndex: globalIndex, // Global slot index for X-axis
      };

      // For each symbol, get the normalized price at this timestamp
      selectedSymbols.forEach((symbol) => {
        const symbolData = normalizedGroups[symbol];
        if (symbolData) {
          const dataPoint = symbolData.find((d) => d.timestamp === timestamp);
          point[symbol] = dataPoint ? dataPoint.normalizedPrice : null;
        } else {
          point[symbol] = null;
        }
      });

      chartData.push(point);
    });

    setNormalizedData(chartData);
    setAnalysisData(analysis);
  };

  // Effect to fetch data when symbols or date range change
  useEffect(() => {
    if (selectedSymbols.length > 0) {
      fetchPriceHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbols, dateRange]);

  // Set default date range to last 7 days
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    setDateRange({
      start: start,
      end: end,
    });
  }, []);

  const toggleSymbol = (symbol: string) => {
    setSelectedSymbols((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      dataKey: string;
      value: number | null;
      color: string;
    }>;
    label?: number;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length && typeof label === "number") {
      const dataPoint = normalizedData[label];
      const timestamp = dataPoint?.timestamp;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">
            {timestamp
              ? format(new Date(timestamp), "MMM dd HH:mm")
              : `Slot ${label}`}
          </p>
          {payload
            .filter((pld) => pld.value !== null && pld.value !== undefined)
            .map((pld, index: number) => (
              <p key={index} style={{ color: pld.color }} className="text-sm">
                <span className="font-medium">{pld.dataKey}:</span>{" "}
                {pld.value?.toFixed(3) || "N/A"}
              </p>
            ))}
        </div>
      );
    }
    return null;
  };

  const CHART_COLORS = [
    "#1E88E5", // Blue
    "#00E396", // Green
    "#FEB019", // Orange
    "#FF4560", // Red
    "#775DD0", // Purple
    "#00C49F", // Teal
    "#FFBB28", // Yellow
    "#FF8042", // Orange-Red
    "#8884D8", // Light Purple
    "#82CA9D", // Light Green
    "#FFC658", // Light Orange
    "#FF7C7C", // Light Red
    "#36B9CC", // Cyan
    "#E91E63", // Pink
    "#9C27B0", // Deep Purple
    "#673AB7", // Indigo
    "#3F51B5", // Deep Blue
    "#2196F3", // Light Blue
    "#03DAC6", // Teal Accent
    "#FF9800", // Deep Orange
    "#FF5722", // Red-Orange
    "#795548", // Brown
    "#607D8B", // Blue Grey
    "#4CAF50", // Light Green
  ];

  if (!portfolio || portfolio.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Normalized Price Trend (Compare Symbols)</CardTitle>
          <CardDescription>
            No portfolio data available for price comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Add some trades to see price trends.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Normalized Price Trend (Compare Symbols)</CardTitle>
          <CardDescription>
            Compare price movements relative to starting point (1.0 = 0% change)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Symbol Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Select Symbols to Compare
            </Label>
            <div className="flex flex-wrap gap-2">
              {portfolioSymbols.map((symbol) => (
                <Badge
                  key={symbol}
                  variant={
                    selectedSymbols.includes(symbol) ? "default" : "outline"
                  }
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleSymbol(symbol)}
                >
                  {symbol}
                  {selectedSymbols.includes(symbol) && (
                    <span className="ml-1">✕</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <DatePicker
                date={dateRange.start}
                onDateChange={(date) =>
                  setDateRange((prev) => ({ ...prev, start: date }))
                }
                placeholder="Select start date"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <DatePicker
                date={dateRange.end}
                onDateChange={(date) =>
                  setDateRange((prev) => ({ ...prev, end: date }))
                }
                placeholder="Select end date"
              />
            </div>
          </div>

          {/* Chart */}
          {loading ? (
            <div className="h-96 bg-muted animate-pulse rounded flex items-center justify-center">
              <p className="text-muted-foreground">Loading price data...</p>
            </div>
          ) : error ? (
            <div className="h-96 bg-destructive/10 rounded flex items-center justify-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : normalizedData.length > 0 ? (
            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={normalizedData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis
                    dataKey="slotIndex"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(slotIndex) => {
                      // Use unified time-based labels like Python all_slots approach
                      const allTimestamps = Array.from(
                        new Set(normalizedData.map((p) => p.timestamp))
                      ).sort();

                      if (slotIndex < allTimestamps.length) {
                        return format(
                          new Date(allTimestamps[slotIndex]),
                          "MMM dd\nHH:mm"
                        );
                      }
                      return "";
                    }}
                    interval={Math.max(
                      1,
                      Math.floor(normalizedData.length / 10)
                    )}
                    angle={-30}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    domain={["dataMin - 0.01", "dataMax + 0.01"]}
                    tickFormatter={(value) => value.toFixed(2)}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {selectedSymbols.map((symbol, index) => (
                    <Line
                      key={symbol}
                      type="monotone"
                      dataKey={symbol}
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, opacity: 0.8 }}
                      connectNulls={true}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 bg-muted/50 rounded flex items-center justify-center">
              <p className="text-muted-foreground">
                No price data available for selected date range
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            *Shows trading hours only (8am–4pm). Normalized to starting price
            (1.0 = 0% change)*
          </p>
        </CardContent>
      </Card>

      {/* Price Range Analysis Table */}
      {analysisData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Price Range Analysis
            </CardTitle>
            <CardDescription>
              Minimum and maximum normalized prices reached by each symbol
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Min Norm.</TableHead>
                  <TableHead className="text-right">Min Price</TableHead>
                  <TableHead className="text-right">Min %</TableHead>
                  <TableHead className="text-right">Min Time</TableHead>
                  <TableHead className="text-right">Max Norm.</TableHead>
                  <TableHead className="text-right">Max Price</TableHead>
                  <TableHead className="text-right">Max %</TableHead>
                  <TableHead className="text-right">Max Time</TableHead>
                  <TableHead className="text-right">Range</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysisData.map((analysis) => (
                  <TableRow key={analysis.symbol}>
                    <TableCell className="font-medium">
                      {analysis.symbol}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {analysis.minNormalized.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(analysis.minPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "font-mono font-medium",
                          analysis.minChange > 0
                            ? "text-green-600 dark:text-green-400"
                            : analysis.minChange < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {analysis.minChange > 0 ? "+" : ""}
                        {analysis.minChange.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {analysis.minTime}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {analysis.maxNormalized.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(analysis.maxPrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "font-mono font-medium",
                          analysis.maxChange > 0
                            ? "text-green-600 dark:text-green-400"
                            : analysis.maxChange < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {analysis.maxChange > 0 ? "+" : ""}
                        {analysis.maxChange.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {analysis.maxTime}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {analysis.rangeSpread.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Quick Insights */}
            {analysisData.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Quick Insights
                </h4>
                <div className="grid gap-3 md:grid-cols-3">
                  {(() => {
                    const bestPeak = analysisData.reduce((prev, curr) =>
                      curr.maxChange > prev.maxChange ? curr : prev
                    );
                    const worstDip = analysisData.reduce((prev, curr) =>
                      curr.minChange < prev.minChange ? curr : prev
                    );
                    const mostVolatile = analysisData.reduce((prev, curr) =>
                      curr.rangeSpread > prev.rangeSpread ? curr : prev
                    );

                    return (
                      <>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            🚀 Best Peak: {bestPeak.symbol} reached{" "}
                            {bestPeak.maxChange > 0 ? "+" : ""}
                            {bestPeak.maxChange.toFixed(1)}% at{" "}
                            {bestPeak.maxTime}
                          </p>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                          <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                            📉 Lowest Dip: {worstDip.symbol} dropped to{" "}
                            {worstDip.minChange.toFixed(1)}% at{" "}
                            {worstDip.minTime}
                          </p>
                        </div>
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
                            ⚡ Most Volatile: {mostVolatile.symbol} with{" "}
                            {mostVolatile.rangeSpread.toFixed(1)}% range
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-4">
              *All percentages are relative to the starting price (1.0 = 0%
              change)*
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
