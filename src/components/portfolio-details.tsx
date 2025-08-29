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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Portfolio } from "@/types";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Download, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";

interface PortfolioDetailsProps {
  portfolio?: Portfolio[];
}

export function PortfolioDetails({ portfolio }: PortfolioDetailsProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Portfolio | null;
    direction: "asc" | "desc";
  }>({ key: "market_value", direction: "desc" });

  if (!portfolio) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Holdings</CardTitle>
          <CardDescription>Loading portfolio data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-muted animate-pulse rounded"
              ></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (portfolio.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Holdings</CardTitle>
          <CardDescription>
            No holdings found. Add some trades to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Your portfolio is empty.</p>
            <p className="text-sm mt-2">
              Use the sidebar to log your first trade.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSort = (key: keyof Portfolio) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedPortfolio = useMemo(() => {
    if (!sortConfig.key) return portfolio;

    return [...portfolio].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle numeric values
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      // Handle string values
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [portfolio, sortConfig]);

  const downloadCSV = () => {
    const headers = [
      "Symbol",
      "Shares Held",
      "Avg Buy Price",
      "Latest Price",
      "Change %",
      "Market Value",
      "Investment",
      "% Up/Down",
      "Unrealized P/L",
      "Last Update",
    ];

    const csvData = [
      headers.join(","),
      ...portfolio.map((row) =>
        [
          row.symbol,
          row.shares_held,
          row.avg_buy_price.toFixed(2),
          row.latest_price?.toFixed(2) || "",
          row.change_percentage || "",
          row.market_value.toFixed(2),
          row.investment.toFixed(2),
          row.percent_updown.toFixed(2),
          row.unrealized_pl.toFixed(2),
          row.last_update ? format(new Date(row.last_update), "PPpp") : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "psx_portfolio.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Holdings</CardTitle>
            <CardDescription>
              Your current stock positions and performance
            </CardDescription>
          </div>
          <Button variant="outline" onClick={downloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className={`cursor-pointer hover:bg-muted/50 ${
                  sortConfig.key === "symbol" ? "bg-muted/50" : ""
                }`}
                onClick={() => handleSort("symbol")}
              >
                <div className="flex items-center space-x-1">
                  <span>Symbol</span>
                  {sortConfig.key === "symbol" ? (
                    <span className="text-primary">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className={`text-right cursor-pointer hover:bg-muted/50 ${
                  sortConfig.key === "shares_held" ? "bg-muted/50" : ""
                }`}
                onClick={() => handleSort("shares_held")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Shares</span>
                  {sortConfig.key === "shares_held" ? (
                    <span className="text-primary">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className={`text-right cursor-pointer hover:bg-muted/50 ${
                  sortConfig.key === "avg_buy_price" ? "bg-muted/50" : ""
                }`}
                onClick={() => handleSort("avg_buy_price")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Avg Buy</span>
                  {sortConfig.key === "avg_buy_price" ? (
                    <span className="text-primary">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className={`text-right cursor-pointer hover:bg-muted/50 ${
                  sortConfig.key === "latest_price" ? "bg-muted/50" : ""
                }`}
                onClick={() => handleSort("latest_price")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Latest Price</span>
                  {sortConfig.key === "latest_price" ? (
                    <span className="text-primary">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className={`text-right cursor-pointer hover:bg-muted/50 ${
                  sortConfig.key === "change_percentage" ? "bg-muted/50" : ""
                }`}
                onClick={() => handleSort("change_percentage")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Change %</span>
                  {sortConfig.key === "change_percentage" ? (
                    <span className="text-primary">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className={`text-right cursor-pointer hover:bg-muted/50 ${
                  sortConfig.key === "market_value" ? "bg-muted/50" : ""
                }`}
                onClick={() => handleSort("market_value")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Market Value</span>
                  {sortConfig.key === "market_value" ? (
                    <span className="text-primary">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className={`text-right cursor-pointer hover:bg-muted/50 ${
                  sortConfig.key === "percent_updown" ? "bg-muted/50" : ""
                }`}
                onClick={() => handleSort("percent_updown")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>% Up/Down</span>
                  {sortConfig.key === "percent_updown" ? (
                    <span className="text-primary">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead
                className={`text-right cursor-pointer hover:bg-muted/50 ${
                  sortConfig.key === "unrealized_pl" ? "bg-muted/50" : ""
                }`}
                onClick={() => handleSort("unrealized_pl")}
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Unrealized P/L</span>
                  {sortConfig.key === "unrealized_pl" ? (
                    <span className="text-primary">
                      {sortConfig.direction === "asc" ? "↑" : "↓"}
                    </span>
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="text-right">Last Update</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPortfolio.map((holding) => (
              <TableRow key={holding.symbol} className="hover:bg-muted/25">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{holding.symbol}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {holding.shares_held.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(holding.avg_buy_price)}
                </TableCell>
                <TableCell className="text-right">
                  {holding.latest_price ? (
                    formatCurrency(holding.latest_price)
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {holding.change_percentage ? (
                    <div
                      className={cn(
                        "flex items-center justify-end gap-1 font-medium",
                        holding.change_percentage.startsWith("+")
                          ? "text-green-600"
                          : holding.change_percentage.startsWith("-")
                          ? "text-red-600"
                          : "text-muted-foreground"
                      )}
                    >
                      {holding.change_percentage.startsWith("+") ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : holding.change_percentage.startsWith("-") ? (
                        <TrendingDown className="h-4 w-4" />
                      ) : null}
                      {holding.change_percentage}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(holding.market_value)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-medium",
                      holding.percent_updown > 0
                        ? "text-green-600"
                        : holding.percent_updown < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {holding.percent_updown > 0 ? "+" : ""}
                    {formatPercentage(holding.percent_updown)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-medium",
                      holding.unrealized_pl > 0
                        ? "text-green-600"
                        : holding.unrealized_pl < 0
                        ? "text-red-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {holding.unrealized_pl > 0 ? "+" : ""}
                    {formatCurrency(holding.unrealized_pl)}
                  </span>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {holding.last_update
                    ? format(new Date(holding.last_update), "MMM dd HH:mm")
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
