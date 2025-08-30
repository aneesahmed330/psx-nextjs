"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAlerts, usePortfolio, api } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Bell, BellOff, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { Alert } from "@/types";

export function AlertsManagement() {
  const { alerts, loading, error, mutate } = useAlerts();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState<Alert | null>(null);

  // Get portfolio data to show current prices
  const { portfolio } = usePortfolio();

  // Helper function to get current price for a symbol
  const getCurrentPrice = (symbol: string) => {
    if (!portfolio) return null;
    const holding = portfolio.find((h) => h.symbol === symbol);
    return holding?.latest_price || null;
  };

  // Helper function to calculate percentage from range
  const calculatePercentageFromRange = (
    currentPrice: number,
    minPrice: number,
    maxPrice: number
  ) => {
    if (currentPrice >= minPrice && currentPrice <= maxPrice) {
      return { value: 0, status: "within" }; // Within range
    }

    if (currentPrice < minPrice) {
      // Below min price
      const percentage = ((minPrice - currentPrice) / minPrice) * 100;
      return { value: percentage, status: "below" };
    } else {
      // Above max price
      const percentage = ((currentPrice - maxPrice) / maxPrice) * 100;
      return { value: percentage, status: "above" };
    }
  };

  const handleToggleAlert = async (alert: Alert) => {
    try {
      await api.updateAlert(
        {
          symbol: alert.symbol,
          min_price: alert.min_price,
          max_price: alert.max_price,
          enabled: !alert.enabled,
        },
        "toggle"
      );
      mutate();

      // Show success toast
      toast({
        title: "Alert Updated",
        description: `Alert for ${alert.symbol} has been ${
          !alert.enabled ? "enabled" : "disabled"
        }.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to toggle alert:", error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to update alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleTrigger = async (alert: Alert) => {
    try {
      await api.updateAlert(
        {
          symbol: alert.symbol,
          min_price: alert.min_price,
          max_price: alert.max_price,
          trigger: !alert.trigger,
        },
        "trigger"
      );
      mutate();

      // Show success toast
      toast({
        title: "Trigger Updated",
        description: `Alert trigger for ${alert.symbol} has been ${
          !alert.trigger ? "set" : "reset"
        }.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to toggle trigger:", error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to update alert trigger. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAlert = async (alert: Alert) => {
    setAlertToDelete(alert);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAlert = async () => {
    if (!alertToDelete) return;

    try {
      await api.deleteAlert({
        symbol: alertToDelete.symbol,
        min_price: alertToDelete.min_price,
        max_price: alertToDelete.max_price,
      });
      mutate();

      // Show success toast
      toast({
        title: "Alert Deleted",
        description: `Price alert for ${alertToDelete.symbol} has been removed.`,
        variant: "default",
      });

      // Close dialog and reset
      setDeleteDialogOpen(false);
      setAlertToDelete(null);
    } catch (error) {
      console.error("Failed to delete alert:", error);

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to delete alert. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts Management</CardTitle>
          <CardDescription>Loading your price alerts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alerts Management</CardTitle>
          <CardDescription>Failed to load alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">
            Error loading alerts. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Statistics - Moved to top */}
      {alerts && alerts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Alerts
              </CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Alerts
              </CardTitle>
              <Bell className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {alerts.filter((a) => a.enabled).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Triggered</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {alerts.filter((a) => a.trigger).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Outside Range
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {(() => {
                  if (!portfolio) return 0;
                  return alerts.filter((alert) => {
                    const currentPrice = getCurrentPrice(alert.symbol);
                    if (currentPrice === null) return false;
                    return (
                      currentPrice < alert.min_price ||
                      currentPrice > alert.max_price
                    );
                  }).length;
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Price Alerts</span>
          </CardTitle>
          <CardDescription>
            Manage your price alerts and notifications. The Percentage column
            shows how far the current price is from your alert range.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {alerts && alerts.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-medium p-3 text-sm">
                      Symbol
                    </TableHead>
                    <TableHead className="font-medium p-3 text-sm">
                      Status
                    </TableHead>
                    <TableHead className="font-medium p-3 text-sm">
                      Price Range
                    </TableHead>
                    <TableHead className="font-medium p-3 text-sm">
                      Latest Price
                    </TableHead>
                    <TableHead className="font-medium p-3 text-sm">
                      Percentage
                    </TableHead>
                    <TableHead className="font-medium p-3 text-sm">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert, index) => (
                    <TableRow key={index} className="hover:bg-muted/25">
                      <TableCell className="font-medium p-3">
                        {alert.symbol}
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center space-x-2">
                          {alert.enabled ? (
                            <>
                              <Bell className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Enabled</span>
                            </>
                          ) : (
                            <>
                              <BellOff className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Disabled
                              </span>
                            </>
                          )}
                          {alert.trigger && (
                            <>
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <span className="text-red-600">Triggered</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-3">
                        {formatCurrency(alert.min_price)} -{" "}
                        {formatCurrency(alert.max_price)}
                      </TableCell>
                      <TableCell className="p-3">
                        {(() => {
                          const currentPrice = getCurrentPrice(alert.symbol);
                          if (currentPrice === null) {
                            return (
                              <span className="text-muted-foreground">N/A</span>
                            );
                          }
                          return (
                            <span className="font-medium">
                              {formatCurrency(currentPrice)}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="p-3">
                        {(() => {
                          const currentPrice = getCurrentPrice(alert.symbol);
                          if (currentPrice === null) {
                            return (
                              <span className="text-muted-foreground">N/A</span>
                            );
                          }

                          const percentageInfo = calculatePercentageFromRange(
                            currentPrice,
                            alert.min_price,
                            alert.max_price
                          );

                          if (percentageInfo.status === "within") {
                            return (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-600 font-medium">
                                  Within Range
                                </span>
                              </div>
                            );
                          }

                          const color =
                            percentageInfo.status === "below"
                              ? "text-red-600"
                              : "text-orange-600";
                          const bgColor =
                            percentageInfo.status === "below"
                              ? "bg-red-500"
                              : "bg-orange-500";
                          const icon =
                            percentageInfo.status === "below" ? "↓" : "↑";
                          const tooltip =
                            percentageInfo.status === "below"
                              ? `${percentageInfo.value.toFixed(
                                  1
                                )}% below minimum price`
                              : `${percentageInfo.value.toFixed(
                                  1
                                )}% above maximum price`;

                          return (
                            <div
                              className="flex items-center space-x-1"
                              title={tooltip}
                            >
                              <div
                                className={`w-2 h-2 ${bgColor} rounded-full`}
                              ></div>
                              <span className={`${color} font-medium`}>
                                {icon} {percentageInfo.value.toFixed(1)}%
                              </span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="p-3">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleAlert(alert)}
                            className="h-8"
                          >
                            {alert.enabled ? "Disable" : "Enable"}
                          </Button>
                          {alert.trigger && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleTrigger(alert)}
                              className="h-8"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" />
                              Reset
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteAlert(alert)}
                            className="h-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">No price alerts configured yet.</p>
              <p className="text-xs mt-1">
                Use the sidebar to create your first price alert.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Price Alert</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the price alert for{" "}
              <span className="font-semibold text-foreground">
                {alertToDelete?.symbol}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAlert}>
              Delete Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
