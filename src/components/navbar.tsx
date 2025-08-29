"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { PortfolioSummary } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Menu,
  TrendingUp,
  User,
  LogOut,
  X,
  BarChart3,
  Wallet,
  Activity,
  Bell,
  DollarSign,
  Building2,
  RefreshCw,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

interface NavbarProps {
  summary?: PortfolioSummary;
  onTabChange?: (tab: string) => void;
  activeTab?: string;
  onSidebarToggle?: () => void;
  sidebarCollapsed?: boolean;
}

export function Navbar({
  summary,
  onTabChange,
  activeTab,
  onSidebarToggle,
  sidebarCollapsed,
}: NavbarProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    {
      id: "portfolio",
      label: "Portfolio",
      icon: Wallet,
      description: "View your holdings",
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Performance insights",
    },
    {
      id: "trades",
      label: "Trades",
      icon: Activity,
      description: "Transaction history",
    },
    {
      id: "stocks",
      label: "Stocks",
      icon: Building2,
      description: "Stock analytics & comparison",
    },
    {
      id: "alerts",
      label: "Alerts",
      icon: Bell,
      description: "Price notifications",
    },
  ];

  const quickActions = [
    {
      label: "Add Trade",
      icon: Plus,
      action: () => {
        // This will be handled by parent component
        setIsOpen(false);
      },
    },
    {
      label: "Fetch Prices",
      icon: RefreshCw,
      action: () => {
        // This will be handled by parent component
        setIsOpen(false);
      },
    },
    {
      label: "Company Info",
      icon: Building2,
      action: () => {
        // This will be handled by parent component
        setIsOpen(false);
      },
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Left side - Logo and title */}
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <span>PSX Portfolio</span>
                </SheetTitle>
                <SheetDescription>
                  Manage your investments and track performance
                </SheetDescription>
              </SheetHeader>

              <div className="mt-8 space-y-6">
                {/* Navigation */}
                <div>
                  <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                    Navigation
                  </h3>
                  <div className="space-y-2">
                    {navItems.map((item) => (
                      <Button
                        key={item.id}
                        variant={activeTab === item.id ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => {
                          onTabChange?.(item.id);
                          setIsOpen(false);
                        }}
                      >
                        <item.icon className="mr-3 h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Quick Actions */}
                <div>
                  <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={action.action}
                      >
                        <action.icon className="mr-3 h-4 w-4" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* User Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Signed in as</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop sidebar toggle button */}
          {onSidebarToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSidebarToggle}
              className="hidden lg:flex"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
          )}

          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                PSX Portfolio
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Investment Dashboard
              </p>
            </div>
          </div>
        </div>

        {/* Center - Desktop Navigation */}
        <div className="hidden md:flex flex-1 justify-center">
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onTabChange?.(item.id)}
                className="flex items-center space-x-2"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Button>
            ))}
          </nav>
        </div>

        {/* Right side - Portfolio info and user */}
        <div className="flex items-center space-x-4">
          {/* Portfolio Summary */}
          {summary && (
            <div className="hidden lg:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge
                  variant={
                    summary.total_percent_updown >= 0
                      ? "success"
                      : "destructive"
                  }
                >
                  {summary.total_percent_updown >= 0 ? "+" : ""}
                  {summary.total_percent_updown.toFixed(2)}%
                </Badge>
                <span className="text-sm text-muted-foreground">P&L</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="text-sm">
                <span className="text-muted-foreground">Value: </span>
                <span className="font-medium">
                  {formatCurrency(summary.total_market_value)}
                </span>
              </div>
            </div>
          )}

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
