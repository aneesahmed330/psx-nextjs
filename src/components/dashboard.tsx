"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { usePortfolio } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Navbar } from "@/components/navbar";
import { CollapsibleSidebar } from "@/components/collapsible-sidebar";
import { PortfolioOverview } from "@/components/portfolio-overview";
import { PortfolioDetails } from "@/components/portfolio-details";
import { PerformanceAnalytics } from "@/components/performance-analytics";
import { TradeHistory } from "@/components/trade-history";
import { StocksAnalysis } from "@/components/stocks-analysis";
import { AlertsManagement } from "@/components/alerts-management";
import { Loader2 } from "lucide-react";

export function Dashboard() {
  const { user, logout } = useAuth();
  const { portfolio, summary, loading, error } = usePortfolio();
  const [activeTab, setActiveTab] = useState("portfolio");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Connection Error</CardTitle>
            <CardDescription>
              Failed to load portfolio data. Please check your connection and
              try again.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => window.location.reload()} className="w-full">
              Reload Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Professional Navbar */}
        <Navbar
          summary={summary}
          onTabChange={setActiveTab}
          activeTab={activeTab}
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />

        <div className="flex">
          {/* Collapsible Sidebar - Hidden on mobile */}
          <div className="hidden lg:block">
            <CollapsibleSidebar
              isCollapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto p-6 space-y-8">
              {/* Portfolio Overview - Always visible */}
              <PortfolioOverview summary={summary} />

              {/* Content based on active tab */}
              <div className="space-y-8">
                {activeTab === "portfolio" && (
                  <PortfolioDetails portfolio={portfolio} />
                )}

                {activeTab === "analytics" && (
                  <PerformanceAnalytics
                    portfolio={portfolio}
                    summary={summary}
                  />
                )}

                {activeTab === "trades" && <TradeHistory />}

                {activeTab === "stocks" && <StocksAnalysis />}

                {activeTab === "alerts" && <AlertsManagement />}
              </div>
            </div>
          </main>
        </div>
      </div>
      <Toaster />
    </TooltipProvider>
  );
}
