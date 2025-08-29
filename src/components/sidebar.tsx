"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { useStocks, useTrades, api } from "@/lib/hooks";
import {
  RefreshCw,
  Plus,
  Building2,
  Bell,
  Trash2,
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  X,
} from "lucide-react";

export function Sidebar() {
  const { stocks, mutate: mutateStocks } = useStocks(true);
  const { mutate: mutateTrades } = useTrades();
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [isAddingTrade, setIsAddingTrade] = useState(false);
  const [isAddingAlert, setIsAddingAlert] = useState(false);
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
  });

  const stockSymbols = stocks?.map((s) => s.symbol) || [];

  const handleAddStock = async () => {
    if (!newStock.trim()) return;

    try {
      await api.addStock(newStock.trim());
      setNewStock("");
      setIsAddingStock(false);
      mutateStocks();
    } catch (error) {
      console.error("Failed to add stock:", error);
    }
  };

  const handleDeleteStock = async (symbol: string) => {
    try {
      await api.deleteStock(symbol);
      mutateStocks();
    } catch (error) {
      console.error("Failed to delete stock:", error);
    }
  };

  const handleAddTrade = async () => {
    try {
      await api.addTrade({
        symbol: tradeForm.symbol,
        trade_type: tradeForm.trade_type,
        quantity: parseFloat(tradeForm.quantity),
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
    } catch (error) {
      console.error("Failed to add trade:", error);
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
      });

      setAlertForm({
        symbol: "",
        min_price: "",
        max_price: "",
        enabled: true,
      });
      setIsAddingAlert(false);
    } catch (error) {
      console.error("Failed to add alert:", error);
    }
  };

  return (
    <div className="w-80 border-r bg-muted/40 p-6 space-y-6 overflow-y-auto">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">PSX Portfolio</h2>
        <p className="text-sm text-muted-foreground">Investment Tracker</p>
      </div>

      {/* Price Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Price Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm" className="w-full">
            <TrendingUp className="h-4 w-4 mr-2" />
            Fetch Latest Prices
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Building2 className="h-4 w-4 mr-2" />
            Fetch Company Info
          </Button>
        </CardContent>
      </Card>

      {/* Add Trade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Log Trade</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isAddingTrade} onOpenChange={setIsAddingTrade}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Trade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Trade</DialogTitle>
                <DialogDescription>
                  Record a new buy or sell transaction
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Select
                    value={tradeForm.symbol}
                    onValueChange={(value) =>
                      setTradeForm((prev) => ({ ...prev, symbol: value }))
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

                <div>
                  <Label htmlFor="trade_type">Type</Label>
                  <Select
                    value={tradeForm.trade_type}
                    onValueChange={(value: "Buy" | "Sell") =>
                      setTradeForm((prev) => ({ ...prev, trade_type: value }))
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      step="1"
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
                  <Label htmlFor="notes">Notes (optional)</Label>
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

                <Button onClick={handleAddTrade} className="w-full">
                  Add Trade
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Price Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Price Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Dialog open={isAddingAlert} onOpenChange={setIsAddingAlert}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Price Alert</DialogTitle>
                <DialogDescription>
                  Get notified when a stock reaches your target price
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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

                <Button onClick={handleAddAlert} className="w-full">
                  Create Alert
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Manage Stocks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span>Manage Stocks</span>
          </CardTitle>
          <CardDescription>
            Add or remove stock symbols for tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Add Stock */}
          <Dialog open={isAddingStock} onOpenChange={setIsAddingStock}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Symbol
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Stock Symbol</DialogTitle>
                <DialogDescription>
                  Add a new stock symbol for analytics and tracking
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new_stock">Stock Symbol</Label>
                  <Input
                    id="new_stock"
                    placeholder="e.g. HBL, DCR, etc."
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                </div>
                <Button onClick={handleAddStock} className="w-full">
                  Add Symbol
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Stock List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stockSymbols.map((symbol) => (
              <div
                key={symbol}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm font-medium">{symbol}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteStock(symbol)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {stockSymbols.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No stocks added yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
