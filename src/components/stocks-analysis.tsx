"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Building2,
  Target,
  X,
  LineChart,
  PieChart,
  Activity,
  Loader2,
  Info,
  ArrowUpDown,
} from "lucide-react";
import { useStockPerformance } from "@/lib/hooks/useStockPerformance";
import { useStockData, useStocksList } from "@/lib/hooks/useStockData";
import { usePortfolioSymbols } from "@/lib/hooks/usePortfolioSymbols";

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
}

interface FinancialData {
  period: string;
  revenue: number;
  profit: number;
  eps: number;
  peRatio: number;
}

export function StocksAnalysis() {
  const [selectedDays, setSelectedDays] = useState("7");
  const [stockSource, setStockSource] = useState("both");
  const [selectedStock, setSelectedStock] = useState("");
  const [compareStocks, setCompareStocks] = useState<string[]>([]);
  const [showPerformance, setShowPerformance] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Reset selections when stock source changes
  const handleStockSourceChange = (newSource: string) => {
    setStockSource(newSource);
    setSelectedStock("");
    setCompareStocks([]);
    setShowPerformance(false);
    setShowAnalytics(false);
    setShowComparison(false);
    setSortConfig(null);
  };

  // Fetch real data
  const { symbols: portfolioSymbols, error: portfolioError } =
    usePortfolioSymbols();
  const {
    symbols: systemStocks,
    isLoading: stocksLoading,
    error: stocksError,
  } = useStocksList();

  // Get available symbols based on source
  const availableSymbols = useMemo(() => {
    if (stockSource === "portfolio") return portfolioSymbols || [];
    if (stockSource === "system") return systemStocks || [];
    if (stockSource === "both")
      return [
        ...new Set([...(portfolioSymbols || []), ...(systemStocks || [])]),
      ];
    return [];
  }, [stockSource, portfolioSymbols, systemStocks]);

  // Helper function to calculate net change from daily values
  const calculateNetChange = (stock: any): number => {
    const dateKeys = Object.keys(stock).filter(
      (key) => key !== "Symbol" && !key.startsWith("Net Change")
    );

    let totalChange = 0;
    let validCount = 0;

    dateKeys.forEach((dateKey) => {
      const value = stock[dateKey];
      if (value !== null && value !== undefined && !isNaN(value)) {
        totalChange += value;
        validCount++;
      }
    });

    return validCount > 0 ? totalChange : 0;
  };

  // Performance analysis
  const {
    data: performanceData,
    isLoading: performanceLoading,
    error: performanceError,
  } = useStockPerformance({
    symbols: availableSymbols,
    days: parseInt(selectedDays),
    source: stockSource,
    enabled: showPerformance && availableSymbols.length > 0,
  });

  // Individual stock data for analytics
  const { data: stockData, isLoading: stockDataLoading } = useStockData(
    selectedStock,
    showAnalytics && selectedStock && availableSymbols.includes(selectedStock)
  );

  const handleAddCompareStock = (stock: string) => {
    if (!compareStocks.includes(stock) && availableSymbols.includes(stock)) {
      setCompareStocks([...compareStocks, stock]);
    }
  };

  const handleRemoveCompareStock = (stock: string) => {
    setCompareStocks(compareStocks.filter((s: string) => s !== stock));
  };

  // Sorting function for performance table
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sort performance data
  const sortedPerformanceData = useMemo(() => {
    if (!sortConfig || !performanceData) return performanceData;

    return [...performanceData].sort((a, b) => {
      let aValue: any = a[sortConfig.key];
      let bValue: any = b[sortConfig.key];

      // Handle special cases
      if (sortConfig.key === "Symbol") {
        aValue = a.Symbol || "";
        bValue = b.Symbol || "";
      } else if (sortConfig.key === "Net Change") {
        aValue = calculateNetChange(a);
        bValue = calculateNetChange(b);
      }

      // Convert to numbers for numeric sorting
      if (typeof aValue === "string") aValue = parseFloat(aValue) || 0;
      if (typeof bValue === "string") bValue = parseFloat(bValue) || 0;

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [performanceData, sortConfig, selectedDays]);

  const formatPercentage = (value: number) => {
    const color = value >= 0 ? "text-green-600" : "text-red-600";
    const icon =
      value >= 0 ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      );
    return (
      <span className={`flex items-center gap-1 ${color}`}>
        {icon}
        {value >= 0 ? "+" : ""}
        {value.toFixed(1)}%
      </span>
    );
  };

  // Stock scoring functions (same logic as Python)
  function calculateStockScore(stockData: any): number {
    let score = 0;

    // EPS Growth
    if (stockData.ratios && stockData.ratios.length > 0) {
      const epsGrowthValues = stockData.ratios
        .map((ratio: any) =>
          parseFloat(ratio["EPS Growth (%)"]?.replace(/[^\d.-]/g, "") || "0")
        )
        .filter((val: number) => !isNaN(val));

      if (epsGrowthValues.length > 0) {
        const avgEpsGrowth =
          epsGrowthValues.reduce((sum: number, val: number) => sum + val, 0) /
          epsGrowthValues.length;
        if (avgEpsGrowth > 20) score += 2;
        else if (avgEpsGrowth > 5) score += 1;
      }
    }

    // Net Profit Margin
    if (stockData.ratios && stockData.ratios.length > 0) {
      const marginValues = stockData.ratios
        .map((ratio: any) =>
          parseFloat(
            ratio["Net Profit Margin (%)"]?.replace(/[^\d.-]/g, "") || "0"
          )
        )
        .filter((val: number) => !isNaN(val));

      if (marginValues.length > 0) {
        const avgMargin =
          marginValues.reduce((sum: number, val: number) => sum + val, 0) /
          marginValues.length;
        if (avgMargin > 15) score += 2;
        else if (avgMargin > 8) score += 1;
      }
    }

    // PEG Ratio
    if (stockData.ratios && stockData.ratios.length > 0) {
      const pegValues = stockData.ratios
        .map((ratio: any) =>
          parseFloat(ratio.PEG?.replace(/[^\d.-]/g, "") || "0")
        )
        .filter((val: number) => !isNaN(val));

      if (pegValues.length > 0) {
        const avgPeg =
          pegValues.reduce((sum: number, val: number) => sum + val, 0) /
          pegValues.length;
        if (avgPeg < 1) score += 2;
        else if (avgPeg < 2) score += 1;
      }
    }

    // Dividend Consistency
    if (stockData.payouts && stockData.payouts.length > 0) {
      if (stockData.payouts.length >= 4) score += 2;
      else if (stockData.payouts.length >= 2) score += 1;
    }

    // Recent EPS/Profit Growth
    if (
      stockData.financials?.annual &&
      stockData.financials.annual.length >= 2
    ) {
      const epsValues = stockData.financials.annual
        .map((fin: any) => parseFloat(fin.EPS?.replace(/[^\d.-]/g, "") || "0"))
        .filter((val: number) => !isNaN(val));

      if (
        epsValues.length >= 2 &&
        epsValues[epsValues.length - 1] > epsValues[epsValues.length - 2]
      ) {
        score += 1;
      }
    }

    return Math.min(score, 10);
  }

  function getStockScoreReasons(stockData: any): string[] {
    const reasons: string[] = [];

    // EPS Growth
    if (stockData.ratios && stockData.ratios.length > 0) {
      const epsGrowthValues = stockData.ratios
        .map((ratio: any) =>
          parseFloat(ratio["EPS Growth (%)"]?.replace(/[^\d.-]/g, "") || "0")
        )
        .filter((val: number) => !isNaN(val));

      if (epsGrowthValues.length > 0) {
        const avgEpsGrowth =
          epsGrowthValues.reduce((sum: number, val: number) => sum + val, 0) /
          epsGrowthValues.length;
        if (avgEpsGrowth > 20) reasons.push("✅ Strong EPS growth");
        else if (avgEpsGrowth > 5) reasons.push("✅ Moderate EPS growth");
        else reasons.push("⚠️ Low EPS growth");
      }
    }

    // Net Profit Margin
    if (stockData.ratios && stockData.ratios.length > 0) {
      const marginValues = stockData.ratios
        .map((ratio: any) =>
          parseFloat(
            ratio["Net Profit Margin (%)"]?.replace(/[^\d.-]/g, "") || "0"
          )
        )
        .filter((val: number) => !isNaN(val));

      if (marginValues.length > 0) {
        const avgMargin =
          marginValues.reduce((sum: number, val: number) => sum + val, 0) /
          marginValues.length;
        if (avgMargin > 15) reasons.push("✅ High profit margin");
        else if (avgMargin > 8) reasons.push("✅ Moderate profit margin");
        else reasons.push("⚠️ Low profit margin");
      }
    }

    // PEG Ratio
    if (stockData.ratios && stockData.ratios.length > 0) {
      const pegValues = stockData.ratios
        .map((ratio: any) =>
          parseFloat(ratio.PEG?.replace(/[^\d.-]/g, "") || "0")
        )
        .filter((val: number) => !isNaN(val));

      if (pegValues.length > 0) {
        const avgPeg =
          pegValues.reduce((sum: number, val: number) => sum + val, 0) /
          pegValues.length;
        if (avgPeg < 1) reasons.push("✅ Attractive PEG ratio (<1)");
        else if (avgPeg < 2) reasons.push("✅ Fair PEG ratio (<2)");
        else reasons.push("⚠️ High PEG ratio");
      }
    }

    // Dividend Consistency
    if (stockData.payouts && stockData.payouts.length > 0) {
      if (stockData.payouts.length >= 4)
        reasons.push("✅ Consistent dividend payouts");
      else if (stockData.payouts.length >= 2)
        reasons.push("✅ Some dividend payouts");
      else reasons.push("⚠️ Few or no dividends");
    }

    // Recent EPS/Profit Growth
    if (
      stockData.financials?.annual &&
      stockData.financials.annual.length >= 2
    ) {
      const epsValues = stockData.financials.annual
        .map((fin: any) => parseFloat(fin.EPS?.replace(/[^\d.-]/g, "") || "0"))
        .filter((val: number) => !isNaN(val));

      if (
        epsValues.length >= 2 &&
        epsValues[epsValues.length - 1] > epsValues[epsValues.length - 2]
      ) {
        reasons.push("✅ Recent EPS growth");
      }
    }

    return reasons;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Stocks Analysis</h2>
          <p className="text-muted-foreground">
            Comprehensive stock analysis and comparison tools
          </p>
        </div>
      </div>

      {/* Stock Performance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stock Performance Analysis
          </CardTitle>
          <CardDescription>
            Analyze stock performance over the last 7 trading days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stocksLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Loading available stocks...</span>
            </div>
          ) : availableSymbols.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {stockSource === "portfolio" &&
                "No portfolio stocks available. Add some trades first."}
              {stockSource === "system" &&
                "No system stocks available. Add some stocks first."}
              {stockSource === "both" &&
                "No stocks available. Add some trades or stocks first."}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="days">Number of Days</Label>
                  <Select value={selectedDays} onValueChange={setSelectedDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="5">5 Days</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source">Stock Source</Label>
                  <Select
                    value={stockSource}
                    onValueChange={handleStockSourceChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portfolio">
                        Portfolio Stocks
                      </SelectItem>
                      <SelectItem value="system">System Stocks</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <Button
                    onClick={() => setShowPerformance(!showPerformance)}
                    className="w-full"
                    disabled={availableSymbols.length === 0}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyze Performance
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                Available symbols: {availableSymbols.length}
                {portfolioError && " (Portfolio error)"}
                {stocksError && " (System error)"}
              </div>
            </>
          )}

          {showPerformance && (
            <div className="mt-6">
              {performanceLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading performance data...</span>
                </div>
              ) : performanceError ? (
                <div className="text-red-500 text-center py-4">
                  <div className="font-semibold mb-2">
                    Error loading performance data
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {performanceError.message || "Unknown error occurred"}
                  </div>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              ) : performanceData && performanceData.length > 0 ? (
                <>
                  {/* Info bar */}
                  <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-blue-200">
                      <Info className="h-4 w-4" />
                      <span>
                        Analyzing {performanceData.length} symbols from{" "}
                        {stockSource === "portfolio"
                          ? "portfolio stocks"
                          : stockSource === "system"
                          ? "system stocks"
                          : "both"}{" "}
                        for the last {selectedDays} trading days.
                      </span>
                    </div>
                  </div>

                  {/* Sorting instructions */}
                  <div className="text-sm text-muted-foreground mb-3">
                    💡 <strong>Tip:</strong> Click any column header to sort.
                    Net Change is calculated as the sum of all available daily
                    percentage changes.
                  </div>

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th
                            className="text-left p-2 cursor-pointer hover:bg-muted/50 select-none transition-colors"
                            onClick={() => handleSort("Symbol")}
                          >
                            <div className="flex items-center gap-1 group">
                              <span className="group-hover:text-primary">
                                Symbol
                              </span>
                              <ArrowUpDown className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                              {sortConfig?.key === "Symbol" && (
                                <span className="text-xs text-primary font-bold">
                                  {sortConfig.direction === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                          {Object.keys(sortedPerformanceData[0] || {})
                            .filter(
                              (key) =>
                                key !== "Symbol" &&
                                !key.startsWith("Net Change")
                            )
                            .map((dateKey) => (
                              <th
                                key={dateKey}
                                className="text-center p-2 cursor-pointer hover:bg-muted/50 select-none transition-colors"
                                onClick={() => handleSort(dateKey)}
                              >
                                <div className="flex items-center gap-1 group">
                                  <span className="group-hover:text-primary">
                                    {dateKey}
                                  </span>
                                  <ArrowUpDown className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                  {sortConfig?.key === dateKey && (
                                    <span className="text-xs text-primary font-bold">
                                      {sortConfig.direction === "asc"
                                        ? "↑"
                                        : "↓"}
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}
                          <th
                            className="text-center p-2 font-semibold cursor-pointer hover:bg-muted/50 select-none transition-colors"
                            onClick={() => handleSort("Net Change")}
                          >
                            <div className="flex items-center gap-1 group">
                              <span className="group-hover:text-primary">
                                Net Change ({selectedDays}d)
                              </span>
                              <ArrowUpDown className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                              {sortConfig?.key === "Net Change" && (
                                <span className="text-xs text-primary font-bold">
                                  {sortConfig.direction === "asc" ? "↑" : "↓"}
                                </span>
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPerformanceData.map((stock: any) => (
                          <tr
                            key={stock.Symbol}
                            className="border-b hover:bg-muted/50"
                          >
                            <td className="p-2 font-medium">{stock.Symbol}</td>
                            {Object.keys(stock)
                              .filter(
                                (key) =>
                                  key !== "Symbol" &&
                                  !key.startsWith("Net Change")
                              )
                              .map((dateKey) => {
                                const value = stock[dateKey];
                                return (
                                  <td key={dateKey} className="text-center p-2">
                                    {value !== null && value !== undefined
                                      ? formatPercentage(value)
                                      : "-"}
                                  </td>
                                );
                              })}
                            <td className="text-center p-2 font-semibold">
                              {(() => {
                                const netChange = calculateNetChange(stock);
                                return netChange !== 0
                                  ? formatPercentage(netChange)
                                  : "-";
                              })()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="mt-4 text-xs text-muted-foreground">
                    🟢 Positive | 🔴 Negative | ⚪ No Change | - No Data
                  </div>

                  {/* Footer text */}
                  <div className="mt-2 text-xs text-muted-foreground">
                    Shows the last {selectedDays} trading days of price data
                    with daily percentage changes from{" "}
                    {stockSource === "portfolio"
                      ? "portfolio stocks"
                      : stockSource === "system"
                      ? "system stocks"
                      : "both"}
                    .
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No performance data available for the selected criteria.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Stock Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Single Stock Analytics
          </CardTitle>
          <CardDescription>
            Detailed analysis of individual stock performance and fundamentals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableSymbols.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No stocks available for analysis. Please add some stocks or trades
              first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Select Stock for Analysis</Label>
                <Select value={selectedStock} onValueChange={setSelectedStock}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a stock..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSymbols.map((stock: string) => (
                      <SelectItem key={stock} value={stock}>
                        {stock}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="w-full"
                  disabled={!selectedStock}
                >
                  <LineChart className="h-4 w-4 mr-2" />
                  Show Analytics
                </Button>
              </div>
            </div>
          )}

          {showAnalytics && selectedStock && (
            <div className="mt-6 space-y-6">
              {stockDataLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading stock data...</span>
                </div>
              ) : stockData && Object.keys(stockData).length > 0 ? (
                <>
                  {/* Financials */}
                  {stockData.financials?.annual &&
                    Array.isArray(stockData.financials.annual) &&
                    stockData.financials.annual.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold mb-3">
                          Financials (Annual)
                        </h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Click column headers to sort. Numbers are shown in
                          millions (M), billions (B), or trillions (T) for
                          readability.
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Period</th>
                                <th className="text-right p-2">
                                  Mark-up Earned
                                </th>
                                <th className="text-right p-2">Total Income</th>
                                <th className="text-right p-2">
                                  Profit after Taxation
                                </th>
                                <th className="text-right p-2">EPS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {stockData.financials.annual.map(
                                (data: any, index: number) => (
                                  <tr
                                    key={index}
                                    className="border-b hover:bg-muted/50"
                                  >
                                    <td className="p-2 font-medium">
                                      {data.period}
                                    </td>
                                    <td className="text-right p-2">
                                      {data["Mark-up Earned"] &&
                                      typeof data["Mark-up Earned"] === "string"
                                        ? `Rs. ${parseFloat(
                                            data["Mark-up Earned"].replace(
                                              /,/g,
                                              ""
                                            )
                                          ).toLocaleString()}`
                                        : "-"}
                                    </td>
                                    <td className="text-right p-2">
                                      {data["Total Income"] &&
                                      typeof data["Total Income"] === "string"
                                        ? `Rs. ${parseFloat(
                                            data["Total Income"].replace(
                                              /,/g,
                                              ""
                                            )
                                          ).toLocaleString()}`
                                        : "-"}
                                    </td>
                                    <td className="text-right p-2">
                                      {data["Profit after Taxation"] &&
                                      typeof data["Profit after Taxation"] ===
                                        "string"
                                        ? `Rs. ${parseFloat(
                                            data[
                                              "Profit after Taxation"
                                            ].replace(/,/g, "")
                                          ).toLocaleString()}`
                                        : "-"}
                                    </td>
                                    <td className="text-right p-2">
                                      {data.EPS || "-"}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                  {/* Payouts */}
                  {stockData.payouts && stockData.payouts.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3">
                        Dividend Payouts
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">
                                Financial Results
                              </th>
                              <th className="text-left p-2">Details</th>
                              <th className="text-left p-2">
                                Entitlement Date
                              </th>
                              <th className="text-left p-2">Payment Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockData.payouts.map(
                              (payout: any, index: number) => (
                                <tr
                                  key={index}
                                  className="border-b hover:bg-muted/50"
                                >
                                  <td className="p-2">
                                    {payout["Financial Results"] || "-"}
                                  </td>
                                  <td className="p-2">
                                    {payout.Details || "-"}
                                  </td>
                                  <td className="p-2">
                                    {payout["Entitlement Date"] || "-"}
                                  </td>
                                  <td className="p-2">
                                    {payout["Payment Date"] || "-"}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Ratios */}
                  {stockData.ratios && stockData.ratios.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold mb-3">Key Ratios</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Period</th>
                              <th className="text-right p-2">EPS Growth (%)</th>
                              <th className="text-right p-2">
                                Net Profit Margin (%)
                              </th>
                              <th className="text-right p-2">PEG</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockData.ratios.map(
                              (ratio: any, index: number) => (
                                <tr
                                  key={index}
                                  className="border-b hover:bg-muted/50"
                                >
                                  <td className="p-2 font-medium">
                                    {ratio.period}
                                  </td>
                                  <td className="text-right p-2">
                                    {ratio["EPS Growth (%)"] || "-"}
                                  </td>
                                  <td className="text-right p-2">
                                    {ratio["Net Profit Margin (%)"] || "-"}
                                  </td>
                                  <td className="p-2 text-right">
                                    {ratio.PEG || "-"}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Stock Score */}
                  <div>
                    <h4 className="text-lg font-semibold mb-3">
                      Stock Score (out of 10)
                    </h4>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {calculateStockScore(stockData)}/10
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {getStockScoreReasons(stockData).map(
                          (reason, index) => (
                            <div key={index}>{reason}</div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No stock data available for {selectedStock}.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-Stock Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Multi-Stock Comparison
          </CardTitle>
          <CardDescription>
            Compare multiple stocks across various metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableSymbols.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No stocks available for comparison. Please add some stocks or
              trades first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compare">Select Stocks to Compare</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {compareStocks.map((stock) => (
                    <Badge key={stock} variant="secondary" className="gap-1">
                      {stock}
                      <button
                        onClick={() => handleRemoveCompareStock(stock)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Select onValueChange={handleAddCompareStock}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add stocks to compare..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSymbols
                      .filter((stock: string) => !compareStocks.includes(stock))
                      .map((stock: string) => (
                        <SelectItem key={stock} value={stock}>
                          {stock}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>&nbsp;</Label>
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  className="w-full"
                  disabled={compareStocks.length < 2}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Compare
                </Button>
              </div>
            </div>
          )}

          {showComparison && compareStocks.length >= 2 && (
            <div className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Metric</th>
                      {compareStocks.map((stock) => (
                        <th key={stock} className="text-center p-2">
                          {stock}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Current Price</td>
                      {compareStocks.map((stock) => (
                        <td key={stock} className="text-center p-2">
                          Rs. 150.25
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">P/E Ratio</td>
                      {compareStocks.map((stock) => (
                        <td key={stock} className="text-center p-2">
                          15.2
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Market Cap</td>
                      {compareStocks.map((stock) => (
                        <td key={stock} className="text-center p-2">
                          Rs. 45.2B
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">Dividend Yield</td>
                      {compareStocks.map((stock) => (
                        <td key={stock} className="text-center p-2">
                          4.2%
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
