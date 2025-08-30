"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useStocks, useTrades, usePortfolio, api } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Building2,
  Bell,
  DollarSign,
  Activity,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

interface CollapsibleSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function CollapsibleSidebar({
  isCollapsed,
  onToggle,
}: CollapsibleSidebarProps) {
  const { stocks, mutate: mutateStocks } = useStocks(true);
  const { mutate: mutateTrades } = useTrades();
  const { portfolio } = usePortfolio();
  const { toast } = useToast();
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [newStock, setNewStock] = useState("");

  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    trade_type: "Buy" as "Buy" | "Sell",
    quantity: "",
    price: "",
    trade_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [alertForm, setAlertForm] = useState({
    symbol: "",
    min_price: "",
    max_price: "",
    enabled: true,
    trade_type: "Sell" as "Buy" | "Sell",
    quantity: "",
    notes: "",
  });

  const stockSymbols = stocks?.map((s) => s.symbol) || [];

  // Helper functions for alert calculations
  const getCurrentPrice = (symbol: string) => {
    if (!portfolio) return null;
    const holding = portfolio.find((h) => h.symbol === symbol);
    return holding?.latest_price || null;
  };

  const getAverageBuyPrice = (symbol: string) => {
    if (!portfolio) return null;
    const holding = portfolio.find((h) => h.symbol === symbol);
    return holding?.avg_buy_price || null;
  };

  const getSharesHeld = (symbol: string) => {
    if (!portfolio) return null;
    const holding = portfolio.find((h) => h.symbol === symbol);
    return holding?.shares_held || null;
  };

  // Calculate potential P&L for sell alerts
  const calculatePotentialPnL = (
    symbol: string,
    alertPrice: number,
    quantity: number
  ) => {
    const avgBuyPrice = getAverageBuyPrice(symbol);
    if (!avgBuyPrice) return null;

    const profitPerShare = alertPrice - avgBuyPrice;
    const totalPnL = profitPerShare * quantity;
    return { profitPerShare, totalPnL };
  };

  // Calculate new average buy price for buy alerts
  const calculateNewAveragePrice = (
    symbol: string,
    alertPrice: number,
    quantity: number
  ) => {
    const currentShares = getSharesHeld(symbol);
    const avgBuyPrice = getAverageBuyPrice(symbol);
    if (!currentShares || !avgBuyPrice) return null;

    const currentTotalValue = currentShares * avgBuyPrice;
    const newSharesValue = quantity * alertPrice;
    const totalShares = currentShares + quantity;
    const newAveragePrice = (currentTotalValue + newSharesValue) / totalShares;

    return { newAveragePrice, totalShares };
  };

  const handleAddStock = async () => {
    if (!newStock.trim()) return;

    try {
      await api.addStock(newStock.trim());
      setNewStock("");
      setIsAddingStock(false);
      mutateStocks();

      // Show success toast
      toast({
        title: "Stock Added",
        description: `${newStock.toUpperCase()} has been added to your stock list.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to add stock:", error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to add stock. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTrade = async () => {
    try {
      await api.addTrade({
        symbol: tradeForm.symbol,
        trade_type: tradeForm.trade_type,
        quantity: parseInt(tradeForm.quantity),
        price: parseFloat(tradeForm.price),
        trade_date: tradeForm.trade_date,
        notes: tradeForm.notes,
      });

      setTradeForm({
        symbol: "",
        trade_type: "Buy",
        quantity: "",
        price: "",
        trade_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setIsAddingTrade(false);
      mutateTrades();

      // Show success toast
      toast({
        title: "Trade Logged",
        description: `${tradeForm.trade_type} trade for ${tradeForm.symbol} has been logged successfully.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to add trade:", error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to log trade. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddAlert = async () => {
    try {
      await api.addAlert({
        symbol: alertForm.symbol,
        min_price: parseFloat(alertForm.min_price),
        max_price: parseFloat(alertForm.max_price),
        enabled: alertForm.enabled,
        trigger: false,
        trade_type: alertForm.trade_type,
        quantity: alertForm.quantity ? parseInt(alertForm.quantity) : undefined,
        notes: alertForm.notes,
      });

      setAlertForm({
        symbol: "",
        min_price: "",
        max_price: "",
        enabled: true,
        trade_type: "Sell",
        quantity: "",
        notes: "",
      });
      setIsAddingAlert(false);

      // Show success toast
      toast({
        title: "Alert Created",
        description: `Price alert for ${alertForm.symbol} has been created successfully.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to add alert:", error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to create price alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={` bg-card/30 backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden ${
        isCollapsed ? "w-16" : "w-80"
      }`}
    >
      {/* Sidebar Content */}
      <div
        className={`p-6 space-y-6 overflow-y-auto h-full ${
          isCollapsed ? "hidden" : "block"
        }`}
      >
        {/* Header */}
        <div className="text-center pb-4">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage your portfolio
          </p>
          <div className="w-full h-px bg-border"></div>
        </div>

        {/* Accordion for collapsible sections */}
        <Accordion type="multiple" className="space-y-4">
          {/* Market Data Section */}
          <AccordionItem value="market-data" className="border-0">
            <div className="bg-card rounded-lg border shadow-sm">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center">
                  <div className="p-1.5 bg-blue-500/10 rounded-md mr-3">
                    <RefreshCw className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-base font-medium">Market Data</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    size="sm"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Fetch Latest Prices
                  </Button>
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    size="sm"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Update Company Info
                  </Button>
                </div>
              </AccordionContent>
            </div>
          </AccordionItem>

          {/* Trade Management Section */}
          <AccordionItem value="trade-management" className="border-0">
            <div className="bg-card rounded-lg border shadow-sm">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center">
                  <div className="p-1.5 bg-green-500/10 rounded-md mr-3">
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-base font-medium">
                    Trade Management
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <Dialog open={isAddingTrade} onOpenChange={setIsAddingTrade}>
                  <DialogTrigger asChild>
                    <Button variant="default" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Log New Trade
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Trade</DialogTitle>
                      <DialogDescription>
                        Record a new buy or sell transaction
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="symbol">Symbol</Label>
                          <Select
                            value={tradeForm.symbol}
                            onValueChange={(value) =>
                              setTradeForm((prev) => ({
                                ...prev,
                                symbol: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {stockSymbols.map((symbol) => (
                                <SelectItem key={symbol} value={symbol}>
                                  {symbol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="trade_type">Type</Label>
                          <Select
                            value={tradeForm.trade_type}
                            onValueChange={(value: "Buy" | "Sell") =>
                              setTradeForm((prev) => ({
                                ...prev,
                                trade_type: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Buy">Buy</SelectItem>
                              <SelectItem value="Sell">Sell</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={tradeForm.quantity}
                            onChange={(e) =>
                              setTradeForm((prev) => ({
                                ...prev,
                                quantity: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={tradeForm.price}
                            onChange={(e) =>
                              setTradeForm((prev) => ({
                                ...prev,
                                price: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="trade_date">Date</Label>
                        <Input
                          id="trade_date"
                          type="date"
                          value={tradeForm.trade_date}
                          onChange={(e) =>
                            setTradeForm((prev) => ({
                              ...prev,
                              trade_date: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          placeholder="Trade notes"
                          value={tradeForm.notes}
                          onChange={(e) =>
                            setTradeForm((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddingTrade(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddTrade}>Add Trade</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </AccordionContent>
            </div>
          </AccordionItem>

          {/* Price Alerts Section */}
          <AccordionItem value="price-alerts" className="border-0">
            <div className="bg-card rounded-lg border shadow-sm">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center">
                  <div className="p-1.5 bg-yellow-500/10 rounded-md mr-3">
                    <Bell className="h-4 w-4 text-yellow-500" />
                  </div>
                  <span className="text-base font-medium">Price Alerts</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <Dialog open={isAddingAlert} onOpenChange={setIsAddingAlert}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Alert
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg bg-black border-gray-800 text-white">
                    <DialogHeader>
                      <DialogTitle>Create Price Alert</DialogTitle>
                      <DialogDescription>
                        Get notified when a stock hits your target price with
                        trade planning
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Symbol Selection */}
                      <div>
                        <Label htmlFor="alert_symbol">Symbol</Label>
                        <Select
                          value={alertForm.symbol}
                          onValueChange={(value) =>
                            setAlertForm((prev) => ({ ...prev, symbol: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select symbol" />
                          </SelectTrigger>
                          <SelectContent>
                            {stockSymbols.map((symbol) => (
                              <SelectItem key={symbol} value={symbol}>
                                {symbol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Current Price Display */}
                      {alertForm.symbol && (
                        <div className="grid grid-cols-3 gap-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Current Price
                            </Label>
                            <div className="text-lg font-semibold">
                              {(() => {
                                const currentPrice = getCurrentPrice(
                                  alertForm.symbol
                                );
                                return currentPrice
                                  ? formatCurrency(currentPrice)
                                  : "N/A";
                              })()}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Avg Buy Price
                            </Label>
                            <div className="text-lg font-semibold">
                              {(() => {
                                const avgPrice = getAverageBuyPrice(
                                  alertForm.symbol
                                );
                                return avgPrice
                                  ? formatCurrency(avgPrice)
                                  : "N/A";
                              })()}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Shares Held
                            </Label>
                            <div className="text-lg font-semibold">
                              {(() => {
                                const sharesHeld = getSharesHeld(
                                  alertForm.symbol
                                );
                                return sharesHeld ? sharesHeld : "N/A";
                              })()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Price Range */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="min_price">Min Price</Label>
                          <Input
                            id="min_price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Alert if below"
                            value={alertForm.min_price}
                            onChange={(e) =>
                              setAlertForm((prev) => ({
                                ...prev,
                                min_price: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div>
                          <Label htmlFor="max_price">Max Price</Label>
                          <Input
                            id="max_price"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Alert if above"
                            value={alertForm.max_price}
                            onChange={(e) =>
                              setAlertForm((prev) => ({
                                ...prev,
                                max_price: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      {/* Trade Type and Quantity */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="trade_type">Trade Type</Label>
                          <Select
                            value={alertForm.trade_type}
                            onValueChange={(value: "Buy" | "Sell") =>
                              setAlertForm((prev) => ({
                                ...prev,
                                trade_type: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sell">Sell</SelectItem>
                              <SelectItem value="Buy">Buy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Number of shares"
                            value={alertForm.quantity}
                            onChange={(e) =>
                              setAlertForm((prev) => ({
                                ...prev,
                                quantity: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          placeholder="Add notes about this alert"
                          value={alertForm.notes}
                          onChange={(e) =>
                            setAlertForm((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                        />
                      </div>

                      {/* Smart Calculations Display */}
                      {alertForm.symbol &&
                        alertForm.min_price &&
                        alertForm.max_price &&
                        alertForm.quantity && (
                          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                            <h4 className="font-medium mb-3 text-sm">
                              📊 Alert Analysis
                            </h4>

                            {(() => {
                              const currentPrice = getCurrentPrice(
                                alertForm.symbol
                              );
                              const minPrice = parseFloat(alertForm.min_price);
                              const maxPrice = parseFloat(alertForm.max_price);
                              const quantity = parseInt(alertForm.quantity);

                              if (
                                !currentPrice ||
                                !minPrice ||
                                !maxPrice ||
                                !quantity
                              )
                                return null;

                              if (alertForm.trade_type === "Sell") {
                                // Sell Alert Analysis
                                const targetPrice = maxPrice; // Sell at max price
                                const pnlInfo = calculatePotentialPnL(
                                  alertForm.symbol,
                                  targetPrice,
                                  quantity
                                );

                                if (!pnlInfo)
                                  return (
                                    <div className="text-muted-foreground text-sm">
                                      Insufficient data for calculation
                                    </div>
                                  );

                                const percentageChange =
                                  ((targetPrice - currentPrice) /
                                    currentPrice) *
                                  100;
                                const isProfitable = pnlInfo.totalPnL > 0;

                                return (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span>Price needs to go:</span>
                                      <span
                                        className={`font-medium ${
                                          percentageChange > 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {percentageChange > 0 ? "↑" : "↓"}{" "}
                                        {Math.abs(percentageChange).toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Profit per share:</span>
                                      <span
                                        className={`font-medium ${
                                          isProfitable
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {formatCurrency(pnlInfo.profitPerShare)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Total P&L:</span>
                                      <span
                                        className={`font-medium ${
                                          isProfitable
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {formatCurrency(pnlInfo.totalPnL)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              } else {
                                // Buy Alert Analysis
                                const targetPrice = minPrice; // Buy at min price
                                const avgInfo = calculateNewAveragePrice(
                                  alertForm.symbol,
                                  targetPrice,
                                  quantity
                                );

                                if (!avgInfo)
                                  return (
                                    <div className="text-muted-foreground text-sm">
                                      Insufficient data for calculation
                                    </div>
                                  );

                                const percentageChange =
                                  ((targetPrice - currentPrice) /
                                    currentPrice) *
                                  100;

                                return (
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span>Price needs to go:</span>
                                      <span
                                        className={`font-medium ${
                                          percentageChange > 0
                                            ? "text-green-600"
                                            : "text-red-600"
                                        }`}
                                      >
                                        {percentageChange > 0 ? "↑" : "↓"}{" "}
                                        {Math.abs(percentageChange).toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>New avg buy price:</span>
                                      <span className="font-medium text-blue-600">
                                        {formatCurrency(
                                          avgInfo.newAveragePrice
                                        )}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Total shares after:</span>
                                      <span className="font-medium text-blue-600">
                                        {avgInfo.totalShares}
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}

                      {/* Validation Messages */}
                      {(() => {
                        const errors = [];
                        if (
                          alertForm.symbol &&
                          alertForm.min_price &&
                          alertForm.max_price
                        ) {
                          const minPrice = parseFloat(alertForm.min_price);
                          const maxPrice = parseFloat(alertForm.max_price);

                          if (minPrice >= maxPrice) {
                            errors.push(
                              "Min price must be less than max price"
                            );
                          }

                          if (alertForm.quantity) {
                            const quantity = parseInt(alertForm.quantity);
                            const sharesHeld = getSharesHeld(alertForm.symbol);

                            if (
                              alertForm.trade_type === "Sell" &&
                              sharesHeld &&
                              quantity > sharesHeld
                            ) {
                              errors.push(
                                `Cannot sell more shares than you own (${sharesHeld})`
                              );
                            }
                          }
                        }

                        if (errors.length > 0) {
                          return (
                            <div className="p-3 bg-red-950/30 border border-red-800 rounded-lg">
                              {errors.map((error, index) => (
                                <div
                                  key={index}
                                  className="text-red-400 text-sm"
                                >
                                  ⚠️ {error}
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddingAlert(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddAlert}
                          disabled={
                            !alertForm.symbol ||
                            !alertForm.min_price ||
                            !alertForm.max_price ||
                            !alertForm.quantity
                          }
                        >
                          Create Alert
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </AccordionContent>
            </div>
          </AccordionItem>

          {/* Stock Management Section */}
          <AccordionItem value="stock-management" className="border-0">
            <div className="bg-card rounded-lg border shadow-sm">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center">
                  <div className="p-1.5 bg-purple-500/10 rounded-md mr-3">
                    <Activity className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-base font-medium">
                    Stock Management
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <Dialog open={isAddingStock} onOpenChange={setIsAddingStock}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Stock Symbol
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Stock Symbol</DialogTitle>
                      <DialogDescription>
                        Add a new stock symbol to track
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="new_stock">Stock Symbol</Label>
                        <Input
                          id="new_stock"
                          placeholder="e.g., MARI, TRG, LUCK"
                          value={newStock}
                          onChange={(e) =>
                            setNewStock(e.target.value.toUpperCase())
                          }
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsAddingStock(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddStock}>Add Symbol</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </AccordionContent>
            </div>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Collapsed state icons */}
      {isCollapsed && (
        <div className="p-2 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full p-3 h-auto"
            title="Market Data"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full p-3 h-auto"
            title="Trade Management"
          >
            <DollarSign className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full p-3 h-auto"
            title="Price Alerts"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full p-3 h-auto"
            title="Stock Management"
          >
            <Activity className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
