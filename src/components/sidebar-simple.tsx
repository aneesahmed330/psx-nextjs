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
  Plus,
  Building2,
  Bell,
  DollarSign,
  Activity,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export function SimpleSidebar() {
  const { stocks, mutate: mutateStocks } = useStocks(true);
  const { mutate: mutateTrades } = useTrades();
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
    <div className="w-80 border-r bg-card/30 backdrop-blur-xl p-6 space-y-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center pb-4 border-b">
          <h2 className="text-lg font-semibold">Quick Actions</h2>
          <p className="text-sm text-muted-foreground">Manage your portfolio</p>
        </div>

        {/* Price Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <div className="p-1.5 bg-blue-500/10 rounded-md mr-2">
                <RefreshCw className="h-4 w-4 text-blue-500" />
              </div>
              Market Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        {/* Add Trade */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <div className="p-1.5 bg-green-500/10 rounded-md mr-2">
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              Trade Management
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                          setTradeForm((prev) => ({ ...prev, symbol: value }))
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
          </CardContent>
        </Card>

        {/* Add Alert */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <div className="p-1.5 bg-yellow-500/10 rounded-md mr-2">
                <Bell className="h-4 w-4 text-yellow-500" />
              </div>
              Price Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isAddingAlert} onOpenChange={setIsAddingAlert}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Alert
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Price Alert</DialogTitle>
                  <DialogDescription>
                    Get notified when a stock hits your target price
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

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingAlert(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddAlert}>Create Alert</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Add Stock */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <div className="p-1.5 bg-purple-500/10 rounded-md mr-2">
                <Activity className="h-4 w-4 text-purple-500" />
              </div>
              Stock Management
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
