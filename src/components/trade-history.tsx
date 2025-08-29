"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTrades, useStocks, usePrices, api } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Trade } from "@/types";
import { format } from "date-fns";
import {
  Filter,
  Download,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
} from "lucide-react";

export function TradeHistory() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("All");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Trade | null;
    direction: "asc" | "desc";
  }>({ key: null, direction: "asc" });

  const { stocks } = useStocks(true);
  const { trades, loading, error, mutate } = useTrades(
    selectedSymbol !== "All" ? selectedSymbol : undefined,
    startDate?.toISOString().split("T")[0] || undefined,
    endDate?.toISOString().split("T")[0] || undefined
  );
  const { prices } = usePrices();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tradeToDelete, setTradeToDelete] = useState<string | null>(null);

  // Calculate percentage change and P/L amount for trades (like Python implementation)
  const tradesWithCalculations = useMemo(() => {
    if (!trades || !prices) return [];

    return trades.map((trade) => {
      // Find latest price for this symbol
      const symbolPrices = prices.filter((p) => p.symbol === trade.symbol);
      const latestPrice =
        symbolPrices.length > 0
          ? symbolPrices.reduce((latest, current) =>
              new Date(current.fetched_at) > new Date(latest.fetched_at)
                ? current
                : latest
            ).price
          : trade.price;

      // Calculate percentage change
      const percentageChange = (
        ((latestPrice - trade.price) / trade.price) *
        100
      ).toFixed(2);

      // Calculate P/L amount
      let plAmount: number;
      if (trade.trade_type === "Buy") {
        plAmount = (latestPrice - trade.price) * trade.quantity;
      } else {
        plAmount = (trade.price - latestPrice) * trade.quantity;
      }

      return {
        ...trade,
        percentage_change: percentageChange,
        pl_amount: plAmount.toFixed(2),
      };
    });
  }, [trades, prices]);

  const stockSymbols = stocks?.map((s) => s.symbol) || [];

  // Set default date range to last 30 days
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    setStartDate(start);
    setEndDate(end);
  }, []);

  const handleDeleteTrade = async (tradeId: string) => {
    setTradeToDelete(tradeId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTrade = async () => {
    if (!tradeToDelete) return;

    try {
      await api.deleteTrade(tradeToDelete);
      mutate();

      // Show success toast
      toast({
        title: "Trade Deleted",
        description: "Trade has been removed successfully.",
        variant: "default",
      });

      // Close dialog and reset
      setDeleteDialogOpen(false);
      setTradeToDelete(null);
    } catch (error) {
      console.error("Failed to delete trade:", error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to delete trade. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadCSV = () => {
    if (!sortedTrades) return;

    const headers = [
      "Symbol",
      "Type",
      "Quantity",
      "Price",
      "Total",
      "Date",
      "Notes",
      "Percentage Change",
      "P/L Amount",
    ];

    const csvData = [
      headers.join(","),
      ...sortedTrades.map((trade) =>
        [
          trade.symbol,
          trade.trade_type,
          trade.quantity,
          trade.price.toFixed(2),
          (trade.quantity * trade.price).toFixed(2),
          trade.trade_date,
          trade.notes || "",
          trade.percentage_change || "",
          trade.pl_amount || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trade_history.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSelectedSymbol("All");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  // Sorting logic
  const handleSort = (key: keyof Trade) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Sort trades based on current sort configuration
  const sortedTrades = useMemo(() => {
    if (!sortConfig.key) return tradesWithCalculations;

    return [...tradesWithCalculations].sort((a, b) => {
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
  }, [tradesWithCalculations, sortConfig]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>Loading trade data...</CardDescription>
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>Failed to load trade data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Error loading trades. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const totalTrades = sortedTrades?.length || 0;
  const buyTrades =
    sortedTrades?.filter((t) => t.trade_type === "Buy").length || 0;
  const sellTrades =
    sortedTrades?.filter((t) => t.trade_type === "Sell").length || 0;
  const totalInvested =
    sortedTrades
      ?.filter((t) => t.trade_type === "Buy")
      .reduce((sum, t) => sum + t.quantity * t.price, 0) || 0;
  const totalPL =
    sortedTrades?.reduce((sum, t) => sum + parseFloat(t.pl_amount || "0"), 0) ||
    0;

  return (
    <div className="space-y-4">
      {/* Compact Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </div>

            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Symbols</SelectItem>
                {stockSymbols.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DatePicker
              date={startDate}
              onDateChange={(date) => setStartDate(date)}
              placeholder="Start Date"
            />

            <DatePicker
              date={endDate}
              onDateChange={(date) => setEndDate(date)}
              placeholder="End Date"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="h-8"
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Compact Statistics */}
      <div className="grid gap-3 grid-cols-5">
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Total Trades</div>
          <div className="text-lg font-bold">{totalTrades}</div>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Buy Orders
          </div>
          <div className="text-lg font-bold text-green-500">{buyTrades}</div>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" />
            Sell Orders
          </div>
          <div className="text-lg font-bold text-red-500">{sellTrades}</div>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">
            Total Invested
          </div>
          <div className="text-lg font-bold">
            {formatCurrency(totalInvested)}
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <div className="text-xs text-muted-foreground mb-1">Total P/L</div>
          <div
            className={`text-lg font-bold ${
              totalPL >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {formatCurrency(totalPL)}
          </div>
        </div>
      </div>

      {/* Compact Trade Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Trade History</CardTitle>
              <CardDescription className="text-sm">
                {totalTrades > 0
                  ? `${totalTrades} trades found`
                  : "No trades found"}
              </CardDescription>
            </div>
            {sortedTrades && sortedTrades.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCSV}
                className="h-8"
              >
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {sortedTrades && sortedTrades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead
                    className={`cursor-pointer hover:bg-muted/50 p-2 text-xs font-medium ${
                      sortConfig.key === "symbol" ? "bg-muted/50" : ""
                    }`}
                    onClick={() => handleSort("symbol")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Symbol</span>
                      {sortConfig.key === "symbol" ? (
                        <span className="text-primary text-xs">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer hover:bg-muted/50 p-2 text-xs font-medium ${
                      sortConfig.key === "trade_type" ? "bg-muted/50" : ""
                    }`}
                    onClick={() => handleSort("trade_type")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {sortConfig.key === "trade_type" ? (
                        <span className="text-primary text-xs">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className={`text-right cursor-pointer hover:bg-muted/50 p-2 text-xs font-medium ${
                      sortConfig.key === "quantity" ? "bg-muted/50" : ""
                    }`}
                    onClick={() => handleSort("quantity")}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Qty</span>
                      {sortConfig.key === "quantity" ? (
                        <span className="text-primary text-xs">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className={`text-right cursor-pointer hover:bg-muted/50 p-2 text-xs font-medium ${
                      sortConfig.key === "price" ? "bg-muted/50" : ""
                    }`}
                    onClick={() => handleSort("price")}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Price</span>
                      {sortConfig.key === "price" ? (
                        <span className="text-primary text-xs">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right p-2 text-xs font-medium">
                    Total
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer hover:bg-muted/50 p-2 text-xs font-medium ${
                      sortConfig.key === "trade_date" ? "bg-muted/50" : ""
                    }`}
                    onClick={() => handleSort("trade_date")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {sortConfig.key === "trade_date" ? (
                        <span className="text-primary text-xs">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="p-2 text-xs font-medium">
                    Notes
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer hover:bg-muted/50 p-2 text-xs font-medium ${
                      sortConfig.key === "percentage_change"
                        ? "bg-muted/50"
                        : ""
                    }`}
                    onClick={() => handleSort("percentage_change")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>% Change</span>
                      {sortConfig.key === "percentage_change" ? (
                        <span className="text-primary text-xs">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className={`cursor-pointer hover:bg-muted/50 p-2 text-xs font-medium ${
                      sortConfig.key === "pl_amount" ? "bg-muted/50" : ""
                    }`}
                    onClick={() => handleSort("pl_amount")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>P/L</span>
                      {sortConfig.key === "pl_amount" ? (
                        <span className="text-primary text-xs">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      ) : (
                        <ArrowUpDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-center p-2 text-xs font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTrades.map((trade) => (
                  <TableRow key={trade._id} className="hover:bg-muted/25">
                    <TableCell className="font-medium p-2 text-sm">
                      {trade.symbol}
                    </TableCell>
                    <TableCell className="p-2">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          trade.trade_type === "Buy"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {trade.trade_type === "Buy" ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {trade.trade_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-right p-2 text-sm">
                      {trade.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right p-2 text-sm">
                      {formatCurrency(trade.price)}
                    </TableCell>
                    <TableCell className="text-right font-medium p-2 text-sm">
                      {formatCurrency(trade.quantity * trade.price)}
                    </TableCell>
                    <TableCell className="p-2 text-sm">
                      {format(new Date(trade.trade_date), "MMM dd")}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-24 truncate p-2 text-xs">
                      {trade.notes || "-"}
                    </TableCell>
                    <TableCell
                      className={`font-medium p-2 text-sm ${
                        parseFloat(trade.percentage_change || "0") > 0
                          ? "text-green-600"
                          : parseFloat(trade.percentage_change || "0") < 0
                          ? "text-red-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {trade.percentage_change
                        ? `${trade.percentage_change}%`
                        : "-"}
                    </TableCell>
                    <TableCell
                      className={`font-medium p-2 text-sm ${
                        parseFloat(trade.pl_amount || "0") > 0
                          ? "text-green-600"
                          : parseFloat(trade.pl_amount || "0") < 0
                          ? "text-red-600"
                          : "text-muted-foreground"
                      }`}
                    >
                      {trade.pl_amount
                        ? formatCurrency(parseFloat(trade.pl_amount))
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTrade(trade._id!)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">
                No trades found for the selected filters.
              </p>
              <p className="text-xs mt-1">
                Use the sidebar to log your first trade.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this trade? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteTrade}>
              Delete Trade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
